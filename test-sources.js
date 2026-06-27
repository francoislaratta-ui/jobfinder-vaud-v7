const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");

  // INDEED
  console.log("=== INDEED ===");
  try {
    await page.goto("https://ch-fr.indeed.com/jobs?q=assistant+administratif&l=vaud", {waitUntil:"networkidle2", timeout:30000});
    const indeed = await page.evaluate(() => {
      const titles = [...document.querySelectorAll('h2[class*="title"], [class*="jobTitle"], [data-testid*="title"]')].map(e=>e.innerText.trim()).filter(Boolean).slice(0,5);
      const links = [...document.querySelectorAll('a[href*="viewjob"], a[href*="/rc/clk"], a[href*="jk="]')].map(a=>a.href).slice(0,5);
      const bodyText = document.body.innerText.substring(0,300);
      return {titles, links, bodyText};
    });
    console.log("Titres:", indeed.titles);
    console.log("Liens:", indeed.links.map(l=>l.substring(0,100)));
    console.log("Body:", indeed.bodyText);
  } catch(e) { console.log("Erreur Indeed:", e.message); }

  // MIGROS
  console.log("\n=== MIGROS ===");
  try {
    await page.goto("https://jobs.migros.ch/fr/nos-entreprises/groupe-migros/postes-vacants", {waitUntil:"networkidle2", timeout:30000});
    const migros = await page.evaluate(() => {
      const jobLinks = [...document.querySelectorAll('a[href*="/job/"]')].map(a=>({href:a.href.substring(0,100), text:a.innerText.trim().substring(0,60)})).slice(0,5);
      const allHrefs = [...document.querySelectorAll('a')].map(a=>a.href).filter(h=>h.length>10).slice(0,10);
      const bodyText = document.body.innerText.substring(0,300);
      return {jobLinks, allHrefs, bodyText};
    });
    console.log("Liens job:", migros.jobLinks);
    console.log("Tous liens:", migros.allHrefs.map(l=>l.substring(0,100)));
    console.log("Body:", migros.bodyText);
  } catch(e) { console.log("Erreur Migros:", e.message); }

  // NESTLE
  console.log("\n=== NESTLE ===");
  try {
    await page.goto("https://www.nestle.ch/fr/emplois", {waitUntil:"networkidle2", timeout:30000});
    const nestle = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a')].map(a=>a.href).filter(h=>h.includes('job')||h.includes('career')||h.includes('emploi')||h.includes('nestle')).slice(0,10);
      const bodyText = document.body.innerText.substring(0,300);
      return {links, bodyText};
    });
    console.log("Liens:", nestle.links.map(l=>l.substring(0,100)));
    console.log("Body:", nestle.bodyText);
  } catch(e) { console.log("Erreur Nestlé:", e.message); }

  // COOP
  console.log("\n=== COOP ===");
  try {
    await page.goto("https://jobs.coopjobs.ch/?lang=fr", {waitUntil:"networkidle2", timeout:30000});
    const coop = await page.evaluate(() => {
      const jobLinks = [...document.querySelectorAll('a')].filter(a=>a.href.includes('job')||a.href.includes('poste')||a.href.includes('vacancy')).map(a=>({href:a.href.substring(0,100), text:a.innerText.trim().substring(0,60)})).slice(0,10);
      const bodyText = document.body.innerText.substring(0,300);
      return {jobLinks, bodyText};
    });
    console.log("Liens:", coop.jobLinks);
    console.log("Body:", coop.bodyText);
  } catch(e) { console.log("Erreur Coop:", e.message); }

  // LINKEDIN
  console.log("\n=== LINKEDIN ===");
  try {
    await page.goto("https://www.linkedin.com/jobs/search/?keywords=assistant+administratif&location=Vaud%2C+Suisse", {waitUntil:"networkidle2", timeout:30000});
    const linkedin = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a[href*="/jobs/view/"]')].map(a=>a.href).slice(0,5);
      const titles = [...document.querySelectorAll('h3, [class*="title"]')].map(e=>e.innerText.trim()).filter(Boolean).slice(0,5);
      const bodyText = document.body.innerText.substring(0,300);
      return {links, titles, bodyText};
    });
    console.log("Liens:", linkedin.links.map(l=>l.substring(0,100)));
    console.log("Titres:", linkedin.titles);
    console.log("Body:", linkedin.bodyText);
  } catch(e) { console.log("Erreur LinkedIn:", e.message); }

  await browser.close();
  console.log("\n=== DONE ===");
})().catch(console.error);