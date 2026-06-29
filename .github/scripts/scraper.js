/* ==========================================
SCRAPER GITHUB ACTIONS - JOB FINDER VAUD
Basé sur scraper-local.js (code éprouvé)
Jobup + Indeed → offers.json
========================================== */

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const OFFERS_FILE = path.join(__dirname, "../../offers.json");

const SEARCH_KEYWORDS = [
  "assistant administratif",
  "assistante administrative",
  "gestionnaire de dossier",
  "gestionnaire administratif",
  "collaborateur administratif",
  "secrétaire",
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

const VAUD_PLACES = [
  "lausanne","vaud","morges","nyon","vevey","renens","yverdon","prilly","crissier",
  "pully","bussigny","gland","rolle","montreux","aigle","villeneuve"
];

async function fetchJobupPage(url){
  const response = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "fr-CH,fr;q=0.9,en;q=0.8",
      "Cache-Control": "no-cache",
      "Referer": "https://www.google.com/"
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
  if(existing && existing.description && existing.description !== "Descriptif non disponible."){
    process.stdout.write(` ♻️ (déjà scrapée)\n`);
    return existing;
  }

  const url = `https://www.jobup.ch${offerPath}`;

  // Utiliser Puppeteer pour fetcher la page de détail (axios bloqué par Jobup depuis GitHub Actions)
  let html = "";
  let pageText = "";
  const detailPage = await browser.newPage();
  try {
    await detailPage.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
    await detailPage.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    html = await detailPage.evaluate(() => document.documentElement.innerHTML);
    pageText = await detailPage.evaluate(() => document.body.innerText);
  } catch(e) {
    process.stdout.write(` ❌ Puppeteer: ${e.message}\n`);
    return null;
  } finally {
    await detailPage.close();
  }

  const CONTRACT_MAP = {
    "1":"CDI","2":"CDD","3":"Temporaire","4":"Stage","5":"CDI","6":"Apprentissage",
    "permanent":"CDI","temporary":"Temporaire","internship":"Temporaire",
    "fixed-term":"CDD","freelance":"Indépendant"
  };

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
          : grades.length === 1 ? `${grades[0]}%` : "";

        const rawContract = String((job.employmentTypeIds || [])[0] || job.contractType || "");
        const contract = CONTRACT_MAP[rawContract] || CONTRACT_MAP[rawContract.toLowerCase()] || "";

        if(["Stage", "Apprentissage"].includes(contract)) return null;

        const date = job.publicationDate ? job.publicationDate.split("T")[0] : new Date().toISOString().split("T")[0];
        
        const salaryRaw = job.salary;
        let salary = "";
        if(salaryRaw){
          if(typeof salaryRaw === "object"){
            const min = salaryRaw.min || salaryRaw.from || "";
            const max = salaryRaw.max || salaryRaw.to || "";
            if(min && max) salary = `CHF ${min} - ${max}`;
            else if(min) salary = `CHF ${min}`;
          } else {
            salary = `CHF ${salaryRaw}`;
          }
        }

        // Extraire description depuis le texte déjà récupéré
        const start = pageText.indexOf("À propos de cette offre");
        const end = ['Offres similaires', 'Postuler maintenant', 'Comment postuler', 'Partager cette offre', 'Signaler cette offre'].reduce((found, marker) => {
          const idx = pageText.indexOf(marker, start);
          return (idx > -1 && (found === -1 || idx < found)) ? idx : found;
        }, -1);
        const description = start > -1
          ? (pageText.substring(start + 23, end > -1 ? end : start + 8000).trim() || "Descriptif non disponible.")
          : "Descriptif non disponible.";

        const startDateMatch = description.match(/[Ee]ntr[ée]e en (?:service|fonction)[^:]*:?\s*([^\n.]{3,40})/i) ||
          description.match(/[Dd]ate d'entr[ée]e[^:]*:?\s*([^\n.]{3,40})/i) ||
          description.match(/[Dd][eè]s le ([^\n.]{3,20})/i) ||
          description.match(/[Dd][eè]s que possible/i);
        let startDate = startDateMatch
          ? (startDateMatch[1] || "Dès que possible").trim()
          : "";
        const sdm = startDate.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
        if(sdm) startDate = sdm[1].padStart(2,"0")+"."+sdm[2].padStart(2,"0")+"."+sdm[3];

        // Salaire depuis HTML si pas trouvé dans __INIT__
        if(!salary){
          const salaryHtmlMatch = html.match(/CHF\s*[\d\s'.]+\s*[-–]\s*[\d\s'.]+\s*\/\s*(?:an|mois)/i);
          if(salaryHtmlMatch) salary = salaryHtmlMatch[0].replace(/\s+/g," ").trim();
        }

        return { id: jobId, title, company, location, address, sector: "Administration",
          rate, contract, source: "Jobup", offerUrl: `https://www.jobup.ch${offerPath}`,
          date, startDate, salaryGrade: "", description, salary };
      }
    }catch(e){ /* fallback */ }
  }
  return null;
}

