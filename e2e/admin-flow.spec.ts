// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { test, expect } from './fixtures/auth';

/**
 * Admin Control Plane Tests
 * Uses authenticatedPage fixture for admin-specific tests
 */
test.describe('Admin Control Plane', () => {
    test('should prevent non-admins from accessing admin panel', async ({ authenticatedPage }) => {
        // Regular user tries to access admin
        await authenticatedPage.goto('/admin');

        // Should redirect to dashboard (not admin panel)

        // Should redirect to dashboard (not admin panel)
        await expect(authenticatedPage).toHaveURL(/\/(dashboard|$)/, { timeout: 30000 });
    });

    test('should allow authenticated user to view profile', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/profile');
        // Wait for profile header instead of network idle
        await authenticatedPage.waitForSelector('h1, h2, h3', { state: 'visible', timeout: 15000 });

        // Should see profile page heading or content
        await expect(authenticatedPage.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
    });

    test('should show user info in sidebar', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/dashboard');
        // Wait for sidebar to be attached
        await authenticatedPage.waitForSelector('nav, aside', { state: 'attached' });

        // Sidebar should be visible
        await expect(authenticatedPage.locator('nav, aside, [class*="sidebar"]').first()).toBeVisible({ timeout: 5000 });
    });
});

/**
 * RBAC (Role-Based Access Control) Tests
 */
test.describe('RBAC Protection', () => {
    test('should protect admin routes', async ({ authenticatedPage }) => {
        // Try accessing admin route
        await authenticatedPage.goto('/admin');
        await authenticatedPage.waitForLoadState('networkidle');

        // Non-admin should be redirected away from admin panel
        // Either redirected to dashboard OR admin heading is not visible
        const url = authenticatedPage.url();
        const isOnAdmin = url.includes('/admin');

        if (isOnAdmin) {
            // If still on admin URL, verify admin panel heading is not visible (access denied)
            const adminHeading = authenticatedPage.locator('h1:has-text("Admin Control Plane"), h2:has-text("Admin Control Plane")');
            const isVisible = await adminHeading.isVisible().catch(() => false);
            expect(isVisible).toBeFalsy();
        }
        // If redirected, test passes
    });
});
