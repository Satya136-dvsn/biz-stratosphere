import { chromium, errors } from 'playwright';
import fs from 'fs';
import { performance } from 'perf_hooks';

// Setup load parameters
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '200', 10);
const TARGET_URL = process.env.TARGET_URL || 'http://localhost:8080';
const CHAOS_MODE = process.env.CHAOS_MODE === 'true'; // Enable network drops/slow network

console.log(`Starting Enterprise Virtual Browser Load Test...`);
console.log(`Concurrency: ${CONCURRENCY} virtual users`);
console.log(`Target: ${TARGET_URL}`);
console.log(`Chaos Mode (Slow Network/Drops): ${CHAOS_MODE}`);

// Metrics
const metrics = {
    pageLoadLatencies: [],
    apiLatencies: [],
    errors: 0,
    success: 0,
    networkDrops: 0,
};

// We will mock Supabase Auth so we don't hit rate limits, but we let other API calls pass through
// to test the microservices under load.
async function mockSupabaseAuth(page) {
    await page.route('**/auth/v1/token?grant_type=password', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: 'load-test-token',
                token_type: 'bearer',
                expires_in: 3600,
                refresh_token: 'load-test-refresh',
                user: { id: 'load-user', email: 'load@example.com', role: 'authenticated', app_metadata: {}, user_metadata: {} }
            })
        });
    });

    await page.route('**/auth/v1/user', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ id: 'load-user', email: 'load@example.com', role: 'authenticated', app_metadata: {}, user_metadata: {} })
        });
    });
}

// Introduce chaos at the network layer for this context
async function applyChaos(context) {
    if (!CHAOS_MODE) return;
    
    await context.route('**/*', async (route) => {
        const url = route.request().url();
        const rand = Math.random();
        
        // 2% chance to drop connection entirely
        if (rand < 0.02) {
            metrics.networkDrops++;
            return route.abort('failed');
        }
        
        // 10% chance to add significant latency (Slow network)
        if (rand < 0.12) {
            await new Promise(r => setTimeout(r, Math.random() * 2000 + 1000));
        }
        
        route.continue();
    });
}

// Track API response latencies for backend AI endpoints
async function trackApiLatency(page) {
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/predict') || url.includes('/retrieve') || url.includes('/generate') || url.includes('/api/')) {
            const timing = response.request().timing();
            if (timing && timing.responseStart > 0) {
                const latency = timing.responseStart - timing.requestStart;
                if (latency > 0) metrics.apiLatencies.push(latency);
            }
        }
    });
}

async function runVirtualUser(browser, userId) {
    const context = await browser.newContext({
        ignoreHTTPSErrors: true,
        viewport: { width: 1280, height: 720 }
    });
    
    await applyChaos(context);

    const page = await context.newPage();
    await mockSupabaseAuth(page);
    await trackApiLatency(page);

    try {
        const startTotal = performance.now();

        // 1. Login Workflow
        const loadStart = performance.now();
        await page.goto(`${TARGET_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        const emailInput = page.locator('input[type="email"]');
        if (await emailInput.isVisible({ timeout: 5000 })) {
            await emailInput.fill('load@example.com');
            await page.locator('input[type="password"]').fill('LoadTest123!');
            await page.locator('button[type="submit"]').click();
        }

        // Wait for dashboard navigation
        await page.waitForURL(/\/(dashboard|$)/, { timeout: 15000 });
        metrics.pageLoadLatencies.push(performance.now() - loadStart);

        // 2. ML Prediction Workflow
        await page.goto(`${TARGET_URL}/ml-predictions`, { waitUntil: 'domcontentloaded' });
        // Assuming there are buttons or forms we can interact with, 
        // fallback to waiting for the page UI to stabilize
        await page.waitForTimeout(500 + Math.random() * 1000); 

        // 3. RAG Query & LLM Insight Workflow
        await page.goto(`${TARGET_URL}/ai-chat`, { waitUntil: 'domcontentloaded' });
        
        // Simulate "Refresh burst" for a subset of users
        if (CHAOS_MODE && Math.random() < 0.05) {
            for (let i = 0; i < 3; i++) {
                await page.reload({ waitUntil: 'domcontentloaded' });
            }
        }
        
        await page.waitForTimeout(1000 + Math.random() * 2000);

        // 4. Analytics Dashboard
        await page.goto(`${TARGET_URL}/analytics`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        metrics.success++;
    } catch (e) {
        metrics.errors++;
        // Ignore expected Playwright timeout/abort errors under heavy chaos
    } finally {
        await context.close();
    }
}

async function main() {
    const start = performance.now();
    
    // Launch browser (Using headless Chromium)
    const browser = await chromium.launch({
        headless: true,
        args: [
            '--disable-dev-shm-usage', // critical for high concurrency in Docker/Linux
            '--no-sandbox',
            '--disable-gpu'
        ]
    });

    console.log(`Browser launched. Spawning ${CONCURRENCY} virtual users...`);

    // In a real 500 session test, launching all 500 exactly concurrently will overload Node's event loop.
    // We batch them by groups of 50 to maintain high load without catastrophic OS lockup.
    const BATCH_SIZE = 50;
    let activePromises = [];

    for (let i = 1; i <= CONCURRENCY; i++) {
        activePromises.push(runVirtualUser(browser, i));
        
        if (i % BATCH_SIZE === 0 || i === CONCURRENCY) {
            console.log(`Spawned ${i} users... waiting for batch to process.`);
            await Promise.allSettled(activePromises);
            activePromises = [];
        }
    }

    await browser.close();
    const duration = (performance.now() - start) / 1000;

    console.log(`\n=== ENTERPRISE BROWSER LOAD TEST COMPLETE ===`);
    console.log(`Total Time: ${duration.toFixed(2)}s`);
    
    const printLatencies = (name, arr) => {
        if (arr.length === 0) return `N/A`;
        arr.sort((a, b) => a - b);
        const p50 = arr[Math.floor(arr.length * 0.5)];
        const p95 = arr[Math.floor(arr.length * 0.95)];
        const p99 = arr[Math.floor(arr.length * 0.99)];
        return `P50: ${p50?.toFixed(1)}ms | P95: ${p95?.toFixed(1)}ms | P99: ${p99?.toFixed(1)}ms`;
    };

    console.log(`\n[Results]`);
    console.log(`Successful Workflows: ${metrics.success}`);
    console.log(`Failed Workflows: ${metrics.errors}`);
    if (CHAOS_MODE) console.log(`Simulated Network Drops: ${metrics.networkDrops}`);
    console.log(`\nPage Load Latency: ${printLatencies('PageLoad', metrics.pageLoadLatencies)}`);
    console.log(`API Latency: ${printLatencies('API', metrics.apiLatencies)}`);
    console.log(`Overall Error Rate: ${((metrics.errors / CONCURRENCY) * 100).toFixed(2)}%`);

    // Write report
    const reportData = {
        concurrency: CONCURRENCY,
        durationSeconds: duration,
        success: metrics.success,
        errors: metrics.errors,
        errorRate: (metrics.errors / CONCURRENCY) * 100,
        pageLoad: printLatencies('PageLoad', metrics.pageLoadLatencies),
        apiLatency: printLatencies('API', metrics.apiLatencies),
        networkDrops: metrics.networkDrops,
        chaosMode: CHAOS_MODE
    };

    fs.writeFileSync('browser-load-report.json', JSON.stringify(reportData, null, 2));
    console.log(`\nReport saved to browser-load-report.json`);
}

main().catch(console.error);
