
import { test, expect } from '@playwright/test';

// Skip admin flow tests - requires proper auth setup for E2E testing
test.describe.skip('Admin Control Plane', () => {
    test.beforeEach(async ({ page }) => {
        // Mock Auth Session
        await page.context().addCookies([
            { name: 'sb-access-token', value: 'fake-token', domain: 'localhost', path: '/' },
            { name: 'sb-refresh-token', value: 'fake-refresh', domain: 'localhost', path: '/' }
        ]);

        // Intercept Profile Request to force Admin Role
        await page.route('**/rest/v1/profiles*', async route => {
            const json = {
                id: 'admin-id',
                display_name: 'Admin User',
                role: 'admin',
                created_at: new Date().toISOString()
            };
            await route.fulfill({ json });
        });

        // Intercept Stats
        await page.route('**/rpc/get_admin_stats', async route => {
            await route.fulfill({
                json: {
                    total_users: 100,
                    total_workspaces: 10,
                    active_users_1h: 5,
                    api_requests_24h: 500,
                    predictions_24h: 200,
                    recent_errors_24h: 0
                }
            });
        });
    });

    test('should prevent non-admins', async ({ page }) => {
        // Override mock to return User role
        await page.route('**/rest/v1/profiles*', async route => {
            const json = { role: 'user', id: 'user-id' };
            await route.fulfill({ json });
        });

        await page.goto('/admin');
        // valid check: should redirect to dashboard or show 403.
        // My AdminRoute redirects to /dashboard if logged in but not admin.
        // Wait for navigation
        await expect(page).toHaveURL(/\/dashboard/);
    });

    test('should allow admin access and load dashboard', async ({ page }) => {
        await page.goto('/admin');
        await expect(page.getByText('Admin Control Plane')).toBeVisible();
        await expect(page.getByText('Total Users')).toBeVisible();
        await expect(page.getByText('100')).toBeVisible(); // Mocked value
    });

    test('should navigate to user management', async ({ page }) => {
        // Mock get_admin_users response
        await page.route('**/rpc/get_admin_users', async route => {
            await route.fulfill({
                json: [
                    { id: '1', email: 'u1@test.com', full_name: 'User One', role: 'user', suspended: false, created_at: new Date().toISOString() }
                ]
            });
        });

        await page.goto('/admin');
        // Find link/button to users?
        // In Dashboard, Active Users card is clickable.
        await page.getByText('Active Users').click();

        await expect(page).toHaveURL(/\/admin\/users/);
        await expect(page.getByText('User Management')).toBeVisible();
        await expect(page.getByText('u1@test.com')).toBeVisible();
    });
});