/* ==========================================
SCRAPING INDEED - PUPPETEER+STEALTH
========================================== */

async function scrapeIndeedOffers(browser, existingMap){
  console.log("\n🔍 Indeed — collecte...");
  const searches = [
    "https://ch.indeed.com/jobs?q=assistant+administratif&l=lausanne%2C+vd&lang=fr",
    "https://ch.indeed.com/jobs?q=gestionnaire+dossiers&l=lausanne%2C+vd&lang=fr",
    "https://ch.indeed.com/jobs?q=secretaire&l=lausanne%2C+vd&lang=fr",
    "https://ch.indeed.com/jobs?q=employe+commerce&l=lausanne%2C+vd&lang=fr",
    "https://ch.indeed.com/jobs?q=collaborateur+administratif&l=lausanne%2C+vd&lang=fr"
  ];
  const items = []; const seen = new Set();

  for(const url of searches){
    const page = await browser.newPage();
    try{
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
      await sleep(2000);
      const html = await page.evaluate(() => document.documentElement.innerHTML);
      const linkMatches = [...html.matchAll(/href="((?:https:\/\/ch-fr\.indeed\.com)?\/rc\/clk\?jk=([a-z0-9]+)[^"]*?)"/gi)];
      linkMatches.forEach(m => {
        const jk = m[2];
        const id = `indeed_${jk}`;
        if(seen.has(id)) return;
        seen.add(id);
        items.push({ id, url: `https://ch.indeed.com/viewjob?jk=${jk}`, title: "Offre Indeed", company: "Indeed" });
      });
    }catch(e){
      console.warn(`  ⚠️ Erreur Indeed liste: ${e.message}`);
    }finally{
      await page.close();
    }
    await sleep(1000);
  }

  console.log(`  → ${items.length} offres Indeed trouvées`);
  const offers = [];

  for(const item of items){
    const ex = existingMap[item.id];
    if(ex && ex.description && ex.description !== "Descriptif non disponible." && ex.title !== "Offre Indeed"){
      offers.push(ex);
      continue;
    }
    const page = await browser.newPage();
    try{
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
      await page.goto(item.url, { waitUntil: "networkidle2", timeout: 30000 });
      await sleep(1500);
      const h1 = await page.evaluate(() => document.querySelector("h1")?.innerText?.trim() || "");
      const text = await page.evaluate(() => document.body.innerText);

      const finalTitle = (h1 && h1.length > 3) ? h1 : item.title;
      if(finalTitle !== "Offre Indeed" && !looksLikeWantedJob(finalTitle)) continue;

      const rateMatch = (h1 + " " + text).match(/(\d{1,3})\s*[–\-]\s*(\d{1,3})\s*%/) ||
                        (h1 + " " + text).match(/(\d{2,3})\s*%/);
      const rate = rateMatch ? rateMatch[0].trim() : "";

      const hasPartTime = /temps partiel|part-time|teilzeit|mi-temps/i.test(text);
      if(rate){
        const rateNum = parseInt((rate.match(/\d+/) || ["0"])[0]);
        if(![40,50,60].some(t => Math.abs(rateNum - t) <= 10)) continue;
      } else if(!hasPartTime) continue;

      const contractRaw = text.match(/(CDI|CDD|Emploi fixe|Durée indéterminée|Temporaire)/i);
      let contract = contractRaw ? contractRaw[0].trim() : "CDI";
      contract = contract.replace(/Durée indéterminée/i, "CDI").replace(/Emploi fixe/i, "CDI");

      const locationMatch = text.match(/(Lausanne|Vaud|Nyon|Morges|Yverdon|Vevey|Montreux|Renens|Prilly|Gland|Rolle|Bussigny|Pully|Crissier)/i);
      const location = locationMatch ? locationMatch[0] : "Vaud";

      const markers = ["Description du poste","Vos missions","Votre mission","Responsabilités","Description de l'emploi"];
      let description = "Descriptif non disponible.";
      for(const marker of markers){
        const idx = text.indexOf(marker);
        if(idx > -1){ description = text.substring(idx, idx + 3000).trim(); break; }
      }

      offers.push({
        id: item.id, title: finalTitle, company: "Indeed", location, address: "",
        sector: "Administration", rate, contract, source: "Indeed",
        offerUrl: item.url, date: new Date().toISOString().split("T")[0],
        startDate: "", description, salary: ""
      });
    }catch(e){
      console.warn(`  ⚠️ Erreur Indeed détail: ${e.message}`);
    }finally{
      await page.close();
    }
    await sleep(1000);
  }

  const filtered = offers.filter(o => looksLikeWantedJob(o.title));
  console.log(`  ✅ Indeed: ${filtered.length} offres retenues`);
  return filtered;
}

