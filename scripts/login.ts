import puppeteer from 'puppeteer';
import fs from 'fs-extra';

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://x.com/login');
  console.log('Please log in manually...');

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
  await delay(60000); // Wait 60 seconds

  const cookies = await page.cookies();
  await fs.outputJSON('./data/cookies.json', cookies, { spaces: 2 });
  console.log('✅ Cookies saved to data/cookies.json');

  await browser.close();
})();
