const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
  
  console.log('Chargement de l\'offre...');
  await page.goto('https://www.jobup.ch/fr/emplois/detail/59502160-b064-47dd-b9a8-35fd30d07c0b/', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  const result = await page.evaluate(() => {
    const title = document.querySelector('h1')?.innerText || '';
    const description = document.querySelector('[data-feat="jobdescription"]')?.innerText || 
                       document.querySelector('.job-description')?.innerText ||
                       document.querySelector('article')?.innerText || '';
    return { title, descriptionLength: description.length, descriptionPreview: description.substring(0, 300) };
  });

  console.log('Titre:', result.title);
  console.log('Description longueur:', result.descriptionLength);
  console.log('Aperçu:', result.descriptionPreview);

  await browser.close();
})();