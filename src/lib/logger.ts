// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { captureException, captureMessage } from './errorTracking';

/**
 * Structured Logger for Biz Stratosphere
 * P7: Enhanced with context support (userId, workspaceId, requestId)
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
    userId?: string;
    workspaceId?: string;
    requestId?: string;
    component?: string;
    action?: string;
    [key: string]: any;
}

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    context?: LogContext;
    environment: string;
}

const isDev = import.meta.env?.DEV || false;

class Logger {
    private defaultContext: LogContext = {};

    /**
     * Set default context for all log entries
     */
    setContext(context: Partial<LogContext>) {
        this.defaultContext = { ...this.defaultContext, ...context };
    }

    /**
     * Create a child logger with additional context
     */
    child(context: Partial<LogContext>): Logger {
        const childLogger = new Logger();
        childLogger.defaultContext = { ...this.defaultContext, ...context };
        return childLogger;
    }

    private log(level: LogLevel, message: string, context?: LogContext) {
        const mergedContext = { ...this.defaultContext, ...context };
        const entry: LogEntry = {
            level,
            message,
            timestamp: new Date().toISOString(),
            context: Object.keys(mergedContext).length > 0 ? mergedContext : undefined,
            environment: isDev ? 'development' : 'production',
        };

        if (isDev) {
            const style = this.getStyle(level);
            const prefix = this.formatPrefix(level, mergedContext);
            console.log(`%c${prefix} ${message}`, style, mergedContext || '');
        } else {
            console.log(JSON.stringify(entry));
        }

        // Send to Sentry if error or warning
        if (level === 'error') {
            const error = mergedContext?.error instanceof Error ? mergedContext.error : new Error(message);
            captureException(error, {
                level: 'error',
                extra: mergedContext,
                user: mergedContext?.userId ? { id: mergedContext.userId } : undefined
            });
        } else if (level === 'warn') {
            captureMessage(message, {
                level: 'warning',
                extra: mergedContext,
                user: mergedContext?.userId ? { id: mergedContext.userId } : undefined
            });
        }
    }

    private formatPrefix(level: LogLevel, context?: LogContext): string {
        const parts = [`[${level.toUpperCase()}]`];
        if (context?.component) parts.push(`[${context.component}]`);
        if (context?.action) parts.push(`[${context.action}]`);
        return parts.join('');
    }

    private getStyle(level: LogLevel): string {
        switch (level) {
            case 'info': return 'color: #3b82f6';
            case 'warn': return 'color: #f59e0b';
            case 'error': return 'color: #ef4444; font-weight: bold';
            case 'debug': return 'color: #9ca3af';
            default: return 'color: inherit';
        }
    }

    public info(message: string, context?: LogContext) {
        this.log('info', message, context);
    }

    public warn(message: string, context?: LogContext) {
        this.log('warn', message, context);
    }

    public error(message: string, error?: any, context?: LogContext) {
        this.log('error', message, { ...context, error: error?.message || error, stack: error?.stack });
    }

    public debug(message: string, context?: LogContext) {
        this.log('debug', message, context);
    }
}

export const logger = new Logger();

/**
 * Create a logger with component context
 */
export function createLogger(component: string, context?: Partial<LogContext>): Logger {
    return logger.child({ component, ...context });
}

/**
 * Generate a unique request ID for tracing
 */
export function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export type { LogContext, LogLevel };

