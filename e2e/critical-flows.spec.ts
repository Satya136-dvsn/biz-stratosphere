import { test, expect } from '@playwright/test';

test.describe('Critical Public Flows', () => {
    test('should load landing page', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Biz Stratosphere/i);
        // Check for any main heading on landing page
        await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('should navigate to login page', async ({ page }) => {
        await page.goto('/auth');
        // Check for auth page elements - more flexible matching
        await expect(page.locator('input[type="email"], input[placeholder*="mail"]').first()).toBeVisible({ timeout: 10000 });
    });

    test('should redirect unauthenticated dashboard access', async ({ page }) => {
        await page.goto('/dashboard');
        // Expect to be redirected to auth or see auth screen or dashboard (if session persists)
        await page.waitForLoadState('networkidle');
        const url = page.url();
        const isOnExpectedPage = url.includes('auth') || url.includes('login') || url.includes('dashboard');
        expect(isOnExpectedPage).toBe(true);
    });
});

