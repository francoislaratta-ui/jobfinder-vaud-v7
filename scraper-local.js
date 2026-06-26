/* ==========================================
SCRAPER LOCAL JOBUP - JOB FINDER VAUD
Tourne sur ton PC, envoie les offres à Render
Usage: node scraper-local.js
========================================== */

const axios = require("axios");

const RENDER_URL = "https://jobfinder-vaud-v7-1.onrender.com";

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

const DELAY = 800; // ms entre chaque requête

function sleep(ms){
return new Promise(r => setTimeout(r, ms));
}

function normalizeText(str){
return String(str || "")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.trim();
}

function looksLikeWantedJob(title){
const v = normalizeText(title);

const excluded = [
"gestionnaire de vente", "commerce de detail",
"conseiller de vente", "vendeur", "vendeuse",
"chef de rayon", "responsable de rayon",
"assistante medicale", "assistant medical",
"assistant rh", "assistante rh",
"infirmier", "infirmiere", "aide soignant"
];
if(excluded.some(e => v.includes(e))) return false;

const keywords = [
"employe de commerce", "assistant administratif",
"assistante administrative", "gestionnaire de dossier",
"gestionnaire administratif", "collaborateur administratif",
"technicien informatique", "support informatique",
"helpdesk", "back office", "back-office",
"secretaire", "coordinateur administratif",
"assistant de direction", "employe administratif"
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
timeout: 15000,
responseType: "text"
});
return response.data;
}

async function scrapeListPage(keyword){
const encodedKeyword = encodeURIComponent(keyword);
const url = `https://www.jobup.ch/fr/emplois/?region=${VAUD_REGION}&term=${encodedKeyword}`;

console.log(`  Scraping liste: "${keyword}"...`);

const html = await fetchJobupPage(url);

// Extraire les liens d'offres
const linkMatches = html.match(/href="(\/fr\/emplois\/detail\/[a-z0-9-]+\/)"/g) || [];
const urls = [...new Set(linkMatches.map(m => m.replace(/href="|"/g, "")))];

console.log(`  → ${urls.length} offres trouvées`);
return urls;
}

