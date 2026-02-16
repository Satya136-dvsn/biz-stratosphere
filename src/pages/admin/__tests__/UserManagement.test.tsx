// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.


import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserManagement } from '../UserManagement';
import { PageLayout } from "@/components/layout/PageLayout";

// Mock Layout
vi.mock("@/components/layout/PageLayout", () => ({
    PageLayout: ({ children }: any) => <div data-testid="layout">{children}</div>
}));

// Mock Hook
const mockUseAdminUsers = vi.fn();
vi.mock('@/hooks/useAdminUsers', () => ({
    useAdminUsers: (page: number, search: string) => mockUseAdminUsers(page, search)
}));

// Mock Lucide Icons
vi.mock('lucide-react', () => ({
    MoreHorizontal: () => <div>More</div>,
    Search: () => <div>Search</div>,
    ShieldAlert: () => <div>ShieldAlert</div>,
    ShieldCheck: () => <div>ShieldCheck</div>,
    Ban: () => <div>Ban</div>,
    CheckCircle: () => <div>CheckCircle</div>,
    Users: () => <div>Users</div>,
    Loader2: () => <div>Loading</div>
}));

// Mock UI components that might cause issues
vi.mock('@/components/ui/dropdown-menu', () => ({
    DropdownMenu: ({ children }: any) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }: any) => <div role="button">{children}</div>,
    DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
    DropdownMenuItem: ({ children, onClick }: any) => <div role="menuitem" onClick={onClick}>{children}</div>,
}));

describe('User Management', () => {
    const mockUpdateRole = vi.fn();
    const mockToggleSuspend = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAdminUsers.mockReturnValue({
            users: [
                { id: '1', email: 'user@test.com', full_name: 'Test User', role: 'user', suspended: false, created_at: '2023-01-01' },
                { id: '2', email: 'admin@test.com', full_name: 'Admin User', role: 'admin', suspended: true, created_at: '2023-01-01' }
            ],
            isLoading: false,
            updateRole: mockUpdateRole,
            toggleSuspend: mockToggleSuspend
        });
    });

    it('renders user list', () => {
        render(<UserManagement />);
        expect(screen.getByText('User Management')).toBeInTheDocument();
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    });

    it('displays correct status badges', () => {
        render(<UserManagement />);
        expect(screen.getByText('Active')).toBeInTheDocument(); // user 1
        expect(screen.getByText('Suspended')).toBeInTheDocument(); // user 2
    });

    it('triggers role update', () => {
        render(<UserManagement />);
        // Find triggers. 
        // In our mock, DropdownMenuTrigger renders a button. We have 2 users, so 2 triggers.
        // We just click one.
        const triggers = screen.getAllByRole('button');
        fireEvent.click(triggers[0]);

        // Find "Make Admin" menu item
        // Find "Make Admin" menu item
        const makeAdmin = screen.getAllByText(/Make Admin/)[0];
        fireEvent.click(makeAdmin);

        expect(mockUpdateRole).toHaveBeenCalledWith({ id: '1', role: 'admin' });
    });

    it('triggers suspend', () => {
        render(<UserManagement />);
        const triggers = screen.getAllByRole('button');
        fireEvent.click(triggers[0]); // User 1 (Active)

        const suspend = screen.getByText(/Suspend User/);
        fireEvent.click(suspend);

        expect(mockToggleSuspend).toHaveBeenCalledWith({ id: '1', suspend: true });
    });
});
