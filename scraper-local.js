/* ==========================================
SCRAPER LOCAL JOBUP - JOB FINDER VAUD
Scrape Jobup depuis ton PC et sauvegarde 
directement dans offers.json du projet
Usage: node scraper-local.js
========================================== */

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const RENDER_URL = "https://jobfinder-vaud-v7-1.onrender.com";
const OFFERS_FILE = path.join(__dirname, "offers.json");

const SEARCH_KEYWORDS = [
"assistant administratif",
"assistante administrative",
"gestionnaire de dossier",
"gestionnaire administratif",
"collaborateur administratif",
"secrétaire",
"secrétaire administratif",
"employé de commerce",
"technicien informatique",
"support informatique",
"helpdesk",
"back-office"
];

const VAUD_REGION = "52";
const DELAY = 800;

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

function normalizeText(str){
return String(str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function looksLikeWantedJob(title){
const v = normalizeText(title);
const excluded = [
"gestionnaire de vente","commerce de detail","conseiller de vente",
"vendeur","vendeuse","chef de rayon","responsable de rayon",
"assistante medicale","assistant medical","assistant rh","assistante rh",
"infirmier","infirmiere","aide soignant"
];
if(excluded.some(e => v.includes(e))) return false;
const keywords = [
"employe de commerce","assistant administratif","assistante administrative",
"gestionnaire de dossier","gestionnaire administratif","collaborateur administratif",
"technicien informatique","support informatique","helpdesk","back office","back-office",
"secretaire","coordinateur administratif","assistant de direction","employe administratif"
];
return keywords.some(k => v.includes(k));
}

async function fetchJobupPage(url){
const response = await axios.get(url, {
headers: {
"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
"Accept-Language": "fr-CH,fr;q=0.9,en;q=0.8",
"Accept-Encoding": "gzip, deflate, br",
"Cache-Control": "no-cache",
"Referer": "https://www.google.com/",
"Sec-Fetch-Dest": "document",
"Sec-Fetch-Mode": "navigate",
"Sec-Fetch-Site": "cross-site"
},
timeout: 30000,
responseType: "text"
});
return response.data;
}

async function scrapeListPage(keyword){
const encodedKeyword = encodeURIComponent(keyword);
const url = `https://www.jobup.ch/fr/emplois/?region=${VAUD_REGION}&term=${encodedKeyword}`;
console.log(`  Scraping: "${keyword}"...`);
const html = await fetchJobupPage(url);
const linkMatches = html.match(/href="(\/fr\/emplois\/detail\/[a-z0-9-]+\/)"/g) || [];
const urls = [...new Set(linkMatches.map(m => m.replace(/href="|"/g, "")))];
console.log(`  → ${urls.length} offres trouvées`);
return urls;
}

async function extractDescriptionWithPuppeteer(offerPath, browser){
const url = `https://www.jobup.ch${offerPath}`;
const page = await browser.newPage();
try {
await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
const text = await page.evaluate(() => document.body.innerText);
const start = text.indexOf("À propos de cette offre");
const end = ['Offres similaires', 'Postuler maintenant', 'Comment postuler', 'Partager cette offre', 'Signaler cette offre'].reduce((found, marker) => {
const idx = text.indexOf(marker, start);
return (idx > -1 && (found === -1 || idx < found)) ? idx : found;
}, -1);
if(start > -1){
const desc = text.substring(start + 23, end > -1 ? end : start + 8000).trim();
return desc.length > 50 ? desc : "Descriptif non disponible.";
}
return "Descriptif non disponible.";
} catch(e) {
return "Descriptif non disponible.";
} finally {
await page.close();
}
}

async function scrapeDetailPage(offerPath, browser, existingOffersMap){
const jobId = (offerPath.match(/detail\/([^/]+)\//) || [])[1] || String(Date.now());

// OPTION D : skip si offre déjà connue avec une vraie description
const existing = existingOffersMap[jobId];
if(existing && existing.description && existing.description !== "Descriptif non disponible."){
process.stdout.write(` ♻️ (déjà scrapée)\n`);
return existing;
}

const url = `https://www.jobup.ch${offerPath}`;
const html = await fetchJobupPage(url);

/* Essai 1 : extraction depuis le JSON __INIT__ de Jobup */
const initMatch = html.match(/__INIT__\s*=\s*(\{[\s\S]*?\});\s*(?:__LOAD_LAZY__|__LOCALE__|<\/script>)/);
if(initMatch){
try{
const data = JSON.parse(initMatch[1]);
const job = data?.vacancy?.detail?.vacancy;
if(job){
const title = job.title || "";
if(!looksLikeWantedJob(title)) return null;

const company = job.company?.name || "";
const street = (job.street || "").trim();
const zipCode = (job.zipCode || "").trim();
const place = (job.place || "").trim();
const addressParts = [];
if(street && street.length < 60) addressParts.push(street);
if(zipCode) addressParts.push(`${zipCode} ${place}`.trim());
const address = addressParts.length > 0 ? addressParts.join(", ") : "";
const location = place || "Vaud";

const vaudWords = ["lausanne","vaud","morges","nyon","vevey","renens","yverdon","prilly","crissier","pully","bussigny","gland","rolle","montreux","aigle","villeneuve"];
const textLower = (title + " " + location + " " + company).toLowerCase();
if(!vaudWords.some(v => textLower.includes(v))) return null;

const grades = job.employmentGrades || [];
const rate = grades.length === 2
? grades[0] === grades[1] ? `${grades[0]}%` : `${grades[0]}-${grades[1]}%`
: "";

const CONTRACT_MAP = {
"1":"CDI","2":"CDD","3":"Temporaire","4":"Stage","5":"CDI","6":"Apprentissage",
"permanent":"CDI","temporary":"Temporaire","internship":"Stage","apprenticeship":"Apprentissage",
"fixed-term":"CDD","freelance":"Indépendant"
};
const rawContract = String((job.employmentTypeIds || [])[0] || job.contractType || job.employmentType || "");
const contract = CONTRACT_MAP[rawContract] || CONTRACT_MAP[rawContract.toLowerCase()] || "";

const date = job.publicationDate ? job.publicationDate.split("T")[0] : new Date().toISOString().split("T")[0];
const salary = job.salary ? `CHF ${job.salary}` : "";

// Description via Puppeteer
const description = await extractDescriptionWithPuppeteer(offerPath, browser);

return { id: jobId, title, company, location, address, sector: "Administration",
rate, contract, source: "Jobup", offerUrl: `https://www.jobup.ch${offerPath}`,
date, startDate: "", applyBefore: "", salaryGrade: "",
description, salary };
}
}catch(e){ /* fallback HTML */ }
}

/* Essai 2 : extraction depuis le HTML brut */
const titleMatch = html.match(/<h1[^>]*>([^<]{3,120})<\/h1>/);
if(!titleMatch) return null;
const title = titleMatch[1].replace(/&#\d+;/g," ").replace(/&[a-z]+;/g," ").trim();
if(!looksLikeWantedJob(title)) return null;

const companyMatch = html.match(/"hiringOrganization"[^}]*"name"\s*:\s*"([^"]{2,80})"/);
const company = companyMatch ? companyMatch[1].trim() : "";

const locationMatch = html.match(/content="[^"]*,\s*([A-ZÀ-Ÿ][^"]{2,30}(?:VD|Vaud))"/) ||
html.match(/<title>[^-]+-[^-]+-[^<]*?([A-ZÀ-Ÿ][a-zà-ÿ\s]+VD)/);
const location = locationMatch ? locationMatch[1].trim() : "Vaud";

const vaudWords = ["lausanne","vaud","morges","nyon","vevey","renens","yverdon","prilly","crissier","pully","bussigny","gland","rolle","montreux","aigle","villeneuve"];
if(!vaudWords.some(v => (title+location+company).toLowerCase().includes(v)) && !html.includes("region=52")) return null;

const rateMatch = html.match(/"workload"\s*:\s*"([^"]+)"/i) ||
html.match(/(\d{2,3}\s*[–\-]\s*\d{2,3}\s*%|\d{2,3}\s*%)/);
const rate = rateMatch ? rateMatch[1].trim() : "";

const contractMatch = html.match(/"contractType"\s*:\s*"([^"]+)"/i) ||
html.match(/(CDI|CDD|Durée indéterminée|Durée déterminée|Temporaire)/i);
let contract = contractMatch ? contractMatch[1].trim() : "";
contract = contract.replace(/Durée indéterminée/i,"CDI").replace(/Durée déterminée/i,"CDD");

const addressMatch = html.match(/href="https:\/\/www\.google\.com\/maps[^"]*"[^>]*>([^<]{5,80})<\/a>/i) ||
html.match(/(\d{4}\s+[A-ZÀ-Ÿa-zà-ÿ][a-zà-ÿA-ZÀ-Ÿ\s]{2,30})/);
const address = addressMatch ? addressMatch[1].trim() : location;

const salaryMatch = html.match(/(CHF\s*[\d\s'.]+\s*[-–]\s*[\d\s'.]+\s*\/\s*(?:an|mois))/i);
const salary = salaryMatch ? salaryMatch[1].trim() : "";

const months = {janvier:"01",février:"02",mars:"03",avril:"04",mai:"05",juin:"06",juillet:"07",août:"08",septembre:"09",octobre:"10",novembre:"11",décembre:"12"};
const allDates = [...html.matchAll(/(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/gi)];
let date = new Date().toISOString().split("T")[0];
for(const d of allDates){
const year = parseInt(d[3]);
if(year >= 2024 && year <= 2027){ date = `${d[3]}-${months[d[2].toLowerCase()]}-${d[1].padStart(2,"0")}`; break; }
}

// Description via Puppeteer
const description = await extractDescriptionWithPuppeteer(offerPath, browser);

return { id: jobId, title, company, location, address, sector: "Administration",
rate, contract, source: "Jobup", offerUrl: `https://www.jobup.ch${offerPath}`,
date, startDate: "", applyBefore: "", salaryGrade: "",
description, salary };
}

async function main(){
console.log("====================================");
console.log("SCRAPER LOCAL JOBUP - JOB FINDER VAUD");
console.log("====================================\n");

const allPaths = new Set();
const jobupOffers = [];

// Charger les offres existantes pour Option D
let existingOffersMap = {};
if(fs.existsSync(OFFERS_FILE)){
try{
const existing = JSON.parse(fs.readFileSync(OFFERS_FILE, "utf8"));
existing.filter(o => o.source === "Jobup").forEach(o => { existingOffersMap[o.id] = o; });
console.log(`📂 ${Object.keys(existingOffersMap).length} offres Jobup déjà connues\n`);
}catch(e){ console.warn("⚠️ offers.json illisible\n"); }
}

console.log("📋 Étape 1: Collecte des liens...\n");
for(const keyword of SEARCH_KEYWORDS){
try{
const paths = await scrapeListPage(keyword);
paths.forEach(p => allPaths.add(p));
await sleep(DELAY);
}catch(e){ console.warn(`  ⚠️ Erreur "${keyword}": ${e.message}`); }
}
console.log(`\n📊 Total liens uniques: ${allPaths.size}\n`);

// Lancer Puppeteer une seule fois
console.log("🌐 Lancement du navigateur...");
const browser = await puppeteer.launch({ headless: true });
console.log("✅ Navigateur prêt\n");

console.log("📄 Étape 2: Extraction des détails...\n");
let count = 0;
for(const p of allPaths){
count++;
process.stdout.write(`  [${count}/${allPaths.size}] ${p.substring(0,45)}...`);
try{
await sleep(DELAY);
const offer = await scrapeDetailPage(p, browser, existingOffersMap);
if(offer){ jobupOffers.push(offer); process.stdout.write(` ✓ ${offer.title.substring(0,35)}\n`); }
else process.stdout.write(` ⏭\n`);
}catch(e){ process.stdout.write(` ❌ ${e.message}\n`); }
}

// Scraper les sources additionnelles avec le même navigateur
console.log("\n📋 Étape 3: Scraping sources additionnelles...\n");
const existingAllMap = {};
const existingAll = JSON.parse(fs.readFileSync(OFFERS_FILE, "utf8").trim() || "[]").catch?.(() => []) || [];
try{
const existingAllOffers = JSON.parse(fs.readFileSync(OFFERS_FILE, "utf8"));
existingAllOffers.forEach(o => { existingAllMap[o.id] = o; });
}catch(e){}

const [indeedOffers, migrosOffers, nestleOffers, linkedinOffers] = await Promise.all([
scrapeIndeedOffers(browser, existingAllMap),
scrapeMigrosOffers(browser, existingAllMap),
scrapeNestleOffers(browser, existingAllMap),
scrapeLinkedInOffers(browser, existingAllMap)
]);

await browser.close();
console.log("\n🌐 Navigateur fermé");
console.log(`\n✅ ${jobupOffers.length} offres Jobup extraites`);
console.log(`✅ ${indeedOffers.length} offres Indeed`);
console.log(`✅ ${migrosOffers.length} offres Migros`);
console.log(`✅ ${nestleOffers.length} offres Nestlé`);
console.log(`✅ ${linkedinOffers.length} offres LinkedIn\n`);

if(jobupOffers.length === 0 && indeedOffers.length === 0){
console.log("⚠️ Aucune offre — offers.json non modifié");
return;
}

const allNewOffers = [...jobupOffers, ...indeedOffers, ...migrosOffers, ...nestleOffers, ...linkedinOffers];

// Sauvegarder dans offers.json local
fs.writeFileSync(OFFERS_FILE, JSON.stringify(allNewOffers, null, 2), "utf8");
console.log(`💾 offers.json mis à jour: ${allNewOffers.length} offres total\n`);

// Envoyer aussi à Render
console.log("📤 Envoi à Render...");
try{
const response = await axios.post(`${RENDER_URL}/api/offers/import`,
{ offers: allNewOffers, source: "local-scraper" },
{ headers: { "Content-Type": "application/json" }, timeout: 60000 }
);
console.log(`✅ Render: ${JSON.stringify(response.data)}`);
}catch(e){
console.warn(`⚠️ Render non joignable: ${e.message}`);
console.log("📌 Mais offers.json local est à jour — commit et push pour que Render l'utilise");
}

console.log("\n====================================");
console.log("TERMINÉ — Commit offers.json dans GitHub !");
console.log("====================================");
}

main().catch(console.error);

/* ==========================================
SCRAPER SOURCES ADDITIONNELLES (Puppeteer parallèle)
========================================== */

const PARALLEL_TABS = 5;

async function scrapePageWithPuppeteer(url, browser){
const page = await browser.newPage();
try {
await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
const text = await page.evaluate(() => document.body.innerText);
const html = await page.evaluate(() => document.documentElement.innerHTML);
return { text, html };
} catch(e) {
return { text: "", html: "" };
} finally {
await page.close();
}
}

function extractOfferDetails(text, html, source){
// Taux
const rateMatch = text.match(/(\d{1,3})\s*[–\-]\s*(\d{1,3})\s*%/) ||
text.match(/(\d{2,3})\s*%/);
const rate = rateMatch ? rateMatch[0].trim() : "";

// Contrat
const contractRaw = text.match(/(CDI|CDD|Durée indéterminée|Durée déterminée|Temporaire|Stage|Apprentissage|Indépendant)/i);
const contract = contractRaw ? contractRaw[0].trim() : "";

// Description — chercher le contenu principal
const markers = ["Description du poste", "Vos missions", "Votre mission", "À propos", "Le poste", "Missions", "Responsabilités", "Description de l'emploi"];
let description = "Descriptif non disponible.";
for(const marker of markers){
const idx = text.indexOf(marker);
if(idx > -1){
const end = text.length;
const desc = text.substring(idx, idx + 3000).trim();
if(desc.length > 100){
description = desc;
break;
}
}
}

// Localisation
const locationMatch = text.match(/Vaud|Lausanne|Nyon|Morges|Yverdon|Vevey|Montreux|Renens|Prilly|Gland|Rolle/i);
const location = locationMatch ? locationMatch[0] : "Vaud";

// Salaire
const salaryMatch = text.match(/(CHF\s*[\d\s'.]+\s*[-–]\s*[\d\s'.]+\s*\/\s*(?:an|mois|année))/i);
const salary = salaryMatch ? salaryMatch[0].trim() : "";

return { rate, contract, description, location, salary };
}

async function scrapeOffersParallel(offerUrls, browser, source, existingOffersMap){
const results = [];
const queue = [...offerUrls];
let active = 0;
let processed = 0;

return new Promise((resolve) => {
const processNext = async () => {
if(queue.length === 0 && active === 0){
resolve(results);
return;
}
while(active < PARALLEL_TABS && queue.length > 0){
const item = queue.shift();
active++;
(async () => {
try{
const id = item.id;
const url = item.url;
const title = item.title;

// Option D : skip si déjà connu avec description
const existing = existingOffersMap[id];
if(existing && existing.description && existing.description !== "Descriptif non disponible."){
results.push(existing);
processed++;
process.stdout.write(` ♻️ [${processed}] ${title.substring(0,35)}\n`);
return;
}

const { text, html } = await scrapePageWithPuppeteer(url, browser);
if(!text){ processed++; return; }

const details = extractOfferDetails(text, html, source);
const offer = {
id,
title,
company: item.company || source,
location: details.location,
address: "",
sector: "Administration",
rate: details.rate,
contract: details.contract,
source,
offerUrl: url,
date: new Date().toISOString().split("T")[0],
startDate: "", applyBefore: "", salaryGrade: "",
description: details.description,
salary: details.salary
};
results.push(offer);
processed++;
process.stdout.write(` ✓ [${processed}] ${title.substring(0,40)}\n`);
}catch(e){
processed++;
process.stdout.write(` ❌ [${processed}] ${e.message}\n`);
}finally{
active--;
processNext();
}
})();
}
};
processNext();
});
}

async function scrapeIndeedOffers(browser, existingOffersMap){
console.log("\n🔍 Indeed — collecte des liens...");
const searchUrls = [
"https://ch-fr.indeed.com/jobs?q=assistant+administratif&l=vaud",
"https://ch-fr.indeed.com/jobs?q=gestionnaire+dossiers&l=vaud",
"https://ch-fr.indeed.com/jobs?q=secretaire&l=vaud",
"https://ch-fr.indeed.com/jobs?q=employe+commerce&l=vaud"
];

const offerItems = [];
const seen = new Set();

for(const searchUrl of searchUrls){
try{
const { text, html } = await scrapePageWithPuppeteer(searchUrl, browser);
const linkMatches = html.match(/href="(\/viewjob\?jk=[a-z0-9]+[^"]*?)"/gi) ||
html.match(/href="(https:\/\/ch-fr\.indeed\.com\/viewjob\?jk=[^"]+)"/gi) || [];
const titleMatches = html.match(/<h2[^>]*class="[^"]*jobTitle[^"]*"[^>]*>([\s\S]*?)<\/h2>/gi) || [];

linkMatches.forEach((m, i) => {
const href = m.replace(/href="|"/g, "");
const fullUrl = href.startsWith("http") ? href : `https://ch-fr.indeed.com${href}`;
const jkMatch = fullUrl.match(/jk=([a-z0-9]+)/);
const id = jkMatch ? `indeed_${jkMatch[1]}` : `indeed_${Date.now()}_${i}`;
if(seen.has(id)) return;
seen.add(id);

const rawTitle = titleMatches[i] ? titleMatches[i].replace(/<[^>]+>/g, "").trim() : "";
const title = rawTitle || "Offre Indeed";
if(!looksLikeWantedJob(title) && rawTitle) return;

offerItems.push({ id, url: fullUrl, title, company: "Indeed" });
});
await sleep(1000);
}catch(e){ console.warn(`  ⚠️ Indeed search erreur: ${e.message}`); }
}

console.log(`  → ${offerItems.length} offres Indeed à scraper`);
if(offerItems.length === 0) return [];
return await scrapeOffersParallel(offerItems, browser, "Indeed", existingOffersMap);
}

async function scrapeMigrosOffers(browser, existingOffersMap){
console.log("\n🔍 Migros — collecte des liens...");
const searchUrl = "https://jobs.migros.ch/fr/nos-entreprises/postes-vacants?query=administratif&location=Vaud";
const offerItems = [];
const seen = new Set();

try{
const { html } = await scrapePageWithPuppeteer(searchUrl, browser);
const linkMatches = html.match(/href="(\/fr\/nos-entreprises\/job\/[^"]+)"/gi) || [];
linkMatches.forEach((m, i) => {
const path = m.replace(/href="|"/g, "");
const url = `https://jobs.migros.ch${path}`;
const id = `migros_${path.replace(/[^a-z0-9]/gi, "_").substring(0, 40)}`;
if(seen.has(id)) return;
seen.add(id);
offerItems.push({ id, url, title: "Offre Migros", company: "Migros" });
});
}catch(e){ console.warn(`  ⚠️ Migros erreur: ${e.message}`); }

console.log(`  → ${offerItems.length} offres Migros à scraper`);
if(offerItems.length === 0) return [];

const offers = await scrapeOffersParallel(offerItems, browser, "Migros", existingOffersMap);
return offers.filter(o => looksLikeWantedJob(o.title));
}

