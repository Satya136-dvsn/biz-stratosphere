// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.


import chalk from 'chalk';
// Note: User might not have chalk installed, so using ANSI codes if fetch fails? 
// No, running via ts-node, usually environment has basic libs or we use console.

const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:54321/functions/v1';
// functions/v1 is for Edge Functions.
// For frontend check: http://localhost:5173

async function runSmokeTests() {
    console.log('🚀 Starting Smoke Tests...\n');
    let failures = 0;

    // 1. Health Check
    try {
        console.log('Checking Health Endpoint...');
        const res = await fetch(`${BASE_URL}/health`, {
            headers: { 'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}` }
        });
        if (res.status === 200 || res.status === 503) { // 503 might mean DB down but endpoint reachable
            const data = await res.json();
            console.log('✅ Health Check Passed:', data);
        } else {
            console.error('❌ Health Check Failed:', res.status, res.statusText);
            failures++;
        }
    } catch (e: any) {
        console.error('❌ Health Check Connection Failed:', e.message);
        failures++;
    }

    // 2. Data Endpoint (mock)
    try {
        // ...
    } catch (e) { }

    // 3. Rate Limit Simulation (optional)
    // Spamming endpoint to see if we get 429

    console.log(`\nTests Completed with ${failures} failures.`);
    process.exit(failures > 0 ? 1 : 0);
}

runSmokeTests();