/* ==========================================
MAIN
========================================== */

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
      existing.forEach(o => { existingOffersMap[o.id] = o; });
      console.log(`📂 ${Object.keys(existingOffersMap).length} offres existantes\n`);
    }catch(e){ console.warn("⚠️ offers.json illisible\n"); }
  }

  console.log("📋 Étape 1: Collecte des liens Jobup...\n");
  for(const keyword of SEARCH_KEYWORDS){
    try{
      const paths = await scrapeListPage(keyword);
      paths.forEach(p => allPaths.add(p));
      await sleep(DELAY);
    }catch(e){ console.warn(`  ⚠️ Erreur "${keyword}": ${e.message}`); }
  }
  console.log(`\n📊 Total liens Jobup: ${allPaths.size}\n`);

  console.log("🌐 Lancement du navigateur...");
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
  });
  console.log("✅ Navigateur prêt\n");

  console.log("📄 Étape 2: Extraction détails Jobup...\n");
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

  console.log("\n📋 Étape 3: Scraping Indeed...");
  const indeedOffers = await scrapeIndeedOffers(browser, existingOffersMap);

  await browser.close();
  console.log("\n🌐 Navigateur fermé");
  console.log(`\n✅ Jobup: ${jobupOffers.length} | Indeed: ${indeedOffers.length}\n`);

  if(jobupOffers.length === 0){
    console.log("⚠️ Aucune offre Jobup — offers.json non modifié");
    process.exit(0);
  }

  const seen = new Set();
  const allOffers = [];
  for(const offer of [...jobupOffers, ...indeedOffers]){
    if(!seen.has(offer.id)){ seen.add(offer.id); allOffers.push(offer); }
  }

  fs.writeFileSync(OFFERS_FILE, JSON.stringify(allOffers, null, 2), "utf8");
  console.log(`💾 offers.json sauvegardé: ${allOffers.length} offres`);
}

main().catch(e => {
  console.error("❌ Erreur:", e.message);
  process.exit(1);
});