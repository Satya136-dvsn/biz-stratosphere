import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should display login page', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Biz Stratosphere/);
        await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    });

    test('should show validation errors for invalid login', async ({ page }) => {
        await page.goto('/');
        await page.getByLabel(/email/i).fill('invalid-email');
        await page.getByLabel(/password/i).fill('123');
        await page.getByRole('button', { name: /sign in/i }).click();

        // Should show error
        await expect(page.getByText(/invalid/i)).toBeVisible();
    });
});

test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        // Login first (you'd use test credentials)
        await page.goto('/');
        // await page.getByLabel(/email/i).fill('test@example.com');
        // await page.getByLabel(/password/i).fill('password123');
        // await page.getByRole('button', { name: /sign in/i }).click();
    });

    test('should display KPI cards', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.getByText(/revenue/i)).toBeVisible();
        await expect(page.getByText(/customers/i)).toBeVisible();
    });

    test('should open AI chatbot', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByRole('button', { name: /ai/i }).click();
        await expect(page.getByPlaceholder(/ask/i)).toBeVisible();
    });
});

test.describe('Data Upload', () => {
    test('should navigate to upload page', async ({ page }) => {
        await page.goto('/upload');
        await expect(page.getByText(/upload/i)).toBeVisible();
    });
});

test.describe('Search', () => {
    test('should open command palette with Cmd+K', async ({ page }) => {
        await page.goto('/dashboard');
        await page.keyboard.press('Meta+K');
        await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    });
});

test.describe('Notifications', () => {
    test('should display notifications bell', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.getByRole('button', { name: /notifications/i })).toBeVisible();
    });
});
