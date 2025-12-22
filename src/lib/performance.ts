import { logger } from './logger';

/**
 * Wraps an async function to track its execution time.
 * Logs the duration to the structured logger.
 */
export async function trackLatency<T>(
    operationName: string,
    operation: () => Promise<T>,
    meta?: Record<string, any>
): Promise<T> {
    const start = performance.now();
    try {
        const result = await operation();
        const duration = performance.now() - start;

        logger.info(`Performance: ${operationName}`, {
            duration_ms: duration,
            success: true,
            ...meta
        });

        return result;
    } catch (error) {
        const duration = performance.now() - start;
        logger.error(`Performance: ${operationName} Failed`, error, {
            duration_ms: duration,
            success: false,
            ...meta
        });
        throw error;
    }
}

/**
 * Higher-order function version for hooking into callbacks
 */
export function measure<T extends (...args: any[]) => Promise<any>>(
    operationName: string,
    fn: T
): T {
    return (async (...args: any[]) => {
        return trackLatency(operationName, () => fn(...args));
    }) as T;
}
