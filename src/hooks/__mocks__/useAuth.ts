// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { vi } from 'vitest';

export const useAuth = () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    session: { access_token: 'test-token' },
    loading: false,
    isAdmin: false,
});

export const AuthProvider = ({ children }: any) => children;
