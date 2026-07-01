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

async function scrapePagePuppeteer(url, browser){
  const page = await browser.newPage();
  try {
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    const text = await page.evaluate(() => document.body.innerText);
    const html = await page.evaluate(() => document.documentElement.innerHTML);
    const h1 = await page.evaluate(() => document.querySelector("h1")?.innerText?.trim() || "");
    return { text, html, h1 };
  } catch(e) {
    return { text: "", html: "", h1: "" };
  } finally {
    await page.close();
  }
}

function extractDetails(text, h1 = ""){
  const rateMatch = (h1 + " " + text).match(/(\d{1,3})\s*[–\-]\s*(\d{1,3})\s*%/) ||
                    (h1 + " " + text).match(/(\d{2,3})\s*%/);
  const rate = rateMatch ? rateMatch[0].trim() : "";

  const contractRaw = text.match(/(CDI|CDD|Durée indéterminée|Durée déterminée|Temporaire|Stage|Apprentissage)/i);
  let contract = contractRaw ? contractRaw[0].trim() : "";
  contract = contract.replace(/Durée indéterminée/i, "CDI").replace(/Durée déterminée/i, "CDD");

  const markers = ["Description du poste", "Vos missions", "Votre mission", "Mission", "Responsabilités", "Description de l'emploi", "À propos du rôle", "Le poste"];
  let description = "Descriptif non disponible.";
  for(const marker of markers){
    const idx = text.indexOf(marker);
    if(idx > -1){
      const desc = text.substring(idx, idx + 3000).trim();
      if(desc.length > 100){ description = desc; break; }
    }
  }

  const locationMatch = text.match(/(Lausanne|Vaud|Nyon|Morges|Yverdon|Vevey|Montreux|Renens|Prilly|Gland|Rolle|Bussigny|Pully|Crissier)/i);
  const location = locationMatch ? locationMatch[0] : "Vaud";

  const salaryMatch = text.match(/(CHF\s*[\d\s'.,]+-[\d\s'.,]+\s*\/\s*(?:an|mois|année))/i);
  const salary = salaryMatch ? salaryMatch[0].trim() : "";

  const companyMatch = text.match(/(?:chez|at) ([A-Z][A-Za-z &.-]{2,40})(?= |-|$)/m);
  const company = companyMatch ? companyMatch[1].trim() : "";
  return { rate, contract, description, location, salary, company };
}

async function runParallel(items, browser, source, existingMap){
  const results = [];
  const queue = [...items];
  let active = 0;
  let done = 0;

  return new Promise(resolve => {
    const next = async () => {
      if(queue.length === 0 && active === 0){ resolve(results); return; }
      while(active < PARALLEL_TABS && queue.length > 0){
        const item = queue.shift();
        active++;
        (async () => {
          try{
            const ex = existingMap[item.id];
            const genericTitles = ["Offre Indeed", "Offre Migros", "Offre Coop", "Offre LinkedIn"];
            const hasGenericTitle = genericTitles.some(g => (ex?.title || "").includes(g));
            if(ex && ex.description && ex.description !== "Descriptif non disponible." && !hasGenericTitle){
              results.push(ex); done++;
              process.stdout.write(`  ♻️ [${done}] ${ex.title.substring(0,40)}\n`);
              return;
            }
            const { text, h1 } = await scrapePagePuppeteer(item.url, browser);
            if(!text){ done++; return; }
            const details = extractDetails(text, h1);

            const finalTitle = (h1 && h1.length > 3) ? h1 : item.title;
            if(finalTitle !== item.title && !looksLikeWantedJob(finalTitle)){ done++; return; }

            // Filtre taux strict pour toutes les sources non-Jobup
            const rateNum = details.rate ? parseInt((details.rate.match(/\d+/) || ["0"])[0]) : 0;
            const hasPartTime = /temps partiel|part-time|teilzeit|mi-temps/i.test(text);
            if(details.rate && ![40,50,60].some(t => Math.abs(rateNum - t) <= 5)){
              done++; return;
            }
            if(!details.rate && !hasPartTime){
              done++; return;
            }

            const offer = {
              id: item.id, title: finalTitle,
              company: details.company || item.company || source,
              location: details.location, address: details.location,
              sector: "Administration", rate: details.rate,
              contract: details.contract, source,
              offerUrl: item.url,
              date: new Date().toISOString().split("T")[0],
              startDate: "", applyBefore: "", salaryGrade: "",
              description: details.description, salary: details.salary
            };
            results.push(offer); done++;
            process.stdout.write(`  ✓ [${done}] ${finalTitle.substring(0,40)}\n`);
          }catch(e){ done++; process.stdout.write(`  ❌ [${done}] ${e.message}\n`); }
          finally{ active--; next(); }
        })();
      }
    };
    next();
  });
}

