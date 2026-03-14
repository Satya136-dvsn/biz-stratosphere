// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * Playwright Auth Fixtures for Biz Stratosphere E2E Tests
 * 
 * These fixtures provide authenticated page contexts for testing protected routes.
 * They use mocked Supabase authentication to decouple from real database.
 */

import { test as base, expect, Page, BrowserContext } from '@playwright/test';

// Test user credentials
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
 * Mocks ALL Supabase Auth requests comprehensively
 */
async function mockSupabaseAuth(page: Page, role: 'user' | 'admin' = 'user') {
    const userId = role === 'admin' ? 'admin-id' : 'test-user-id';
    const email = role === 'admin' ? TEST_ADMIN_EMAIL : TEST_USER_EMAIL;

    const fakeUser = {
        id: userId,
        email,
        role: 'authenticated',
        aud: 'authenticated',
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: { name: role === 'admin' ? 'Admin User' : 'Test User' },
        created_at: new Date().toISOString(),
    };

    const fakeSession = {
        access_token: 'fake-access-token-' + role,
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'fake-refresh-token-' + role,
        user: fakeUser,
    };

    // Mock login (password grant)
    await page.route('**/auth/v1/token?grant_type=password', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(fakeSession),
        });
    });

    // Mock token refresh
    await page.route('**/auth/v1/token?grant_type=refresh_token', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(fakeSession),
        });
    });

    // Mock session checking (GET /auth/v1/user)
    await page.route('**/auth/v1/user', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(fakeUser),
        });
    });

    // Mock role lookup from profiles
    await page.route('**/rest/v1/profiles**', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ id: userId, role, email }]),
        });
    });

    // Mock any other rest/v1 calls (tables the dashboard might query on load)
    await page.route('**/rest/v1/**', async route => {
        // Default empty array for any table query
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
        });
    });
}

/**
 * Injects a fake Supabase session into localStorage so the app
 * recognizes the user as authenticated without needing form login.
 */
async function injectSession(page: Page, role: 'user' | 'admin' = 'user') {
    const userId = role === 'admin' ? 'admin-id' : 'test-user-id';
    const email = role === 'admin' ? TEST_ADMIN_EMAIL : TEST_USER_EMAIL;

    const sessionData = {
        access_token: 'fake-access-token-' + role,
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'fake-refresh-token-' + role,
        user: {
            id: userId,
            email,
            role: 'authenticated',
            aud: 'authenticated',
            app_metadata: { provider: 'email', providers: ['email'] },
            user_metadata: { name: role === 'admin' ? 'Admin User' : 'Test User' },
            created_at: new Date().toISOString(),
        },
    };

    // Supabase stores session in localStorage with a key pattern like:
    // sb-<project-ref>-auth-token
    await page.evaluate((session) => {
        // Find the correct key or set a generic one
        const keys = Object.keys(localStorage);
        const sbKey = keys.find(k => k.includes('supabase') || k.includes('sb-')) || 'sb-auth-token';
        localStorage.setItem(sbKey, JSON.stringify(session));
    }, sessionData);
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
            // Mock all Supabase Auth network requests
            await mockSupabaseAuth(page, 'user');

            // Navigate to auth page
            await page.goto('/auth');
            await page.waitForLoadState('networkidle', { timeout: 30000 });

            // Fill login form
            const emailInput = page.locator('input[type="email"]');
            const passwordInput = page.locator('input[type="password"]');

            if (await emailInput.isVisible({ timeout: 15000 })) {
                await emailInput.fill(TEST_USER_EMAIL);
                await passwordInput.fill(TEST_USER_PASSWORD);

                // Click sign in button
                await page.locator('button[type="submit"]').click();

                // Wait for redirect to dashboard with generous timeout
                try {
                    await page.waitForURL('**/dashboard**', { timeout: 45000 });
                } catch {
                    // Fallback: if redirect didn't happen, inject session and navigate directly
                    await injectSession(page, 'user');
                    await page.goto('/dashboard');
                    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
                }
            } else {
                // No login form visible - inject session and go to dashboard directly
                await injectSession(page, 'user');
                await page.goto('/dashboard');
                await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
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
            await page.waitForLoadState('networkidle', { timeout: 30000 });

            // Fill login form with admin credentials
            const emailInput = page.locator('input[type="email"]');
            const passwordInput = page.locator('input[type="password"]');

            if (await emailInput.isVisible({ timeout: 15000 })) {
                await emailInput.fill(TEST_ADMIN_EMAIL);
                await passwordInput.fill(TEST_ADMIN_PASSWORD);

                // Click sign in button
                await page.locator('button[type="submit"]').click();

                // Wait for redirect
                try {
                    await page.waitForURL(/\/(dashboard|admin)/, { timeout: 45000 });
                } catch {
                    await injectSession(page, 'admin');
                    await page.goto('/dashboard');
                    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
                }
            } else {
                await injectSession(page, 'admin');
                await page.goto('/dashboard');
                await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
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
        await page.waitForLoadState('networkidle', { timeout: 30000 });

        const emailInput = page.locator('input[type="email"]');
        if (await emailInput.isVisible({ timeout: 15000 })) {
            await emailInput.fill(TEST_USER_EMAIL);
            await page.locator('input[type="password"]').fill(TEST_USER_PASSWORD);
            await page.locator('button[type="submit"]').click();
            try {
                await page.waitForURL('**/dashboard**', { timeout: 45000 });
            } catch {
                await injectSession(page, 'user');
                await page.goto('/dashboard');
                await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
            }
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
        const logoutButton = page.locator('button:has-text("Sign Out"), button:has-text("Logout")');
        return await logoutButton.isVisible({ timeout: 5000 });
    } catch {
        return false;
    }
}

/**
 * Helper to login with custom credentials
 */
export async function loginAs(page: Page, email: string, password: string): Promise<void> {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();

    // Wait for redirect
    await page.waitForURL('**/dashboard**', { timeout: 45000 });
}

/**
 * Helper to logout
 */
export async function logout(page: Page): Promise<void> {
    try {
        const logoutButton = page.locator('button:has-text("Sign Out")');
        if (await logoutButton.isVisible({ timeout: 3000 })) {
            await logoutButton.click();
            await page.waitForURL('/auth', { timeout: 10000 });
        }
    } catch {
        await page.goto('/auth');
    }
}

// Re-export expect
export { expect };
