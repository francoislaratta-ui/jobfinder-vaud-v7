const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
  await page.goto('https://www.jobup.ch/fr/emplois/detail/59502160-b064-47dd-b9a8-35fd30d07c0b/', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });
  const text = await page.evaluate(() => document.body.innerText);
  console.log('LONGUEUR:', text.length);
  console.log('CONTENU:', text.substring(200, 900));
})().catch(console.error);