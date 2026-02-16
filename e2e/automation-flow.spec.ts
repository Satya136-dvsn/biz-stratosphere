// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { test, expect } from './fixtures/auth';

/**
 * Automation Flow Tests
 * Tests automation rule creation and management
 */
test.describe('Automation Rules', () => {
    test('should display automation rules page', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/automation-rules');
        // Wait for page header
        await authenticatedPage.waitForSelector('h2:has-text("Automation Rules")', { state: 'visible', timeout: 15000 });

        // Verify page loaded - check for heading
        await expect(authenticatedPage.locator('h2:has-text("Automation Rules")').first()).toBeVisible({ timeout: 10000 });
    });

    test('should show Create Rule button', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/automation-rules');
        // Wait for create button
        await authenticatedPage.waitForSelector('[data-testid="create-rule-button"]', { state: 'visible', timeout: 15000 });

        // Use data-testid for stable selector
        const createButton = authenticatedPage.locator('[data-testid="create-rule-button"]');
        await expect(createButton).toBeVisible({ timeout: 10000 });
    });

    test('should open rule creation wizard', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/automation-rules');
        // Wait for create button before clicking
        await authenticatedPage.waitForSelector('[data-testid="create-rule-button"]', { state: 'visible', timeout: 15000 });

        // Click Create Rule button using data-testid
        await authenticatedPage.locator('[data-testid="create-rule-button"]').click();

        // Wait for wizard to appear using data-testid
        await expect(authenticatedPage.locator('[data-testid="wizard-title"]')).toBeVisible({ timeout: 5000 });

        // Also verify rule name input is visible
        await expect(authenticatedPage.locator('[data-testid="rule-name-input"]')).toBeVisible();
    });

    test('should show existing rules if any', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/automation-rules');
        // Wait for header
        await authenticatedPage.waitForSelector('h2:has-text("Automation Rules")', { state: 'visible', timeout: 15000 });

        // The page should show either rules or the empty state message
        const pageContent = authenticatedPage.locator('body');
        await expect(pageContent).toBeVisible();

        // Verify page has loaded by checking for heading
        await expect(authenticatedPage.locator('h2:has-text("Automation Rules")')).toBeVisible();
    });
});

/**
 * AI Chat Tests
 */
test.describe('AI Chat', () => {
    test('should load AI chat page', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/ai-chat');
        // Wait for chat input or heading with longer timeout
        await authenticatedPage.waitForSelector('[data-testid="ai-chat-input"], h1, h2', { state: 'visible', timeout: 60000 });

        // Use data-testid for stable selector - check for chat input or heading
        const chatInput = authenticatedPage.locator('[data-testid="ai-chat-input"]');
        const aiHeading = authenticatedPage.locator('h1:has-text("AI"), h2:has-text("AI")');

        // Either chat input or heading should be visible
        await expect(chatInput.or(aiHeading).first()).toBeVisible({ timeout: 10000 });
    });
});

/**
 * ML Predictions Tests
 */
test.describe('ML Predictions', () => {
    test('should load ML predictions page', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/ml-predictions');
        // Wait for content (increased timeout for Firefox stability)
        await authenticatedPage.waitForSelector('h1, h2', { state: 'visible', timeout: 60000 });

        // Should see ML predictions heading or content
        await expect(authenticatedPage.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    });
});
