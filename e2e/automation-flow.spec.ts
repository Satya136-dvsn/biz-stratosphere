
import { test, expect } from '@playwright/test';

// Skip automation flow test - requires proper auth setup for E2E testing
test.skip('Automation Flow: Create Rule', async ({ page }) => {
    // 1. Login
    await page.goto('/auth');
    await page.getByPlaceholder('Email').fill('test@example.com'); // Assumes existing user or mock auth
    await page.getByPlaceholder('Password').fill('password123'); // Password from earlier setup
    await page.click('button:has-text("Sign In")');

    // Wait for redirect
    await expect(page).toHaveURL('/');

    // 2. Navigate to Automation
    // Assuming sidebar has link "Automation", fallback to direct URL
    await page.goto('/automation');
    // OR await page.click('text=Automation');

    // 3. Open Wizard
    await page.click('button:has-text("Create Rule")');
    await expect(page.getByText('Rule Name')).toBeVisible();

    // 4. Fill Form
    // Step 1: Name
    await page.getByPlaceholder('e.g., Revenue Alert').fill('E2E Test Rule');
    await page.click('button:has-text("Next")');

    // Step 2: Condition
    await page.getByPlaceholder('e.g., 10000').fill('5000');
    await page.click('button:has-text("Next")');

    // Step 3: Schedule (skip/default)
    await page.click('button:has-text("Next")');

    // Step 4: Action
    await page.click('button:has-text("Create Rule")');

    // 5. Verify Success
    await expect(page.getByText('E2E Test Rule')).toBeVisible();
});
