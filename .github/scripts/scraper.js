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

const RENDER_URL = "https://jobfinder-vaud-v7.onrender.com";
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

  const existing = existingOffersMap[jobId];
  if(existing && existing.description && existing.description !== "Descriptif non disponible." && !String(existing.salary||"").includes("Object") && !String(existing.address||"").includes("null") && !String(existing.address||"").includes("JobCloud")){
    process.stdout.write(` ♻️ (déjà scrapée)\n`);
    return existing;
  }

  const url = `https://www.jobup.ch${offerPath}`;
  const html = await fetchJobupPage(url);

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
        if(street && street.toLowerCase() !== "null" && street.length < 60) addressParts.push(street);
        if(zipCode && zipCode.toLowerCase() !== "null" && zipCode !== "2026") {
          const cleanPlace = (place && place.toLowerCase() !== "null") ? place : "";
          addressParts.push(`${zipCode} ${cleanPlace}`.trim());
        } else if (place && place.toLowerCase() !== "null" && !place.toLowerCase().includes("jobcloud")) {
          addressParts.push(place);
        }

        let address = addressParts.length > 0 ? addressParts.join(", ") : (place || "Vaud");

        if (address.includes("null") || address.includes("JobCloud")) {
          address = address.replace(/null,?/gi, "").replace(/2026\s*JobCloud\s*SA/gi, "").trim() || place || "Vaud";
        }
        const location = (place && place.toLowerCase() !== "null") ? place : "Vaud";

        const grades = job.employmentGrades || [];
        const rate = grades.length >= 2
          ? grades[0] === grades[1] ? `${grades[0]}%` : `${grades[0]}-${grades[1]}%`
          : grades.length === 1 ? `${grades[0]}%` : "";

        const CONTRACT_MAP = {
          "1":"CDI","2":"CDD","3":"Temporaire","4":"Stage","5":"CDI","6":"Apprentissage",
          "permanent":"CDI","temporary":"Temporaire","internship":"Stage","apprenticeship":"Apprentissage",
          "fixed-term":"CDD","freelance":"Indépendant"
        };
        const rawContract = String((job.employmentTypeIds || [])[0] || job.contractType || job.employmentType || "");
        const contract = CONTRACT_MAP[rawContract] || CONTRACT_MAP[rawContract.toLowerCase()] || "";

        const date = job.publicationDate ? job.publicationDate.split("T")[0] : new Date().toISOString().split("T")[0];

        let salary = "";
        if (job.salary) {
          if (typeof job.salary === 'object') {
            salary = job.salary.text || job.salary.formatted || (job.salary.amount ? `CHF ${job.salary.amount}` : "");
          } else {
            salary = String(job.salary);
          }
        }
        if (salary && !salary.startsWith("CHF") && !salary.includes("[object")) {
          salary = `CHF ${salary}`;
        }
        if (salary.includes("[object")) {
          salary = "";
        }

        const description = await extractDescriptionWithPuppeteer(offerPath, browser);

        const startDateMatch = description.match(/[Ee]ntr[ée]e en (?:service|fonction)[^:]*:?\s*([^\n.]{3,40})/i) ||
                               description.match(/[Dd]ate d'entr[ée]e[^:]*:?\s*([^\n.]{3,40})/i) ||
                               description.match(/[Dd][eè]s que possible/i);
        let startDate = startDateMatch ? (startDateMatch[1] || "Dès que possible").trim() : "";
        const sdm = startDate.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
        if(sdm) startDate = sdm[1].padStart(2,"0")+"."+sdm[2].padStart(2,"0")+"."+sdm[3];

        const applyMatch = description.match(/[Pp]ostuler avant[^:]*:?\s*([^\n.]{3,40})/i) ||
                             description.match(/[Dd]élai de candidature[^:]*:?\s*([^\n.]{3,40})/i) ||
                             description.match(/jusqu'au[^:]*:?\s*([^\n.]{3,40})/i);
        let applyBefore = applyMatch ? applyMatch[1].trim() : "";
        const abm = applyBefore.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
        if(abm) applyBefore = abm[1].padStart(2,"0")+"."+abm[2].padStart(2,"0")+"."+abm[3];

        return { id: jobId, title, company, location, address, sector: "Administration",
                 rate, contract, source: "Jobup", offerUrl: `https://www.jobup.ch${offerPath}`,
                 date, startDate, applyBefore, salaryGrade: "",
                 description, salary };
      }
    }catch(e){ /* fallback HTML */ }
  }

  const titleMatch = html.match(/<h1[^>]*>([^<]{3,120})<\/h1>/);
  if(!titleMatch) return null;
  const title = titleMatch[1].replace(/&#\d+;/g," ").replace(/&[a-z]+;/g," ").trim();
  if(!looksLikeWantedJob(title)) return null;

  const companyMatch = html.match(/"hiringOrganization"[^}]*"name"\s*:\s*"([^"]{2,80})"/);
  const company = companyMatch ? companyMatch[1].trim() : "Entreprise Anonyme";

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

  const description = await extractDescriptionWithPuppeteer(offerPath, browser);

  let address = location;
  const zipMatch = html.match(/(\d{4})\s+([A-ZÀ-Ÿa-zà-ÿ][a-zà-ÿA-ZÀ-Ÿ\s-]{2,30})/);
  if (zipMatch) {
    const zip = zipMatch[1];
    const town = zipMatch[2].split("\n")[0].split(",")[0].trim();
    if (town.length < 30 && !town.toLowerCase().includes("jobcloud") && zip !== "2026") {
      address = `${zip} ${town}`;
    }
  }
  if (address.includes("null") || address.includes("JobCloud")) {
    address = address.replace(/null,?/gi, "").replace(/2026\s*JobCloud\s*SA/gi, "").trim() || location;
  }

  const salaryMatch = html.match(/(CHF\s*[\d\s'.]+\s*[-–]\s*[\d\s'.]+\s*\/\s*(?:an|mois))/i);
  let salary = salaryMatch ? salaryMatch[1].trim() : "";
  if (salary.includes("[object")) { salary = ""; }

  const months = {janvier:"01",février:"02",mars:"03",avril:"04",mai:"05",juin:"06",juillet:"07",août:"08",septembre:"09",octobre:"10",novembre:"11",décembre:"12"};
  const allDates = [...html.matchAll(/(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/gi)];
  let date = new Date().toISOString().split("T")[0];
  for(const d of allDates){
    const year = parseInt(d[3]);
    if(year >= 2024 && year <= 2027){ date = `${d[3]}-${months[d[2].toLowerCase()]}-${d[1].padStart(2,"0")}`; break; }
  }

  const startDateMatch2 = description.match(/[Ee]ntr[ée]e en (?:service|fonction)[^:]*:?\s*([^\n.]{3,40})/i) ||
                          description.match(/[Dd]ate d'entr[ée]e[^:]*:?\s*([^\n.]{3,40})/i);
  let startDate2 = startDateMatch2 ? startDateMatch2[1].trim() : "";
  const sdm2 = startDate2.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
  if(sdm2) startDate2 = sdm2[1].padStart(2,"0")+"."+sdm2[2].padStart(2,"0")+"."+sdm2[3];

  const applyMatch2 = description.match(/[Pp]ostuler avant[^:]*:?\s*([^\n.]{3,40})/i) ||
                       description.match(/jusqu'au[^:]*:?\s*([^\n.]{3,40})/i);
  let applyBefore2 = applyMatch2 ? applyMatch2[1].trim() : "";
  const abm2 = applyBefore2.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
  if(abm2) applyBefore2 = abm2[1].padStart(2,"0")+"."+abm2[2].padStart(2,"0")+"."+abm2[3];

  return { id: jobId, title, company, location, address, sector: "Administration",
           rate, contract, source: "Jobup", offerUrl: `https://www.jobup.ch${offerPath}`,
           date, startDate: startDate2, applyBefore: applyBefore2, salaryGrade: "",
           description, salary };
}

/* ==========================================
SCRAPER SOURCES ADDITIONNELLES
========================================== */

const PARALLEL_TABS = 5;


async function main(){
  console.log("====================================");
  console.log("SCRAPER GITHUB ACTIONS - JOB FINDER VAUD");
  console.log("====================================\n");

  const allPaths = new Set();
  const jobupOffers = [];

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

  console.log("🌐 Lancement du navigateur...");
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox","--disable-setuid-sandbox"] });
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

  await browser.close();
  console.log("\n🌐 Navigateur fermé");
  console.log(`\n✅ Jobup: ${jobupOffers.length} offres\n`);

  if(jobupOffers.length === 0){
    console.log("⚠️ Aucune offre Jobup — offers.json non modifié");
    return;
  }

  fs.writeFileSync(OFFERS_FILE, JSON.stringify(jobupOffers, null, 2), "utf8");
  console.log(`💾 offers.json mis à jour: ${jobupOffers.length} offres total\n`);

  console.log("====================================");
  console.log("TERMINÉ");
  console.log("====================================");
}

main().catch(console.error);