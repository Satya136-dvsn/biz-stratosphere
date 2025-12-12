/**
 * Analytics tracking utilities
 * Supports Google Analytics 4 and custom event tracking
 */

// Types for event tracking
export interface AnalyticsEvent {
    category: string;
    action: string;
    label?: string;
    value?: number;
}

export interface PageViewEvent {
    page_title: string;
    page_location: string;
    page_path: string;
}

// Initialize Google Analytics
export const initializeAnalytics = (measurementId?: string) => {
    if (typeof window === 'undefined') return;

    const GA_MEASUREMENT_ID = measurementId || import.meta.env.VITE_GA_MEASUREMENT_ID;

    if (!GA_MEASUREMENT_ID) {
        console.warn('Google Analytics measurement ID not found');
        return;
    }

    // Load gtag script
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
        window.dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
        send_page_view: false, // We'll handle page views manually
    });

    // Make gtag available globally
    (window as any).gtag = gtag;
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
    if (typeof window === 'undefined' || !(window as any).gtag) return;

    (window as any).gtag('event', 'page_view', {
        page_title: title || document.title,
        page_location: window.location.href,
        page_path: path,
    });
};

// Track custom events
export const trackEvent = (event: AnalyticsEvent) => {
    if (typeof window === 'undefined' || !(window as any).gtag) return;

    (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
    });
};

// Predefined event trackers for common actions
export const analytics = {
    // Feature usage tracking
    trackFeatureUsage: (featureName: string, action: string) => {
        trackEvent({
            category: 'Feature',
            action: `${featureName}_${action}`,
            label: featureName,
        });
    },

    // AI/ML feature tracking
    trackAIChat: (action: 'message_sent' | 'conversation_created' | 'embeddings_generated') => {
        trackEvent({
            category: 'AI_Chat',
            action,
        });
    },

    trackMLPrediction: (modelType: string, action: 'prediction' | 'shap_explanation') => {
        trackEvent({
            category: 'ML_Predictions',
            action,
            label: modelType,
        });
    },

    // Chart tracking
    trackChartCreation: (chartType: string) => {
        trackEvent({
            category: 'Charts',
            action: 'chart_created',
            label: chartType,
        });
    },

    trackChartExport: (chartType: string, format: string) => {
        trackEvent({
            category: 'Charts',
            action: 'chart_exported',
            label: `${chartType}_${format}`,
        });
    },

    // Report tracking
    trackReportGeneration: (reportType: string) => {
        trackEvent({
            category: 'Reports',
            action: 'report_generated',
            label: reportType,
        });
    },

    trackReportExport: (format: string) => {
        trackEvent({
            category: 'Reports',
            action: 'report_exported',
            label: format,
        });
    },

    // Data upload tracking
    trackDataUpload: (fileType: string, rowCount?: number) => {
        trackEvent({
            category: 'Data',
            action: 'data_uploaded',
            label: fileType,
            value: rowCount,
        });
    },

    // API usage tracking
    trackAPICall: (endpoint: string, success: boolean) => {
        trackEvent({
            category: 'API',
            action: success ? 'api_call_success' : 'api_call_failure',
            label: endpoint,
        });
    },

    // User engagement
    trackUserAction: (action: string, category: string = 'User') => {
        trackEvent({
            category,
            action,
        });
    },

    // Performance tracking
    trackPerformance: (metric: string, value: number) => {
        trackEvent({
            category: 'Performance',
            action: metric,
            value: Math.round(value),
        });
    },

    // Error tracking
    trackError: (errorType: string, errorMessage: string) => {
        trackEvent({
            category: 'Error',
            action: errorType,
            label: errorMessage.substring(0, 100), // Limit length
        });
    },
};

// Performance monitoring
export const trackWebVitals = () => {
    if (typeof window === 'undefined') return;

    // Track Core Web Vitals when available
    if ('PerformanceObserver' in window) {
        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            analytics.trackPerformance('LCP', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
                analytics.trackPerformance('FID', entry.processingStart - entry.startTime);
            });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Track CLS on page unload
        window.addEventListener('beforeunload', () => {
            analytics.trackPerformance('CLS', clsValue * 1000); // Convert to integer
        });
    }
};

// User identification
export const identifyUser = (userId: string, traits?: Record<string, any>) => {
    if (typeof window === 'undefined' || !(window as any).gtag) return;

    (window as any).gtag('set', 'user_properties', {
        user_id: userId,
        ...traits,
    });
};

// Type declarations for window
declare global {
    interface Window {
        dataLayer: any[];
        gtag: (...args: any[]) => void;
    }
}

export default analytics;
