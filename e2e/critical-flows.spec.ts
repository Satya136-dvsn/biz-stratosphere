import { test, expect } from '@playwright/test';

test.describe('Critical Public Flows', () => {
    test('should load landing page', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Biz Stratosphere/i);
        await expect(page.getByRole('heading', { name: /Biz Stratosphere/i })).toBeVisible();
    });

    test('should navigate to login page', async ({ page }) => {
        await page.goto('/auth');
        // Check for common login elements
        await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
        await expect(page.getByText('Sign in to your account')).toBeVisible();
    });

    test('should redirect unauthenticated dashboard access', async ({ page }) => {
        await page.goto('/dashboard');
        // Expect to be redirected to auth or see auth screen
        await expect(page).toHaveURL(/auth|login/);
    });
});