async function scrapeIndeedOffers(browser, existingMap){
  console.log("\n🔍 Indeed — collecte...");
  const searches = [
    "https://ch-fr.indeed.com/jobs?q=assistant+administratif&l=vaud",
    "https://ch-fr.indeed.com/jobs?q=gestionnaire+dossiers&l=vaud",
    "https://ch-fr.indeed.com/jobs?q=secretaire&l=vaud",
    "https://ch-fr.indeed.com/jobs?q=employe+commerce&l=vaud"
  ];
  const items = []; const seen = new Set();
  for(const url of searches){
    const { html } = await scrapePagePuppeteer(url, browser);
    const linkMatches = [...html.matchAll(/jk=([a-z0-9]{16})/gi)];
    linkMatches.forEach((m) => {
      const jk = m[1];
      const id = `indeed_${jk}`;
      if(seen.has(id)) return;
      seen.add(id);
      items.push({ id, url: `https://ch-fr.indeed.com/viewjob?jk=${jk}`, title: `Offre Indeed`, company: "Indeed" });
    });
    await sleep(1000);
  }
  console.log(`  → ${items.length} offres Indeed`);
  if(!items.length) return [];
  const offers = await runParallel(items, browser, "Indeed", existingMap);
  return offers.filter(o => looksLikeWantedJob(o.title));
}

