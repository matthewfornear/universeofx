import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import { createWriteStream } from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COOKIES_PATH = './data/cookies.json';
const OUTPUT = './public/universe/universe2.json';
const COMMUNITY_URL = 'https://x.com/i/communities/1493446837214187523/members';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

type EnrichedUser = {
  handle: string;
  name: string;
  bio: string;
  followers: number | null;
  pfp_url: string;
};

const downloadImage = (url: string, filename: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, '..', 'public', 'pfp', filename);
    const file = createWriteStream(filePath);
    https
      .get(url, response => {
        response.pipe(file);
        file.on('finish', () => {
          file.close(err => {
            if (err) reject(err);
            else resolve();
          });
        });
      })
      .on('error', reject);
  });
};

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  const cookies = await fs.readJSON(COOKIES_PATH);
  await page.setCookie(...cookies);

  await page.goto(COMMUNITY_URL, { waitUntil: 'domcontentloaded' });
  await page.setViewport({ width: 1400, height: 1000 });
  console.log('🔁 Scrolling and scraping...');

  await page.waitForSelector('[data-testid="UserCell"]', { timeout: 30000 });

  const collected = new Map<string, EnrichedUser>();
  const processedHandles = new Set<string>();

  // Load previously collected users if OUTPUT exists
  if (await fs.pathExists(OUTPUT)) {
    const previousUsers: EnrichedUser[] = await fs.readJSON(OUTPUT);
    for (const user of previousUsers) {
      collected.set(user.handle, user);
      processedHandles.add(user.handle);
    }
    console.log(`🔁 Resuming. Loaded ${processedHandles.size} previously collected users.`);
  }

  let stagnantScrolls = 0;
  let lastHandle = '';

  while (stagnantScrolls < 5) {
    const cellCount = await page.$$eval('[data-testid="UserCell"]', els => els.length);
    let foundUnprocessed = false;

    for (let i = 0; i < cellCount; i++) {
      const userCells = await page.$$('[data-testid="UserCell"]');
      const el = userCells[i];
      if (!el) continue;

      // Find the avatar container and extract the handle
      const avatarContainer = await el.$('[data-testid^="UserAvatar-Container-"]');
      let handle = '';
      if (avatarContainer) {
        const dataTestId = await avatarContainer.evaluate(node => node.getAttribute('data-testid'));
        if (dataTestId && dataTestId.startsWith('UserAvatar-Container-')) {
          handle = dataTestId.replace('UserAvatar-Container-', '');
        }
      }
      if (!handle || processedHandles.has(handle)) continue;

      foundUnprocessed = true;

      // Force real de-hover before each hover
      await page.mouse.move(0, 0); // move to top-left to "exit" last hover
      await delay(300);

      // Hover the avatar container to spawn the card
      if (avatarContainer) {
        await avatarContainer.hover();
        await delay(1200);
      } else {
        continue;
      }

      // Wait for the hover card to appear
      try {
        await page.waitForSelector('[data-testid="HoverCard"]', { timeout: 3000 });
      } catch {
        console.warn(`⚠️ Hover card did not appear for @${handle}, using fallback bio/followers.`);
      }

      // Extract bio and followers from the hover card
      const hoverCardData = await page.evaluate(() => {
        let bio = '';
        let followers = null;

        // BIO
        const card = document.querySelector('[data-testid="HoverCard"]');
        if (card) {
          const bioDivs = Array.from(card.querySelectorAll('div[dir="auto"]'));
          const bioDiv = bioDivs.find(div => {
            const text = div.textContent?.toLowerCase() || '';
            return (
              text !== '' &&
              !text.includes('click to follow') &&
              !text.includes('@') && // not a handle
              !text.includes('following') &&
              div.querySelectorAll('span').length <= 2 // likely not a button or link block
            );
          });
          if (bioDiv) {
            // Preserve all text, including emojis (replace <img alt="..."> with their alt text)
            bio = Array.from(bioDiv.childNodes).map(node => {
              if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'IMG') {
                return ((node as HTMLImageElement).alt) || '';
              } else {
                return node.textContent || '';
              }
            }).join('').trim();
          }

          // FOLLOWERS
          const followersLink = Array.from(card.querySelectorAll('a')).find(a => {
            const href = a.getAttribute('href');
            return href && /followers$/.test(href);
          });
          if (followersLink) {
            const span = followersLink.querySelector('span');
            if (span && span.textContent) {
              const text = span.textContent;
              if (/k/i.test(text)) followers = Math.floor(parseFloat(text) * 1000);
              else if (/m/i.test(text)) followers = Math.floor(parseFloat(text) * 1000000);
              else followers = parseInt(text.replace(/[^0-9]/g, ''));
            }
          }
        }
        return { bio, followers };
      });
      const bio = hoverCardData.bio;
      const followers = hoverCardData.followers;
      lastHandle = handle;

      // De-hover: move mouse far right of the user row (optional, but keep for safety)
      const boundingBox = await el.boundingBox();
      if (boundingBox) {
        await page.mouse.move(boundingBox.x + boundingBox.width + 50, boundingBox.y);
        await delay(500);
      }

      // Extract profile image
      let pfp = '';
      const imgEl = await el.$('img');
      if (imgEl) {
        pfp = await imgEl.evaluate(i => i.getAttribute('src') || '');
      }

      // Download the profile image if available
      if (pfp) {
        try {
          await downloadImage(pfp, `${handle}.jpg`);
        } catch (err) {
          console.warn(`Failed to download pfp for @${handle}:`, err);
        }
      }

      // Extract name from the cell
      let name = '';
      const nameSpan = await el.$('span');
      if (nameSpan) {
        name = await nameSpan.evaluate(node => node.textContent || '');
      }

      const user: EnrichedUser = {
        handle,
        name,
        bio,
        followers: isNaN(followers as any) ? null : followers,
        pfp_url: pfp // original URL
      };

      collected.set(handle, user);
      processedHandles.add(handle);
      console.log(`Collected user: @${handle}`);

      // Save metadata every 25 users
      if (collected.size % 25 === 0) {
        await fs.ensureDir('./data');
        await fs.writeJSON(OUTPUT, Array.from(collected.values()), { spaces: 2 });
        console.log('Wrote user data:', Array.from(collected.values()).length);
      }
      continue; // Move to next user in the current viewport
    }

    // After processing all visible users, check for new handles
    const visibleHandles = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-testid^="UserAvatar-Container-"]')).map(el =>
        el.getAttribute('data-testid')?.replace('UserAvatar-Container-', '') || ''
      )
    );
    const newHandles = visibleHandles.filter(h => !processedHandles.has(h));
    if (newHandles.length === 0) {
      stagnantScrolls++;
    } else {
      stagnantScrolls = 0;
    }

    // Scroll by a full viewport to force new users into view
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });
    await delay(1000);
  }

  await browser.close();
  // Final save
  await fs.ensureDir('./data');
  await fs.writeJSON(OUTPUT, Array.from(collected.values()), { spaces: 2 });
  console.log('Final user data written:', Array.from(collected.values()).length);
  console.log(`Total users collected: ${collected.size}`);
  console.log(`✅ Done. Collected ${collected.size} users.`);
})();
