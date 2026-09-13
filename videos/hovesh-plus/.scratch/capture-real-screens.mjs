import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';

const OUT = 'C:\\Users\\User\\Desktop\\medic-app\\videos\\hovesh-plus\\assets\\real-screens';
fs.mkdirSync(OUT, { recursive: true });
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function shot(page, name) {
  const p = path.join(OUT, name + '.png');
  await page.screenshot({ path: p });
  console.log('saved', p);
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 3,
    locale: 'he-IL',
  });
  const page = await context.newPage();
  await page.goto('https://hovesh-plus.vercel.app', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);

  try {
    const cont = page.getByRole('button', { name: 'המשך' }).first();
    if (await cont.isVisible({ timeout: 3000 })) { await cont.click(); await page.waitForTimeout(600); }
  } catch {}

  try {
    const cb = page.locator('input[type=checkbox]').first();
    if (await cb.isVisible({ timeout: 3000 })) {
      await cb.check();
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: 'המשך' }).first().click();
      await page.waitForTimeout(1000);
    }
  } catch (e) { console.log('disclaimer step:', e.message); }

  await page.waitForTimeout(800);
  await shot(page, '01-dashboard');

  // Start נשימות (breaths) timer — play button center per measured rect
  try {
    await page.mouse.click(158, 216);
    await page.waitForTimeout(700);
    await shot(page, '02-breaths-running');
  } catch (e) { console.log('breaths click failed', e.message); }

  // Start דופק (pulse) timer
  try {
    await page.mouse.click(341, 216);
    await page.waitForTimeout(700);
    await shot(page, '03-pulse-running');
  } catch (e) { console.log('pulse click failed', e.message); }

  // wait for timers to finish/settle, reload to reset state for clean metronome shot
  await page.waitForTimeout(2500);

  // Start metronome
  try {
    const startBtn = page.getByLabel('הפעל').first();
    await startBtn.click();
    await page.waitForTimeout(900);
    await shot(page, '04-metronome-running');
    await startBtn.click(); // stop it again, cleanliness
  } catch (e) { console.log('metronome click failed', e.message); }

  // Calculators
  try {
    await page.getByRole('button', { name: 'מחשבונים' }).click();
    await page.waitForTimeout(900);
    await shot(page, '05-calculators');
  } catch (e) { console.log('calculators nav failed', e.message); }

  // Back to tools, then vitals history
  try {
    await page.getByRole('button', { name: 'כלים' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'היסטוריית מדדים' }).click();
    await page.waitForTimeout(900);
    await shot(page, '06-vitals-history');
  } catch (e) { console.log('history nav failed', e.message); }

  // Translation aid
  try {
    // go back to tools tab first if needed
    const backBtn = page.getByRole('button', { name: 'כלים' });
    if (await backBtn.isVisible().catch(() => false)) { await backBtn.click(); await page.waitForTimeout(400); }
    await page.getByRole('button', { name: 'סיוע בתרגום' }).click();
    await page.waitForTimeout(900);
    await shot(page, '07-translate');
  } catch (e) { console.log('translate nav failed', e.message); }

  await browser.close();
  console.log('DONE');
})().catch((e) => { console.error(e); process.exit(1); });