async function scrapeMigrosOffers(browser, existingMap){
  console.log("\n🔍 Migros — collecte...");

  const VAUD_NPA = /^1[0-9]{3}$/;
  const VAUD_VILLES = ["lausanne","vaud","nyon","morges","yverdon","vevey","montreux","renens","prilly","gland","rolle","bussigny","pully","crissier","aigle","villeneuve","echallens","orbe","payerne","moudon","grandson","ste-croix","vallorbe","romanel","chavannes","crissier","ecublens","saint-sulpice","bussigny","tolochenaz","etoy","allaman","perroy","vinzel","longirod","aubonne","mollens","apples","bignasco"];

  function isVaud(locality, postalCode){
    if(VAUD_NPA.test(String(postalCode || ""))) return true;
    const loc = normalizeText(String(locality || ""));
    return VAUD_VILLES.some(v => loc.includes(v));
  }

  const SEARCH_KEYWORDS = [
    "assistant administratif",
    "gestionnaire dossier",
    "secretaire",
    "employe commerce",
    "helpdesk",
    "support informatique"
  ];

  const CONTRACT_MAP = {
    "emploi fixe": "CDI",
    "duree indeterminee": "CDI",
    "indeterminee": "CDI",
    "duree determinee": "CDD",
    "temporaire": "Temporaire",
    "stage": "Stage",
    "apprentissage": "Apprentissage"
  };

  function parseContract(text){
    const v = normalizeText(text);
    for(const [key, val] of Object.entries(CONTRACT_MAP)){
      if(v.includes(key)) return val;
    }
    return "";
  }

  const offers = [];
  const seen = new Set();

  for(const keyword of SEARCH_KEYWORDS){
    const url = `https://jobs.migros.ch/fr/nos-entreprises/groupe-migros/postes-vacants?text=${encodeURIComponent(keyword)}`;
    const page = await browser.newPage();
    try{
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
      await sleep(1500);

      const items = await page.evaluate(() => {
        const results = [];
        const links = document.querySelectorAll("a[href*='/nos-entreprises/job/'], a[href*='/unsere-unternehmen/job/']");
        links.forEach(a => {
          const href = a.href.split("?")[0];
          // Titre : premier <span> dans le <h3>
          const h3 = a.querySelector("h3");
          const spans = h3 ? [...h3.querySelectorAll("span")] : [];
          const title = spans[0]?.innerText?.trim() || "";
          // Taux : deuxième <span> dans le <h3>
          const rate = spans[1]?.innerText?.trim() || "";
          // Entreprise : <p> avant le h3
          const company = a.querySelector("p")?.innerText?.trim() || "";
          // Localité et contrat : items de la <ul>
          const listItems = [...(a.querySelectorAll("ul li") || [])].map(li => li.innerText.trim());
          const locality = listItems[0] || "";
          const contractRaw = listItems[1] || "";
          results.push({ href, title, rate, company, locality, contractRaw });
        });
        return results;
      });

      for(const item of items){
        const uuid = item.href.split("/").pop();
        const id = `migros_${uuid.substring(0,36)}`;
        if(seen.has(id)) continue;
        seen.add(id);

        if(!item.title || !looksLikeWantedJob(item.title)) continue;

        // Extraire NPA et ville depuis locality (ex: "1227 Carouge" ou "Baar")
        const localityMatch = item.locality.match(/^(\d{4})\s+(.+)$/);
        const postalCode = localityMatch ? localityMatch[1] : "";
        const city = localityMatch ? localityMatch[2] : item.locality;

        if(!isVaud(city, postalCode)) continue;

        // Taux : normaliser "80 – 100%" → "80-100%"
        const rateClean = item.rate.replace(/\s*[–—]\s*/g, "-").replace(/\s+/g, "");

        // Filtre taux strict (40, 50, 60 ± 5%)
        const rateNums = rateClean.match(/\d+/g) || [];
        const rateNum = rateNums.length > 0 ? parseInt(rateNums[0]) : 0;
        const hasPartTime = /temps partiel|part-time|mi-temps/i.test(item.contractRaw + " " + item.title);
        if(rateClean && ![40,50,60].some(t => rateNums.some(n => Math.abs(parseInt(n) - t) <= 5))){
          continue;
        }
        if(!rateClean && !hasPartTime) continue;

        const contract = parseContract(item.contractRaw);

        offers.push({
          id,
          title: item.title,
          company: item.company || "Migros",
          location: city || item.locality || "Vaud",
          address: item.locality || city || "Vaud",
          sector: "Administration",
          rate: rateClean,
          contract,
          source: "Migros",
          offerUrl: item.href,
          date: new Date().toISOString().split("T")[0],
          startDate: "",
          applyBefore: "",
          salaryGrade: "",
          description: "Descriptif non disponible.",
          salary: ""
        });
      }

      console.log(`  Migros "${keyword}": ${items.length} trouvées, ${offers.filter(o => seen.has(`migros_${o.id.replace("migros_","")}`) || true).length} retenues`);
    }catch(e){
      console.warn(`  ⚠️ Migros "${keyword}": ${e.message}`);
    }finally{
      await page.close();
    }
    await sleep(1000);
  }

  console.log(`  → ${offers.length} offres Migros (Vaud, taux compatibles)`);
  return offers;
}

async function scrapeCoopOffers(browser, existingMap){
  console.log("\n🔍 Coop — collecte...");
  const page = await browser.newPage();
  const items = []; const seen = new Set();
  try {
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
    await page.goto("https://jobs.coopjobs.ch/?lang=fr", { waitUntil: "networkidle2", timeout: 30000 });
    await sleep(2000);
    const links = await page.evaluate(() =>
      [...document.querySelectorAll("a[href*='/offene-stellen/'], a[href*='/postes-vacantes/']")]
        .map(a => ({href: a.href, text: a.innerText.trim()}))
    );
    links.forEach(({href, text}) => {
      const cleanHref = href.split("?")[0];
      const id = `coop_${cleanHref.split("/").pop().substring(0,40)}`;
      if(seen.has(id)) return;
      seen.add(id);
      const title = text.split("\n")[0].trim() || cleanHref.split("/").pop().replace(/-/g," ");
      if(!looksLikeWantedJob(title) && title.length > 3) return;
      items.push({ id, url: cleanHref, title: title || "Offre Coop", company: "Coop" });
    });
  } finally { await page.close(); }
  console.log(`  → ${items.length} offres Coop`);
  if(!items.length) return [];
  const offers = await runParallel(items, browser, "Coop", existingMap);
  return offers.filter(o => looksLikeWantedJob(o.title));
}

