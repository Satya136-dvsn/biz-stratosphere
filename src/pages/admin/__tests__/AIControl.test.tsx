// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.


import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AIControl } from '../AIControl';

// Mock Layout
vi.mock("@/components/layout/PageLayout", () => ({
    PageLayout: ({ children }: any) => <div data-testid="layout">{children}</div>
}));

// Mock Hook
const mockUseAdminAI = vi.fn();
vi.mock('@/hooks/useAdminAI', () => ({
    useAdminAI: () => mockUseAdminAI()
}));

// Mock Lucide Icons
vi.mock('lucide-react', () => ({
    Brain: () => <div>Brain</div>,
    Activity: () => <div>Activity</div>,
    BarChart: () => <div>BarChart</div>,
    Calendar: () => <div>Calendar</div>,
    Loader2: () => <div>Loading</div>
}));

// Mock Components
vi.mock('@/components/ui/switch', () => ({
    Switch: ({ checked, onCheckedChange }: any) => (
        <button role="switch" aria-checked={checked} onClick={() => onCheckedChange(!checked)}>
            Switch
        </button>
    )
}));

describe('AI Control', () => {
    const mockToggleModel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAdminAI.mockReturnValue({
            models: [
                {
                    id: '1',
                    name: 'Churn Predictor',
                    version: '1.0',
                    type: 'classification',
                    is_active: true,
                    accuracy: 0.85,
                    total_predictions: 1000,
                    avg_confidence: 0.9,
                    last_used_at: '2023-01-01'
                },
                {
                    id: '2',
                    name: 'Revenue Forecast',
                    version: '2.0',
                    type: 'regression',
                    is_active: false,
                    accuracy: 0.75,
                    total_predictions: 500,
                    avg_confidence: 0.8,
                    last_used_at: null
                }
            ],
            isLoading: false,
            toggleModel: mockToggleModel
        });
    });

    it('renders models list', () => {
        render(<AIControl />);
        expect(screen.getByText('Churn Predictor')).toBeInTheDocument();
        expect(screen.getByText('Revenue Forecast')).toBeInTheDocument();
        expect(screen.getByText('85.0%')).toBeInTheDocument();
    });

    it('displays correct status badges', () => {
        render(<AIControl />);
        expect(screen.getAllByText('Active')[0]).toBeInTheDocument();
        expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('triggers toggle model', () => {
        render(<AIControl />);
        const switches = screen.getAllByRole('switch');
        // Click first switch (Active -> Inactive)
        fireEvent.click(switches[0]);

        expect(mockToggleModel).toHaveBeenCalledWith({ id: '1', active: false });
    });
});
