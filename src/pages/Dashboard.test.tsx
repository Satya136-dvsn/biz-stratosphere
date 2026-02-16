// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.


import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '../pages/Dashboard';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Setting up providers
const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: false }
    }
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        <BrowserRouter>
            {children}
        </BrowserRouter>
    </QueryClientProvider>
);

// Mocks
vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: 'test_user', email: 'test@example.com' },
        signOut: vi.fn(),
    })
}));

vi.mock('@/hooks/useKPIData', () => ({
    useKPIData: () => ({
        kpiData: {
            totalRevenue: 50000,
            revenueChange: 10,
            activeCustomers: 100,
            customersChange: 5,
            churnRate: 2,
            churnChange: -1,
            averageDealSize: 500,
            dealSizeChange: 0,
            conversionRate: 5,
            conversionChange: 0,
            growthRate: 15,
            growthChange: 2
        },
        isLoading: false
    })
}));

vi.mock('@/hooks/useRealtimeKPIs', () => ({
    useRealtimeKPIs: () => ({
        realtimeData: null
    })
}));

vi.mock('@/hooks/useChartData', () => ({
    useChartData: () => ({
        chartData: [],
        isLoading: false
    })
}));

describe('Dashboard Integration', () => {
    it('should render the dashboard title and KPIs', () => {
        render(<Dashboard />, { wrapper: Wrapper });

        // Check for Main Title
        expect(screen.getByText(/Business Intelligence Dashboard/i)).toBeInTheDocument();

        // Check for mocked KPI value (Total Revenue)
        // KPICard formats currency, so 50000 -> $50,000 or similar
        // We can just check for the component title "Total Revenue"
        expect(screen.getByText(/Total Revenue/i)).toBeInTheDocument();

        // Check for active customers label
        expect(screen.getByText(/Active Customers/i)).toBeInTheDocument();
    });
});
