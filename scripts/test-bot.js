/**
 * One-off smoke test for botSubmitter.js
 *
 * Walks through all 6 steps of the United Settlement form WITHOUT clicking
 * the final "Get Started" button — we just want to prove navigation +
 * typing works end-to-end without dumping a fake lead into their CRM.
 *
 * Run: node scripts/test-bot.js
 */

const { chromium } = require('playwright');

const FORM_URL = 'https://unitedsettlement.com/will-debt-relief-help-you-grp';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  console.log('[test] Launching Chromium...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
  const page = await context.newPage();

  // Capture console messages from the page
  page.on('console', (msg) => console.log(`[browser:${msg.type()}]`, msg.text()));
  page.on('pageerror', (err) => console.log('[browser:pageerror]', err.message));

  const checkpoint = async (label) => {
    // Snapshot which form fields are currently visible — tells us which step we're on
    const visible = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('input,select'));
      return all.filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && el.type !== 'hidden';
      }).map((el) => ({ name: el.name, type: el.type }));
    });
    console.log(`[test] ${label} → visible fields:`, visible.map(v => v.name).filter(Boolean));
  };

  try {
    console.log(`[test] Navigating to ${FORM_URL}...`);
    await page.goto(FORM_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(1000);
    await checkpoint('Step 1 (debt slider)');

    // Step 1: slider
    await page.evaluate(() => {
      const slider = document.querySelector('input[name="lamount"]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(slider, '25');
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await sleep(500);
    await page.locator('button:has-text("Continue")').filter({ visible: true }).first().click();
    await sleep(1000);
    await checkpoint('Step 2 (after debt continue)');

    // Step 2: name
    await page.locator('input[name="fname"]').filter({ visible: true }).first().fill('TESTBOT');
    await page.locator('input[name="lname"]').filter({ visible: true }).first().fill('PleaseIgnore');
    await sleep(500);
    await page.locator('button:has-text("Continue")').filter({ visible: true }).first().click();
    await sleep(1000);
    await checkpoint('Step 3 (after name continue)');

    // Step 3: contact
    await page.locator('input[name="email"]').filter({ visible: true }).first().fill('bot-test@example.com');
    await page.locator('input[name="phone"]').filter({ visible: true }).first().fill('7185551234');
    await page.locator('select[name="state"]').filter({ visible: true }).first().selectOption('TX');
    await sleep(500);
    await page.locator('button:has-text("Continue")').filter({ visible: true }).first().click();
    await sleep(1500);

    // Dump any visible error/validation messages on the page after click
    const errors = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('*'));
      return els
        .filter((el) => {
          const t = (el.textContent || '').trim();
          if (!t || t.length > 200) return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && /invalid|required|please|valid|enter/i.test(t);
        })
        .slice(0, 8)
        .map((el) => el.textContent.trim().slice(0, 120));
    });
    console.log('[test] visible validation-like text on page:', errors);
    await checkpoint('Step 4 (after contact continue)');

    // Step 4: address
    await page.locator('input[name="address"]').filter({ visible: true }).first().fill('5441 Maple Dr');
    await page.locator('input[name="city"]').filter({ visible: true }).first().fill('Houston');
    await page.locator('input[name="zip"]').filter({ visible: true }).first().fill('77002');
    await sleep(500);
    await page.locator('button:has-text("Continue")').filter({ visible: true }).first().click();
    await sleep(1000);
    await checkpoint('Step 5 (after address continue)');

    // Step 5: DOB
    await page.locator('input[name="dob"]').filter({ visible: true }).first().fill('01/15/1985');
    await sleep(500);
    await page.locator('button:has-text("Continue")').filter({ visible: true }).first().click();
    await sleep(1000);
    await checkpoint('Step 6 (after DOB continue — should show SSN field + Get Started button)');

    // Step 6: SSN — fill but DON'T submit. We just verify the field is there.
    await page.locator('input[name="ssn"]').filter({ visible: true }).first().fill('000000000');
    await sleep(500);
    const getStartedExists = await page.locator('button:has-text("Get Started")').count();
    console.log(`[test] "Get Started" buttons found: ${getStartedExists}`);
    console.log('[test] STOPPING before final submit. All 6 steps reached successfully.');

    process.exitCode = 0;
  } catch (err) {
    console.error('[test] FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
})();
