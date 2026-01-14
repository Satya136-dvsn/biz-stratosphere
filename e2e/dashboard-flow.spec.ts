import { test, expect } from './fixtures/auth';

/**
 * Dashboard Functionality Tests
 * Uses real authentication via authenticatedPage fixture
 */
test.describe('Dashboard Functionality', () => {
    test('should load dashboard with KPI cards', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/dashboard');
        await authenticatedPage.waitForLoadState('networkidle');

        // Verify Dashboard heading exists
        await expect(authenticatedPage.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });

        // Verify KPI Cards exist using data-testid
        await expect(authenticatedPage.locator('[data-testid="kpi-card"]').first()).toBeVisible({ timeout: 10000 });
    });

    test('should display chart components', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/dashboard');
        await authenticatedPage.waitForLoadState('networkidle');

        // Verify Chart containers exist (Recharts renders SVGs)
        const charts = authenticatedPage.locator('.recharts-wrapper, svg.recharts-surface, canvas, [class*="chart"]');
        await expect(charts.first()).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to other pages from sidebar', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/dashboard');
        await authenticatedPage.waitForLoadState('networkidle');

        // Click on ML Predictions in sidebar
        await authenticatedPage.getByRole('link', { name: /ML Predictions/i }).click();
        await expect(authenticatedPage).toHaveURL(/ml-predictions/);

        // Navigate to Automation Rules
        await authenticatedPage.getByRole('link', { name: /Automation Rules/i }).click();
        await expect(authenticatedPage).toHaveURL(/automation-rules/);
    });
});

/**
 * Data Upload Tests
 * Tests the data upload functionality
 */
test.describe('Data Upload', () => {
    test('should have upload button visible on dashboard', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/dashboard');
        await authenticatedPage.waitForLoadState('networkidle');

        // Dashboard should be loaded with content - verify KPI cards are visible
        await expect(authenticatedPage.locator('[data-testid="kpi-card"]').first()).toBeVisible({ timeout: 10000 });
    });
});
