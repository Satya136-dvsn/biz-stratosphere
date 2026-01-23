import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: 2, // Always retry to handle flaky WebKit tests
    workers: process.env.CI ? 1 : 4,
    reporter: 'html',

    timeout: 60000, // 60s global timeout
    expect: {
        timeout: 10000, // 10s expect timeout
    },
    use: {
        baseURL: 'http://localhost:8080',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        actionTimeout: 15000, // 15s action timeout
        navigationTimeout: 30000, // 30s navigation timeout
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        // WebKit has React hydration issues on Windows, skip locally
        ...(process.env.CI ? [{
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        }] : []),
    ],

    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:8080',
        reuseExistingServer: !process.env.CI,
    },
});
