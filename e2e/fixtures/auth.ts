// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * Playwright Auth Fixtures for Biz Stratosphere E2E Tests
 * 
 * These fixtures provide authenticated page contexts for testing protected routes.
 * They use real Supabase authentication with test credentials.
 */

import { test as base, expect, Page, BrowserContext } from '@playwright/test';

// Test user credentials - update these with actual test user credentials
// These users should exist in your Supabase auth.users table
const TEST_USER_EMAIL = 'testuser_2@example.com';
const TEST_USER_PASSWORD = 'StrongPassword123!';
const TEST_ADMIN_EMAIL = 'admin_test@example.com';
const TEST_ADMIN_PASSWORD = 'StrongPassword123!';

// Extended test fixtures
interface AuthFixtures {
    authenticatedPage: Page;
    adminPage: Page;
    authContext: BrowserContext;
}

/**
 * Mocks Supabase Auth requests to decouple E2E tests from real database rate limits
 */
async function mockSupabaseAuth(page: Page, role: 'user' | 'admin' = 'user') {
    const userId = role === 'admin' ? 'admin-id' : 'test-user-id';
    const email = role === 'admin' ? TEST_ADMIN_EMAIL : TEST_USER_EMAIL;

    // Mock login and token generation
    await page.route('**/auth/v1/token?grant_type=password', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: 'fake-access-token',
                token_type: 'bearer',
                expires_in: 3600,
                refresh_token: 'fake-refresh-token',
                user: { id: userId, email, role: 'authenticated', app_metadata: {}, user_metadata: {} }
            })
        });
    });

    // Mock session checking
    await page.route('**/auth/v1/user', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ id: userId, email, role: 'authenticated', app_metadata: {}, user_metadata: {} })
        });
    });

    // Mock role lookup from profiles collection
    await page.route('**/rest/v1/profiles?id=eq.*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ role }])
        });
    });
}

/**
 * Custom test with authentication fixtures
 */
export const test = base.extend<AuthFixtures>({
    // Authenticated page fixture - logs in as regular user
    authenticatedPage: async ({ browser }, use) => {
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            // Mock Supabase Auth network requests
            await mockSupabaseAuth(page, 'user');

            // Navigate to auth page
            await page.goto('/auth');
            await page.waitForLoadState('networkidle');

            // Fill login form
            const emailInput = page.locator('input[type="email"]');
            const passwordInput = page.locator('input[type="password"]');

            if (await emailInput.isVisible()) {
                await emailInput.fill(TEST_USER_EMAIL);
                await passwordInput.fill(TEST_USER_PASSWORD);

                // Click sign in button
                await page.locator('button[type="submit"]').click();

                // Wait for redirect to dashboard or home
                await page.waitForURL(/\/(dashboard|$)/, { timeout: 10000 });
            }

            await use(page);
        } finally {
            await context.close();
        }
    },

    // Admin page fixture - logs in as admin user
    adminPage: async ({ browser }, use) => {
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            // Mock Supabase Auth network requests for Admin
            await mockSupabaseAuth(page, 'admin');

            // Navigate to auth page
            await page.goto('/auth');
            await page.waitForLoadState('networkidle');

            // Fill login form with admin credentials
            const emailInput = page.locator('input[type="email"]');
            const passwordInput = page.locator('input[type="password"]');

            if (await emailInput.isVisible()) {
                await emailInput.fill(TEST_ADMIN_EMAIL);
                await passwordInput.fill(TEST_ADMIN_PASSWORD);

                // Click sign in button
                await page.locator('button[type="submit"]').click();

                // Wait for redirect
                await page.waitForURL(/\/(dashboard|admin|$)/, { timeout: 10000 });
            }

            await use(page);
        } finally {
            await context.close();
        }
    },

    // Shared auth context for multiple pages
    authContext: async ({ browser }, use) => {
        const context = await browser.newContext();
        const page = await context.newPage();

        // Mock shared context as regular user
        await mockSupabaseAuth(page, 'user');

        // Login once
        await page.goto('/auth');
        await page.waitForLoadState('networkidle');

        const emailInput = page.locator('input[type="email"]');
        if (await emailInput.isVisible()) {
            await emailInput.fill(TEST_USER_EMAIL);
            await page.locator('input[type="password"]').fill(TEST_USER_PASSWORD);
            await page.locator('button[type="submit"]').click();
            await page.waitForURL(/\/(dashboard|$)/, { timeout: 10000 });
        }

        await page.close();
        await use(context);
        await context.close();
    },
});

/**
 * Helper to check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
    try {
        // Check for presence of authenticated UI elements
        const logoutButton = page.locator('button:has-text("Sign Out"), button:has-text("Logout")');
        return await logoutButton.isVisible({ timeout: 2000 });
    } catch {
        return false;
    }
}

/**
 * Helper to login with custom credentials
 */
export async function loginAs(page: Page, email: string, password: string): Promise<void> {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();

    // Wait for redirect
    await page.waitForURL(/\/(dashboard|$)/, { timeout: 10000 });
}

/**
 * Helper to logout
 */
export async function logout(page: Page): Promise<void> {
    try {
        const logoutButton = page.locator('button:has-text("Sign Out")');
        if (await logoutButton.isVisible({ timeout: 2000 })) {
            await logoutButton.click();
            await page.waitForURL('/auth', { timeout: 5000 });
        }
    } catch {
        // Navigate directly if button not found
        await page.goto('/auth');
    }
}

// Re-export expect
export { expect };