async function scrapeLinkedInOffers(browser, existingMap){
  console.log("\n🔍 LinkedIn — collecte...");

  const SEARCH_URLS = [
    "https://ch.linkedin.com/jobs/search/?keywords=assistant+administratif&location=Vaud%2C+Suisse",
    "https://ch.linkedin.com/jobs/search/?keywords=gestionnaire+dossiers&location=Vaud%2C+Suisse",
    "https://ch.linkedin.com/jobs/search/?keywords=secretaire+administratif&location=Vaud%2C+Suisse",
    "https://ch.linkedin.com/jobs/search/?keywords=employe+de+commerce&location=Vaud%2C+Suisse",
    "https://ch.linkedin.com/jobs/search/?keywords=helpdesk+support+informatique&location=Vaud%2C+Suisse"
  ];

  const CONTRACT_MAP = {
    "FULL_TIME": "CDI",
    "PART_TIME": "CDI",
    "CONTRACT": "CDD",
    "TEMPORARY": "Temporaire",
    "INTERNSHIP": "Stage",
    "OTHER": ""
  };

  // Étape 1 : collecter tous les liens /jobs/view/ depuis les pages de liste
  const seen = new Set();
  const jobUrls = [];

  for(const searchUrl of SEARCH_URLS){
    const page = await browser.newPage();
    try{
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
      await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      await sleep(3000);

      const links = await page.evaluate(() =>
        [...document.querySelectorAll("a[href*='/jobs/view/']")]
          .map(a => a.href.split("?")[0])
      );

      links.forEach(href => {
        const idMatch = href.match(/\/([0-9]{7,})\/?$/);
        if(!idMatch) return;
        const id = `linkedin_${idMatch[1]}`;
        if(seen.has(id)) return;
        seen.add(id);
        jobUrls.push({ id, url: href });
      });

      console.log(`  LinkedIn "${searchUrl.match(/keywords=([^&]+)/)?.[1] || ""}": ${links.length} liens trouvés`);
    }catch(e){
      console.warn(`  ⚠️ LinkedIn liste: ${e.message}`);
    }finally{
      await page.close();
    }
    await sleep(1500);
  }

  console.log(`  → ${jobUrls.length} offres LinkedIn uniques à analyser`);
  if(!jobUrls.length) return [];

  // Étape 2 : visiter chaque page de détail et extraire le JSON-LD
  const offers = [];

  for(const { id, url } of jobUrls){
    // Vérifier cache existant
    const ex = existingMap[id];
    if(ex && ex.description && ex.description !== "Descriptif non disponible." && ex.title && ex.title !== "Offre LinkedIn"){
      if(looksLikeWantedJob(ex.title)){
        offers.push(ex);
        process.stdout.write(`  ♻️ ${ex.title.substring(0,40)}\n`);
      }
      continue;
    }

    const page = await browser.newPage();
    try{
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await sleep(1000);

      // Extraire le JSON-LD depuis le <script type="application/ld+json">
      const jsonLd = await page.evaluate(() => {
        const script = document.querySelector('script[type="application/ld+json"]');
        if(!script) return null;
        try{ return JSON.parse(script.textContent); }catch(e){ return null; }
      });

      if(!jsonLd || jsonLd["@type"] !== "JobPosting"){
        process.stdout.write(`  ⏭ (pas de JSON-LD)\n`);
        continue;
      }

      const title = (jsonLd.title || "").trim();
      if(!title || !looksLikeWantedJob(title)){
        process.stdout.write(`  ⏭ ${title.substring(0,40)}\n`);
        continue;
      }

      const company = jsonLd.hiringOrganization?.name || "Entreprise";
      const locality = jsonLd.jobLocation?.address?.addressLocality || "";
      const description = (jsonLd.description || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&")
        .replace(/\s+/g," ").trim()
        .substring(0, 3000);

      // Filtre Vaud
      const vaudWords = ["lausanne","vaud","nyon","morges","yverdon","vevey","montreux","renens","prilly","gland","rolle","bussigny","pully","crissier","aigle","villeneuve","echallens","orbe","payerne","romanel","chavannes","ecublens","saint-sulpice","tolochenaz","etoy","allaman","aubonne"];
      const locLower = normalizeText(locality);
      if(!vaudWords.some(v => locLower.includes(v))){
        process.stdout.write(`  ⏭ hors Vaud: ${locality}\n`);
        continue;
      }

      // Extraire taux depuis la description (ex: "60% et 80%" ou "80 – 100%")
      const rateMatch = description.match(/(\d{2,3})\s*[%–\-]\s*(?:et\s+)?(\d{2,3})\s*%/i) ||
                        description.match(/(\d{2,3})\s*%/);
      const rateRaw = rateMatch ? rateMatch[0].replace(/\s+/g,"").replace("et","-") : "";
      const rateNums = (rateRaw.match(/\d+/g) || []).map(Number);

      // Filtre taux strict 40/50/60 ±5%
      const hasPartTime = jsonLd.employmentType === "PART_TIME" ||
                          /temps partiel|part.time|mi.temps/i.test(description);
      if(rateNums.length > 0 && ![40,50,60].some(t => rateNums.some(n => Math.abs(n - t) <= 5))){
        process.stdout.write(`  ⏭ taux hors cible: ${rateRaw}\n`);
        continue;
      }
      if(rateNums.length === 0 && !hasPartTime){
        process.stdout.write(`  ⏭ taux inconnu\n`);
        continue;
      }

      const contract = CONTRACT_MAP[jsonLd.employmentType] || "";
      const date = jsonLd.datePosted ? jsonLd.datePosted.split("T")[0] : new Date().toISOString().split("T")[0];
      const applyBefore = jsonLd.validThrough ? jsonLd.validThrough.split("T")[0] : "";

      const offer = {
        id,
        title,
        company,
        location: locality,
        address: locality,
        sector: "Administration",
        rate: rateRaw || (hasPartTime ? "temps partiel" : ""),
        contract,
        source: "LinkedIn",
        offerUrl: url,
        date,
        startDate: "",
        applyBefore,
        salaryGrade: "",
        description,
        salary: ""
      };

      offers.push(offer);
      process.stdout.write(`  ✓ ${title.substring(0,45)}\n`);

    }catch(e){
      process.stdout.write(`  ❌ ${e.message.substring(0,50)}\n`);
    }finally{
      await page.close();
    }
    await sleep(800);
  }

  console.log(`  → ${offers.length} offres LinkedIn (Vaud, taux compatibles)`);
  return offers;
}

async function main(){
  console.log("====================================");
  console.log("SCRAPER LOCAL JOBUP - JOB FINDER VAUD");
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

  console.log("\n📋 Étape 3: Sources additionnelles...\n");

  const existingAllMap = {};
  try{
    const existingAll = JSON.parse(fs.readFileSync(OFFERS_FILE, "utf8"));
    existingAll.forEach(o => { existingAllMap[o.id] = o; });
  }catch(e){}

  console.log("\n📋 Scraping séquentiel des sources additionnelles...\n");

  const indeedOffers = await scrapeIndeedOffers(browser, existingAllMap);
  const migrosOffers = await scrapeMigrosOffers(browser, existingAllMap);
  const coopOffers = await scrapeCoopOffers(browser, existingAllMap);
  const linkedinOffers = await scrapeLinkedInOffers(browser, existingAllMap);

  await browser.close();
  console.log("\n🌐 Navigateur fermé");
  console.log(`\n✅ Jobup: ${jobupOffers.length} | Indeed: ${indeedOffers.length} | Migros: ${migrosOffers.length} | Coop: ${coopOffers.length} | LinkedIn: ${linkedinOffers.length}\n`);

  if(jobupOffers.length === 0){
    console.log("⚠️ Aucune offre Jobup — offers.json non modifié");
    return;
  }

  const allOffers = [...jobupOffers, ...indeedOffers, ...migrosOffers, ...coopOffers, ...linkedinOffers];

  fs.writeFileSync(OFFERS_FILE, JSON.stringify(allOffers, null, 2), "utf8");
  console.log(`💾 offers.json mis à jour: ${allOffers.length} offres total\n`);

  console.log("📤 Envoi à Render...");
  try{
    const response = await axios.post(`${RENDER_URL}/api/offers/import`,
      { offers: allOffers, source: "local-scraper" },
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