async function scrapeDetailPage(path){
const url = `https://www.jobup.ch${path}`;

const html = await fetchJobupPage(url);

// Titre
const titleMatch = html.match(/<h1[^>]*>([^<]{3,120})<\/h1>/);
if(!titleMatch) return null;
const title = titleMatch[1].replace(/&#\d+;/g," ").replace(/&[a-z]+;/g," ").trim();

if(!looksLikeWantedJob(title)) return null;

// Company
const companyMatch =
html.match(/"hiringOrganization"[^}]*"name"\s*:\s*"([^"]{2,80})"/) ||
html.match(/class="[^"]*company[^"]*"[^>]*>\s*([^<]{2,80})</) ||
html.match(/Employeur[^:]*:\s*([^\n<]{2,60})/i);
const company = companyMatch ? companyMatch[1].replace(/&#\d+;/g," ").trim() : "";

// Taux
const rateMatch =
html.match(/Taux d.activit[eé][^:]*:\s*\n?\s*([\d\s%–\-]+%)/i) ||
html.match(/(\d{2,3}\s*[–\-]\s*\d{2,3}\s*%|\d{2,3}\s*%)/);
const rate = rateMatch ? rateMatch[1].replace(/\s+/g," ").trim() : "";

// Lieu
const locationMatch = html.match(/Lieu de travail[^:]*:\s*\n?\s*([^\n<]{2,50})/i);
const location = locationMatch ? locationMatch[1].trim() : "Vaud";

// Vérifier Vaud
const vaudWords = ["lausanne","vaud","morges","nyon","vevey","renens","yverdon","prilly","crissier","pully","bussigny","gland","rolle","montreux","aigle"];
const textLower = (title + " " + location + " " + company).toLowerCase();
const isVaud = vaudWords.some(v => textLower.includes(v)) ||
location.toLowerCase().includes("vd") ||
html.includes("region=52");
if(!isVaud) return null;

// Contrat
const contractMatch =
html.match(/Type de contrat[^:]*:\s*\n?\s*([^\n<]{3,50})/i) ||
html.match(/(Durée indéterminée|Durée déterminée|CDI|CDD|Temporaire|Apprentissage)/i);
let contract = contractMatch ? contractMatch[1].trim() : "";
contract = contract
.replace(/Durée indéterminée/i, "CDI")
.replace(/Durée déterminée/i, "CDD");

// Adresse
const addressMatch = html.match(/(\d{4}\s+[A-ZÀ-Ÿa-zà-ÿ][^\n<]{2,40})/);
const address = addressMatch ? addressMatch[1].trim() : location;

// Salaire
const salaryMatch =
html.match(/Salaire[^:]*:\s*\n?\s*(CHF[^\n<]{3,50})/i) ||
html.match(/(CHF\s*[\d\s'.]+\s*[-–]\s*[\d\s'.]+\s*\/\s*(?:an|mois))/i);
const salary = salaryMatch ? salaryMatch[1].replace(/\s+/g," ").trim() : "";

// Date
const months = {janvier:"01",février:"02",mars:"03",avril:"04",mai:"05",juin:"06",juillet:"07",août:"08",septembre:"09",octobre:"10",novembre:"11",décembre:"12"};
const dateMatch = html.match(/(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i);
let date = new Date().toISOString().split("T")[0];
if(dateMatch){
date = `${dateMatch[3]}-${months[dateMatch[2].toLowerCase()]}-${dateMatch[1].padStart(2,"0")}`;
}

// Date entrée
const startMatch = html.match(/Entr[ée]e en (?:service|fonction)[^\d]*([^\n<]{3,50})/i);
const startDate = startMatch ? startMatch[1].trim() : "";

// Date postulation
const applyMatch = html.match(/Postuler avant[^\d]*(\d{1,2}[./]\d{1,2}[./]\d{4})/i);
const applyBefore = applyMatch ? applyMatch[1].trim() : "";

// Classe salariale
const gradeMatch = html.match(/Classe salariale[^:]*:\s*([^\n<]{1,20})/i);
const salaryGrade = gradeMatch ? gradeMatch[1].trim() : "";

// Description
const descStart = html.indexOf('<div class="job-description');
const descEnd = html.indexOf('</div>', descStart + 100);
let description = "Descriptif non disponible.";
if(descStart > -1 && descEnd > -1){
description = html.substring(descStart, descEnd)
.replace(/<[^>]+>/g, " ")
.replace(/\s+/g, " ")
.trim()
.substring(0, 2000);
}

const jobId = (path.match(/detail\/([^/]+)\//) || [])[1] || String(Date.now());

return {
id: jobId,
title,
company,
location,
address,
sector: "Administration",
rate,
contract,
source: "Jobup",
offerUrl: `https://www.jobup.ch${path}`,
date,
startDate,
applyBefore,
salaryGrade,
description,
salary
};
}

async function sendToRender(offers){
console.log(`\n📤 Envoi de ${offers.length} offres à Render...`);

try{
const response = await axios.post(
`${RENDER_URL}/api/offers/import`,
{ offers, source: "local-scraper" },
{
headers: { "Content-Type": "application/json" },
timeout: 30000
}
);
console.log(`✅ Render répond: ${JSON.stringify(response.data)}`);
}catch(e){
console.error(`❌ Erreur envoi Render: ${e.message}`);
if(e.response){
console.error(`   Status: ${e.response.status}`);
console.error(`   Body: ${JSON.stringify(e.response.data)}`);
}
}
}

async function main(){
console.log("====================================");
console.log("SCRAPER LOCAL JOBUP - JOB FINDER VAUD");
console.log("====================================\n");

const allPaths = new Set();
const offers = [];

// 1. Collecter tous les liens d'offres
console.log("📋 Étape 1: Collecte des liens d'offres...\n");
for(const keyword of SEARCH_KEYWORDS){
try{
const paths = await scrapeListPage(keyword);
paths.forEach(p => allPaths.add(p));
await sleep(DELAY);
}catch(e){
console.warn(`  ⚠️ Erreur "${keyword}": ${e.message}`);
}
}

console.log(`\n📊 Total liens uniques: ${allPaths.size}\n`);

// 2. Scraper chaque offre
console.log("📄 Étape 2: Extraction des détails...\n");
let count = 0;
for(const path of allPaths){
count++;
process.stdout.write(`  [${count}/${allPaths.size}] ${path.substring(0,50)}...`);
try{
await sleep(DELAY);
const offer = await scrapeDetailPage(path);
if(offer){
offers.push(offer);
process.stdout.write(` ✓ ${offer.title.substring(0,40)}\n`);
}else{
process.stdout.write(` ⏭ ignorée\n`);
}
}catch(e){
process.stdout.write(` ❌ ${e.message}\n`);
}
}

console.log(`\n✅ ${offers.length} offres Jobup extraites\n`);

// 3. Envoyer à Render
if(offers.length > 0){
await sendToRender(offers);
}else{
console.log("⚠️ Aucune offre à envoyer");
}

console.log("\n====================================");
console.log("TERMINÉ");
console.log("====================================");
}

main().catch(console.error);
