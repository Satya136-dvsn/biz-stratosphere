/**
 * Error tracking and monitoring utilities
 * Can be integrated with Sentry, LogRocket, or similar services
 */

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
        console.warn('Error tracking DSN not configured');
        return;
    }

    // TODO: Initialize Sentry or your preferred error tracking service
    // Example for Sentry:
    // Sentry.init({
    //   dsn: SENTRY_DSN,
    //   integrations: [new BrowserTracing()],
    //   tracesSampleRate: 1.0,
    // });
};

// Capture exception
export const captureException = (error: Error, context?: ErrorContext) => {
    // Log to console in development
    if (import.meta.env.DEV) {
        console.error('Error captured:', error, context);
    }

    // TODO: Send to error tracking service
    // Example for Sentry:
    // Sentry.captureException(error, {
    //   user: context?.user,
    //   extra: context?.extra,
    //   tags: context?.tags,
    //   level: context?.level,
    // });

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

    // TODO: Send to error tracking service
    // Example for Sentry:
    // Sentry.captureMessage(message, context?.level || 'info');
};

// Set user context
export const setUserContext = (user: { id: string; email?: string; username?: string }) => {
    // TODO: Set user context in error tracking service
    // Example for Sentry:
    // Sentry.setUser(user);
};

// Add breadcrumb (for debugging trail)
export const addBreadcrumb = (message: string, category?: string, data?: Record<string, any>) => {
    if (import.meta.env.DEV) {
        console.log('Breadcrumb:', { message, category, data });
    }

    // TODO: Add breadcrumb to error tracking service
    // Example for Sentry:
    // Sentry.addBreadcrumb({
    //   message,
    //   category,
    //   data,
    //   timestamp: Date.now(),
    // });
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
