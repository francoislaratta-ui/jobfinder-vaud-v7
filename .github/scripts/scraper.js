/* ==========================================
SCRAPER GITHUB ACTIONS - JOB FINDER VAUD
Jobup + Indeed → offers.json
========================================== */

const axios = require("axios");
const fs = require("fs");
const path = require("path");

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

const VAUD_PLACES = [
  "lausanne","vaud","morges","nyon","vevey","renens","yverdon",
  "prilly","crissier","pully","bussigny","gland","rolle","montreux",
  "aigle","villeneuve","ecublens","st-sulpice","chavannes"
];

const CONTRACT_MAP = {
  "1": "CDI", "2": "CDD", "3": "Temporaire",
  "4": "Stage", "5": "CDI", "6": "Apprentissage"
};

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

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
    "gestionnaire de vente","commerce de detail","conseiller de vente",
    "vendeur","vendeuse","chef de rayon","responsable de rayon",
    "assistante medicale","assistant medical","assistant rh","assistante rh",
    "infirmier","infirmiere","aide soignant","restauration","chef de projet",
    "ingenieur","developpeur","developer","engineer","chauffeur","livreur",
    "magasinier","cariste","logisticien","monteur","electricien","plombier"
  ];
  if(excluded.some(e => v.includes(e))) return false;

  const keywords = [
    "employe de commerce","assistant administratif","assistante administrative",
    "gestionnaire de dossier","gestionnaire administratif","collaborateur administratif",
    "technicien informatique","support informatique","helpdesk","back office","back-office",
    "secretaire","coordinateur administratif","assistant de direction","employe administratif",
    "facturation","comptabilite","administration","secretariat"
  ];
  return keywords.some(k => v.includes(k));
}

function isVaud(place){
  return VAUD_PLACES.some(v => normalizeText(place).includes(v));
}

function isCDI(contract){
  return contract === "CDI";
}

function rateOk(rate, description){
  if(!rate){
    const hasPartTime = /temps partiel|part-time|teilzeit|mi-temps/i.test(description || "");
    return hasPartTime;
  }
  const nums = rate.match(/\d+/g);
  if(!nums) return false;
  // Accepte si au moins un nombre entre 30 et 70
  return nums.some(n => parseInt(n) >= 30 && parseInt(n) <= 70);
}

function generateId(){
  return Date.now().toString() + Math.random().toString(36).substring(2, 8);
}

/* ==========================================
SCRAPING JOBUP
========================================== */

async function scrapeJobup(){
  console.log("\n📋 Scraping Jobup...");
  const offers = [];
  const seen = new Set();

  for(const keyword of SEARCH_KEYWORDS){
    try{
      await sleep(1000);
      const encodedKeyword = encodeURIComponent(keyword);
      const url = `https://www.jobup.ch/fr/emplois/?region=${VAUD_REGION}&term=${encodedKeyword}`;

      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "fr-CH,fr;q=0.9",
          "Referer": "https://www.google.com/"
        },
        timeout: 15000
      });

      const html = response.data;
      const initMatch = html.match(/__INIT__\s*=\s*(\{[\s\S]*?\});\s*(?:__LOAD_LAZY__|__LOCALE__)/);
      if(!initMatch){
        console.log(`  "${keyword}": __INIT__ non trouvé`);
        continue;
      }

      const data = JSON.parse(initMatch[1]);
      const results = data?.vacancy?.results?.main?.results || [];
      console.log(`  "${keyword}": ${results.length} offres`);

      for(const job of results){
        const jobId = String(job.id || "");
        if(!jobId || seen.has(jobId)) continue;
        seen.add(jobId);

        const title = job.title || "";
        if(!looksLikeWantedJob(title)) continue;

        const place = job.place || "";
        if(!isVaud(place) && !job.regions?.some(r => String(r).includes("52"))) continue;

        // Exclure stages et apprentissages
        const contractId = String((job.employmentTypeIds || [])[0] || "");
        const contract = CONTRACT_MAP[contractId] || "";
        if(["Stage", "Apprentissage"].includes(contract)) continue;
        if(!isCDI(contract)) continue;

        const grades = job.employmentGrades || [];
        const rate = grades.length === 2
          ? grades[0] === grades[1] ? `${grades[0]}%` : `${grades[0]}-${grades[1]}%`
          : grades.length === 1 ? `${grades[0]}%` : "";

        if(!rateOk(rate, job.lead || "")) continue;

        const street = (job.street || "").trim();
        const zipCode = (job.zipCode || "").trim();
        const addressParts = [];
        if(street) addressParts.push(street);
        if(zipCode || place) addressParts.push(`${zipCode} ${place}`.trim());

        offers.push({
          id: jobId,
          title,
          company: job.company?.name || "",
          location: place,
          address: addressParts.join(", "),
          sector: "Administration",
          rate,
          contract,
          source: "Jobup",
          offerUrl: `https://www.jobup.ch/fr/emplois/detail/${jobId}/`,
          date: job.publicationDate ? job.publicationDate.split("T")[0] : new Date().toISOString().split("T")[0],
          description: job.lead || "Descriptif non disponible.",
          salary: job.salary ? `CHF ${job.salary}` : ""
        });
      }

    }catch(e){
      console.warn(`  ⚠️ Erreur "${keyword}": ${e.message}`);
    }
  }

  console.log(`  ✅ Jobup: ${offers.length} offres retenues`);
  return offers;
}

