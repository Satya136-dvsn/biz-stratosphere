
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminRoute } from '@/components/AdminRoute';
import { AdminDashboard } from '../AdminDashboard';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => mockUseAuth()
}));

// Mock useAdminStats
const mockUseAdminStats = vi.fn();
vi.mock('@/hooks/useAdminStats', () => ({
    useAdminStats: () => mockUseAdminStats()
}));

// Mock Recharts to avoid compilation/rendering issues in test env
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    AreaChart: () => <div>AreaChart</div>,
    Area: () => <div>Area</div>,
    XAxis: () => <div>XAxis</div>,
    YAxis: () => <div>YAxis</div>,
    CartesianGrid: () => <div>Grid</div>,
    Tooltip: () => <div>Tooltip</div>,
}));

// Mock Lucide React
vi.mock('lucide-react', () => ({
    ShieldCheck: () => <div data-testid="icon-shield" />,
    Users: () => <div data-testid="icon-users" />,
    Activity: () => <div data-testid="icon-activity" />,
    Database: () => <div data-testid="icon-database" />,
    AlertCircle: () => <div data-testid="icon-alert" />,
    Braille: () => <div data-testid="icon-braille" />,
}));


describe('Admin Security', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default stats mock
        mockUseAdminStats.mockReturnValue({
            stats: {
                total_users: 100,
                total_workspaces: 10,
                active_users_1h: 5,
                api_requests_24h: 500,
                predictions_24h: 200,
                recent_errors_24h: 0
            },
            signups: [],
            loading: false,
            error: null
        });
    });

    it('should allow access for role="admin" and show stats', () => {
        mockUseAuth.mockReturnValue({
            user: { id: 'admin1' },
            loading: false,
            isAdmin: () => true
        });

        render(
            <MemoryRouter>
                <AdminRoute>
                    <AdminDashboard />
                </AdminRoute>
            </MemoryRouter>
        );

        expect(screen.getByText('Admin Control Plane')).toBeInTheDocument();
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should block access for role="user"', () => {
        mockUseAuth.mockReturnValue({
            user: { id: 'user1' },
            loading: false,
            isAdmin: () => false
        });

        // We can't easily test navigation with MemoryRouter without a complex setup, 
        // but checking that children are NOT rendered is a good proxy.
        const { queryByText } = render(
            <MemoryRouter>
                <AdminRoute>
                    <AdminDashboard />
                </AdminRoute>
            </MemoryRouter>
        );

        expect(queryByText('Admin Control Plane')).not.toBeInTheDocument();
    });
});
