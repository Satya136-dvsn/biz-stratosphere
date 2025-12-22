import { captureException, captureMessage } from './errorTracking';

/**
 * Structured Logger for Biz Stratosphere
 * Provides consistent log formatting for frontend and backend logic.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    context?: Record<string, any>;
    userId?: string;
    environment: string;
}

const isDev = import.meta.env?.DEV || false;

class Logger {
    private log(level: LogLevel, message: string, context?: Record<string, any>, userId?: string) {
        const entry: LogEntry = {
            level,
            message,
            timestamp: new Date().toISOString(),
            context,
            userId,
            environment: isDev ? 'development' : 'production',
        };

        // In production, this would send to Sentry / Datadog / Supabase Logs
        // For now, we print structured JSON to console for observability

        if (isDev) {
            // Pretty print in Dev
            const style = this.getStyle(level);
            console.log(`%c[${level.toUpperCase()}] ${message}`, style, context || '');
        } else {
            // JSON Lines in Prod
            console.log(JSON.stringify(entry));
        }

        // Send to Sentry if not debug
        if (level === 'error') {
            const error = context?.error instanceof Error ? context.error : new Error(message);
            captureException(error, {
                level: 'error',
                extra: { ...context, userId },
                user: userId ? { id: userId } : undefined
            });
        } else if (level === 'warn') {
            captureMessage(message, {
                level: 'warning',
                extra: { ...context, userId },
                user: userId ? { id: userId } : undefined
            });
        }
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

    public info(message: string, context?: Record<string, any>, userId?: string) {
        this.log('info', message, context, userId);
    }

    public warn(message: string, context?: Record<string, any>, userId?: string) {
        this.log('warn', message, context, userId);
    }

    public error(message: string, error?: any, context?: Record<string, any>, userId?: string) {
        this.log('error', message, { ...context, error: error?.message || error, stack: error?.stack }, userId);
    }

    public debug(message: string, context?: Record<string, any>, userId?: string) {
        this.log('debug', message, context, userId);
    }
}

export const logger = new Logger();