/* ==========================================
SCRAPING INDEED
========================================== */

async function scrapeIndeed(){
  console.log("\n📋 Scraping Indeed...");
  const offers = [];
  const seen = new Set();

  const searches = [
    "https://ch-fr.indeed.com/jobs?q=assistant+administratif&l=vaud",
    "https://ch-fr.indeed.com/jobs?q=gestionnaire+dossiers&l=vaud",
    "https://ch-fr.indeed.com/jobs?q=secretaire&l=vaud",
    "https://ch-fr.indeed.com/jobs?q=employe+commerce&l=vaud",
    "https://ch-fr.indeed.com/jobs?q=collaborateur+administratif&l=vaud"
  ];

  for(const searchUrl of searches){
    try{
      await sleep(1500);
      const response = await axios.get(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html",
          "Accept-Language": "fr-CH,fr;q=0.9"
        },
        timeout: 15000
      });

      const html = response.data;

      // Extraire les jk= (job keys)
      const jkMatches = [...html.matchAll(/jk=([a-f0-9]+)/gi)];
      const titleMatches = [...html.matchAll(/class="jobTitle[^"]*"[^>]*>\s*<[^>]+>([^<]+)<\/[^>]+>/gi)];

      console.log(`  ${searchUrl.split("q=")[1].split("&")[0]}: ${jkMatches.length} liens`);

      jkMatches.forEach((m, i) => {
        const jk = m[1];
        const id = `indeed_${jk}`;
        if(seen.has(id)) return;
        seen.add(id);

        const rawTitle = titleMatches[i] ? titleMatches[i][1].trim() : "";
        if(rawTitle && !looksLikeWantedJob(rawTitle)) return;

        offers.push({
          id,
          title: rawTitle || "Offre Indeed",
          company: "Indeed",
          location: "Vaud",
          address: "",
          sector: "Administration",
          rate: "",
          contract: "CDI",
          source: "Indeed",
          offerUrl: `https://ch-fr.indeed.com/viewjob?jk=${jk}`,
          date: new Date().toISOString().split("T")[0],
          description: "Descriptif non disponible.",
          salary: ""
        });
      });

    }catch(e){
      console.warn(`  ⚠️ Erreur Indeed: ${e.message}`);
    }
  }

  // Filtrer par titre
  const filtered = offers.filter(o => o.title === "Offre Indeed" || looksLikeWantedJob(o.title));
  console.log(`  ✅ Indeed: ${filtered.length} offres retenues`);
  return filtered;
}

/* ==========================================
MAIN
========================================== */

async function main(){
  console.log("====================================");
  console.log("SCRAPER GITHUB ACTIONS - JOB FINDER VAUD");
  console.log("====================================");

  // Lire offres existantes
  let existingOffers = [];
  try{
    existingOffers = JSON.parse(fs.readFileSync(OFFERS_FILE, "utf8"));
    console.log(`\n📂 ${existingOffers.length} offres existantes`);
  }catch(e){
    console.log("\n📂 Aucune offre existante");
  }

  const [jobupOffers, indeedOffers] = await Promise.all([
    scrapeJobup(),
    scrapeIndeed()
  ]);

  // Fusionner avec déduplication
  const seen = new Set();
  const allOffers = [];

  for(const offer of [...jobupOffers, ...indeedOffers]){
    if(!seen.has(offer.id)){
      seen.add(offer.id);
      allOffers.push(offer);
    }
  }

  console.log(`\n✅ Total: ${allOffers.length} offres (Jobup: ${jobupOffers.length} | Indeed: ${indeedOffers.length})`);

  if(allOffers.length === 0){
    console.log("⚠️ Aucune offre — offers.json non modifié");
    process.exit(0);
  }

  fs.writeFileSync(OFFERS_FILE, JSON.stringify(allOffers, null, 2), "utf8");
  console.log(`\n💾 offers.json sauvegardé: ${allOffers.length} offres`);
}

main().catch(e => {
  console.error("❌ Erreur:", e.message);
  process.exit(1);
});
