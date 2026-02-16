import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DemoStep {
    /** CSS selector for the target element */
    target: string;
    /** Title shown in the tooltip */
    title: string;
    /** Description shown in the tooltip */
    description: string;
    /** Position of tooltip relative to element */
    position?: 'top' | 'bottom' | 'left' | 'right';
}

const DEMO_STEPS: DemoStep[] = [
    {
        target: '[data-testid="kpi-card"]',
        title: '📊 Live KPI Cards',
        description: 'Real-time metrics update automatically. Each card shows trend direction and percentage change.',
        position: 'bottom',
    },
    {
        target: '.recharts-wrapper',
        title: '📈 Interactive Charts',
        description: 'Revenue trends, customer analytics, and more. Switch between line, bar, and area views.',
        position: 'top',
    },
    {
        target: '[data-testid="ai-chatbot"]',
        title: '🤖 AI Chat Assistant',
        description: 'Ask questions about your data in plain English. The AI analyzes your metrics and gives actionable insights.',
        position: 'left',
    },
    {
        target: '[data-testid="ml-insights"]',
        title: '🧠 ML Analytics & Explainability',
        description: 'Run churn predictions, sales forecasts, and anomaly detection. The "Explain" tab shows SHAP waterfall charts.',
        position: 'left',
    },
];

interface GuidedDemoModeProps {
    isActive: boolean;
    onClose: () => void;
}

export function GuidedDemoMode({ isActive, onClose }: GuidedDemoModeProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

    const positionTooltip = useCallback(() => {
        const step = DEMO_STEPS[currentStep];
        const element = document.querySelector(step.target);

        if (!element) {
            // Element not found — center tooltip
            setTooltipStyle({
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
            });
            return;
        }

        const rect = element.getBoundingClientRect();
        const pos = step.position || 'bottom';

        let style: React.CSSProperties = { position: 'fixed' };

        switch (pos) {
            case 'bottom':
                style.top = rect.bottom + 12;
                style.left = rect.left + rect.width / 2;
                style.transform = 'translateX(-50%)';
                break;
            case 'top':
                style.top = rect.top - 12;
                style.left = rect.left + rect.width / 2;
                style.transform = 'translate(-50%, -100%)';
                break;
            case 'left':
                style.top = rect.top + rect.height / 2;
                style.left = rect.left - 12;
                style.transform = 'translate(-100%, -50%)';
                break;
            case 'right':
                style.top = rect.top + rect.height / 2;
                style.left = rect.right + 12;
                style.transform = 'translateY(-50%)';
                break;
        }

        // Clamp to viewport
        setTooltipStyle(style);

        // Scroll target into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [currentStep]);

    useEffect(() => {
        if (!isActive) return;
        positionTooltip();

        const handler = () => positionTooltip();
        window.addEventListener('resize', handler);
        window.addEventListener('scroll', handler);
        return () => {
            window.removeEventListener('resize', handler);
            window.removeEventListener('scroll', handler);
        };
    }, [isActive, positionTooltip]);

    if (!isActive) return null;

    const step = DEMO_STEPS[currentStep];
    const isFirst = currentStep === 0;
    const isLast = currentStep === DEMO_STEPS.length - 1;

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Tooltip Card */}
            <div
                className="fixed z-[999] w-80 glass-strong rounded-xl p-5 shadow-2xl border border-primary/30 animate-scale-in"
                style={tooltipStyle}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                        <Badge variant="outline" className="text-[10px] border-primary/40 text-primary mb-1">
                            Step {currentStep + 1} of {DEMO_STEPS.length}
                        </Badge>
                        <h3 className="text-base font-bold">{step.title}</h3>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Body */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {step.description}
                </p>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-1.5 mb-3">
                    {DEMO_STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                'w-2 h-2 rounded-full transition-all',
                                i === currentStep ? 'bg-primary w-5' : 'bg-muted-foreground/30'
                            )}
                        />
                    ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                        disabled={isFirst}
                        className="flex-1"
                    >
                        <ArrowLeft className="h-3 w-3 mr-1" />
                        Back
                    </Button>
                    {isLast ? (
                        <Button
                            size="sm"
                            onClick={onClose}
                            className="flex-1"
                        >
                            <Sparkles className="h-3 w-3 mr-1" />
                            Finish Tour
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            onClick={() => setCurrentStep((s) => Math.min(DEMO_STEPS.length - 1, s + 1))}
                            className="flex-1"
                        >
                            Next
                            <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                    )}
                </div>
            </div>
        </>
    );
}

/* ─── Trigger Button (for Dashboard header) ────────── */
export function DemoModeTrigger({ onClick }: { onClick: () => void }) {
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onClick}
            className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
        >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Guided Tour</span>
        </Button>
    );
}
