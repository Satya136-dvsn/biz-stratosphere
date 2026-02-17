
import { test, expect } from '@playwright/test';

test('simple screenshot', async ({ page }) => {
    test.use({ viewport: { width: 1280, height: 1024 } });

    console.log('Navigating to http://127.0.0.1:8082/dashboard');
    try {
        await page.goto('http://127.0.0.1:8082/dashboard', { timeout: 45000, waitUntil: 'domcontentloaded' });
    } catch (e) {
        console.log('Goto timed out, continuing to screenshot...');
    }

    console.log('Taking forced screenshot...');
    await page.screenshot({ path: 'force_dashboard.png', fullPage: true });
});
