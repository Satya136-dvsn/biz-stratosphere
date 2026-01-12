/**
 * Unit tests for KPICard component
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: 'test-user-id', email: 'test@example.com' },
    }),
}));

import { KPICard } from '@/components/dashboard/KPICard';

describe('KPICard', () => {
    it('should render correctly with props', () => {
        render(
            <KPICard
                title="Revenue"
                value={1000}
                change={10}
                trend="up"
                format="currency"
                icon={<span>📈</span>}
            />
        );

        expect(screen.getByText('Revenue')).toBeTruthy();
        expect(screen.getByText('$1,000')).toBeTruthy();
    });

    it('should display negative change correctly', () => {
        render(
            <KPICard
                title="Expenses"
                value={500}
                change={-5}
                trend="down"
                icon={<span>📉</span>}
            />
        );

        expect(screen.getByText('Expenses')).toBeTruthy();
    });
});