async function scrapeNestleOffers(browser, existingOffersMap){
console.log("\n🔍 Nestlé — collecte des liens...");
const offerItems = [];
const seen = new Set();

try{
const { html } = await scrapePageWithPuppeteer("https://www.nestle.ch/fr/emplois", browser);
const linkMatches = html.match(/href="([^"]*nestle[^"]*job[^"]*|[^"]*emploi[^"]*nestle[^"]*)"/gi) || [];
linkMatches.forEach((m, i) => {
const href = m.replace(/href="|"/g, "");
if(!href.includes("http")) return;
const id = `nestle_${i}_${Date.now()}`;
if(seen.has(href)) return;
seen.add(href);
offerItems.push({ id, url: href, title: "Offre Nestlé", company: "Nestlé" });
});
}catch(e){ console.warn(`  ⚠️ Nestlé erreur: ${e.message}`); }

console.log(`  → ${offerItems.length} offres Nestlé à scraper`);
if(offerItems.length === 0) return [];

const offers = await scrapeOffersParallel(offerItems, browser, "Nestlé", existingOffersMap);
return offers.filter(o => looksLikeWantedJob(o.title));
}

async function scrapeLinkedInOffers(browser, existingOffersMap){
console.log("\n🔍 LinkedIn — collecte des liens...");
const searchUrl = "https://www.linkedin.com/jobs/search/?keywords=assistant+administratif&location=Vaud%2C%20Suisse";
const offerItems = [];
const seen = new Set();

try{
const { html } = await scrapePageWithPuppeteer(searchUrl, browser);
const linkMatches = html.match(/href="(https:\/\/www\.linkedin\.com\/jobs\/view\/[^"?]+)"/gi) || [];
linkMatches.forEach((m, i) => {
const url = m.replace(/href="|"/g, "").split("?")[0];
const idMatch = url.match(/\/(\d+)\/?$/);
const id = idMatch ? `linkedin_${idMatch[1]}` : `linkedin_${i}_${Date.now()}`;
if(seen.has(id)) return;
seen.add(id);
offerItems.push({ id, url, title: "Offre LinkedIn", company: "LinkedIn" });
});
}catch(e){ console.warn(`  ⚠️ LinkedIn erreur: ${e.message}`); }

console.log(`  → ${offerItems.length} offres LinkedIn à scraper`);
if(offerItems.length === 0) return [];

const offers = await scrapeOffersParallel(offerItems, browser, "LinkedIn", existingOffersMap);
return offers.filter(o => looksLikeWantedJob(o.title));
}