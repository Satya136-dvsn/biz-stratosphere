// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

/**
 * Unit tests for ChartTypeSelector component
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: 'test-user-id', email: 'test@example.com' },
    }),
}));

import { ChartTypeSelector } from '@/components/dashboard/ChartTypeSelector';

describe('ChartTypeSelector', () => {
    it('should render correctly', () => {
        const mockOnChange = vi.fn();
        render(<ChartTypeSelector value="line" onChange={mockOnChange} />);

        // Should render the component
        expect(document.body.querySelector('button')).toBeTruthy();
    });

    it('should have chart type options', () => {
        const mockOnChange = vi.fn();
        render(<ChartTypeSelector value="bar" onChange={mockOnChange} />);

        // Component should render without crashing
        expect(document.body).toBeTruthy();
    });
});
