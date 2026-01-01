
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuditLogs } from '../AuditLogs';

// Mock Layout
vi.mock("@/components/layout/PageLayout", () => ({
    PageLayout: ({ children }: any) => <div data-testid="layout">{children}</div>
}));

// Mock Hook
const mockUseAdminAudit = vi.fn();
vi.mock('@/hooks/useAdminAudit', () => ({
    useAdminAudit: (page: number) => mockUseAdminAudit(page)
}));

// Mock Lucide Icons
vi.mock('lucide-react', () => ({
    Search: () => <div>Search</div>,
    Loader2: () => <div>Loading</div>,
    FileText: () => <div>File</div>
}));

// Mock UI
vi.mock('@/components/ui/scroll-area', () => ({
    ScrollArea: ({ children }: any) => <div>{children}</div>
}));

describe('Audit Logs', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAdminAudit.mockReturnValue({
            logs: [
                {
                    id: '1',
                    created_at: '2023-01-01T12:00:00Z',
                    action: 'login',
                    actor_email: 'user@test.com',
                    actor_id: 'u1',
                    resource_type: 'auth',
                    resource_id: 'session',
                    metadata: { ip: '127.0.0.1' }
                },
                {
                    id: '2',
                    created_at: '2023-01-01T13:00:00Z',
                    action: 'update_role',
                    actor_email: 'admin@test.com',
                    actor_id: 'a1',
                    resource_type: 'user',
                    resource_id: 'u2',
                    metadata: { new_role: 'admin' }
                }
            ],
            isLoading: false
        });
    });

    it('renders logs list', () => {
        render(<AuditLogs />);
        expect(screen.getByText('Security Audit Logs')).toBeInTheDocument();
        expect(screen.getByText('login')).toBeInTheDocument();
        expect(screen.getByText('update_role')).toBeInTheDocument();
        expect(screen.getByText('user@test.com')).toBeInTheDocument();
    });

    it('displays metadata', () => {
        render(<AuditLogs />);
        // metadata is JSON stringified
        expect(screen.getByText(/127.0.0.1/)).toBeInTheDocument();
        expect(screen.getByText(/new_role/)).toBeInTheDocument();
    });

    it('handles pagination', () => {
        render(<AuditLogs />);
        const nextBtn = screen.getByText('Next');
        // logs < 50, so disabled
        expect(nextBtn).toBeDisabled();
    });
});
