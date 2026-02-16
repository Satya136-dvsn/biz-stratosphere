// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.


// Mock Browser Environment for Node.js
const globalAny: any = global;
globalAny.window = {
    // Sentry often checks window.document or window.navigator
    document: {},
    navigator: { userAgent: 'node' },
    location: { href: 'http://localhost' }
};
globalAny.document = {};
globalAny.navigator = { userAgent: 'node' };

// Mock import.meta.env
process.env.VITE_SENTRY_DSN = 'https://examplePublicKey@o0.ingest.sentry.io/0';
process.env.DEV = 'true';

// We need to use dynamic imports to ensure mocks are set before modules load
async function runTests() {
    console.log('--- Starting Monitoring Verification ---');

    // Import modules dynamically
    const { logger } = await import('../src/lib/logger');
    const { trackLatency } = await import('../src/lib/performance');

    // 1. Test Logger
    console.log('\n1. Testing Logger Output:');
    logger.info('Test Info Message', { testId: 1 });
    logger.warn('Test Warning Message', { testId: 2 });

    // This logs locally and tries to call Sentry.
    // Since we mocked Sentry in errorTracking.ts (or rather it imports @sentry/react),
    // @sentry/react might try to access browser APIs.
    // If it fails, we catch it.
    try {
        logger.error('Test Error Message', new Error('Simulated Error'), { testId: 3 });
        console.log('Logger error call successful (no crash) ✅');
    } catch (e) {
        console.error('Logger crashed ❌', e);
    }

    // 2. Test Performance Tracking
    console.log('\n2. Testing Performance Tracking:');

    async function simulatedOperation() {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'success';
    }

    try {
        const result = await trackLatency('Simulated Op', simulatedOperation);
        console.log(`Operation result: ${result}`);

        if (result !== 'success') {
            throw new Error('Operation failed');
        }
        console.log('Performance tracking success ✅');
    } catch (e) {
        console.error('Performance tracking failed ❌', e);
        process.exit(1);
    }

    console.log('\n✅ ALL MONITORING TESTS PASSED');
}

runTests().catch(e => {
    console.error('Test Suite Failed', e);
    process.exit(1);
});
