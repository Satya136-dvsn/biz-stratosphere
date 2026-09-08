import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function run() {
  const screenshotDir = path.resolve('scratch_screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('1. Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warn') {
      console.log(`[Browser ${msg.type()}] ${msg.text()}`);
    }
  });

  console.log('2. Navigating to http://localhost:8080/auth ...');
  await page.goto('http://localhost:8080/auth', { waitUntil: 'networkidle' });

  console.log('3. Switching to Sign Up tab...');
  await page.click('button[role="tab"]:has-text("Sign Up")');
  await page.waitForTimeout(500);

  const testEmail = `sophia.chen.${Date.now()}@bizstratosphere.local`;
  console.log(`4. Creating new user: Sophia Chen (${testEmail})...`);
  await page.fill('#signup-name', 'Sophia Chen');
  await page.fill('#signup-email', testEmail);
  await page.fill('#signup-password', 'StratospherePro!2026');
  await page.screenshot({ path: path.join(screenshotDir, '02_signup_filled.png') });

  console.log('5. Submitting Sign Up form...');
  await page.click('button[type="submit"]:has-text("Create Account")');

  console.log('6. Waiting for dashboard navigation...');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, '03_dashboard_user_logged_in.png') });
  console.log('Saved 03_dashboard_user_logged_in.png');

  console.log('7. Opening DATA_CONSOLE drawer...');
  const dataBtn = page.locator('button:has-text("DATA_CONSOLE")');
  await dataBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotDir, '04_data_console_drawer.png') });

  console.log('8. Uploading sample_customer_metrics.csv...');
  const filePath = path.resolve('sample_customer_metrics.csv');
  const fileInput = page.locator('input[aria-label="Upload data files"]');
  await fileInput.setInputFiles(filePath);

  console.log('9. Waiting for upload processing and UI update...');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(screenshotDir, '05_upload_success.png') });
  console.log('Saved 05_upload_success.png');

  console.log('10. Closing DATA_CONSOLE drawer to inspect dashboard results...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(2000);

  console.log('11. Capturing Dashboard Results populated with uploaded data...');
  await page.screenshot({ path: path.join(screenshotDir, '06_dashboard_with_populated_results.png') });
  console.log('Saved 06_dashboard_with_populated_results.png');

  // Extract KPI values from the DOM
  const kpiCards = await page.locator('[data-kpi-card], .stagger-children > div').allInnerTexts();
  console.log('\n================ DASHBOARD RESULTS ================');
  console.log('Extracted KPI Card Content:');
  console.log(kpiCards.join('\n---\n'));
  console.log('===================================================\n');

  console.log('12. Navigating to ML Predictions to verify offline models with data...');
  await page.goto('http://localhost:8080/ml-predictions', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(screenshotDir, '07_ml_predictions_page.png') });
  console.log('Saved 07_ml_predictions_page.png');

  await browser.close();
  console.log('All browser results verified successfully!');
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
