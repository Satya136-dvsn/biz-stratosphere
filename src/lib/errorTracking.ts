// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * Error tracking and monitoring utilities
 * Can be integrated with Sentry, LogRocket, or similar services
 */

import * as Sentry from '@sentry/react';

export interface ErrorContext {
    user?: {
        id: string;
        email?: string;
    };
    extra?: Record<string, any>;
    tags?: Record<string, string>;
    level?: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';
}

// Initialize error tracking (placeholder for Sentry or similar)
export const initializeErrorTracking = (dsn?: string) => {
    if (typeof window === 'undefined') return;

    const SENTRY_DSN = dsn || import.meta.env.VITE_SENTRY_DSN;

    if (!SENTRY_DSN) {
        // ✅ Downgraded to debug — this is expected in local dev
        if (import.meta.env.DEV) {
            console.debug('[Sentry] DSN not configured — disabled in dev mode.');
        }
        return;
    }

    try {
        Sentry.init({
            dsn: SENTRY_DSN,
            integrations: [
                Sentry.browserTracingIntegration(),
                Sentry.replayIntegration(),
            ],
            // ✅ Performance: 1% of traces in production (was 100% — very expensive)
            tracesSampleRate: import.meta.env.PROD ? 0.01 : 1.0,
            // ✅ Performance: No session replay by default; capture 100% on errors only
            replaysSessionSampleRate: 0,
            replaysOnErrorSampleRate: 1.0,
            // ✅ Security: strip PII from events before sending
            beforeSend(event) {
                // Remove any request body that might contain user data
                if (event.request) {
                    delete event.request.data;
                    delete event.request.cookies;
                }
                return event;
            },
        });
    } catch (e) {
        // Silent fail — error tracking should never break the app
    }
};

// Capture exception
export const captureException = (error: Error, context?: ErrorContext) => {
    // Log to console in development
    if (import.meta.env.DEV) {
        console.error('Error captured:', error, context);
    }

    if (context) {
        Sentry.withScope((scope) => {
            if (context.user) scope.setUser(context.user);
            if (context.tags) scope.setTags(context.tags);
            if (context.extra) scope.setExtras(context.extra);
            if (context.level) scope.setLevel(context.level);
            Sentry.captureException(error);
        });
    } else {
        Sentry.captureException(error);
    }

    // Fallback: Track with analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
            description: error.message,
            fatal: context?.level === 'fatal',
        });
    }
};

// Capture message
export const captureMessage = (message: string, context?: ErrorContext) => {
    if (import.meta.env.DEV) {
        console.log('Message captured:', message, context);
    }

    const level = context?.level || 'info';
    Sentry.captureMessage(message, level);
};

// Set user context
export const setUserContext = (user: { id: string; email?: string; username?: string }) => {
    Sentry.setUser(user);
};

// Add breadcrumb (for debugging trail)
export const addBreadcrumb = (message: string, category?: string, data?: Record<string, any>) => {
    if (import.meta.env.DEV) {
        console.log('Breadcrumb:', { message, category, data });
    }

    Sentry.addBreadcrumb({
        message,
        category,
        data,
        timestamp: Date.now(),
    });
};

// Error boundary helper
export const logErrorBoundary = (error: Error, errorInfo: React.ErrorInfo) => {
    captureException(error, {
        extra: {
            componentStack: errorInfo.componentStack,
        },
        level: 'error',
        tags: {
            source: 'error_boundary',
        },
    });
};

// API error helper
export const logAPIError = (endpoint: string, error: Error, statusCode?: number) => {
    captureException(error, {
        extra: {
            endpoint,
            statusCode,
        },
        level: 'error',
        tags: {
            source: 'api',
            endpoint,
        },
    });
};

// Performance issue helper
export const logPerformanceIssue = (metric: string, value: number, threshold: number) => {
    if (value > threshold) {
        captureMessage(`Performance issue: ${metric} = ${value}ms (threshold: ${threshold}ms)`, {
            level: 'warning',
            extra: {
                metric,
                value,
                threshold,
            },
            tags: {
                source: 'performance',
            },
        });
    }
};

export default {
    initializeErrorTracking,
    captureException,
    captureMessage,
    setUserContext,
    addBreadcrumb,
    logErrorBoundary,
    logAPIError,
    logPerformanceIssue,
};
