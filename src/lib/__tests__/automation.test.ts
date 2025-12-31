
import { describe, it, expect, vi } from 'vitest';
import { evaluateCondition } from '../automation';

// Mock Supabase
const mockSelect = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: () => ({
            select: () => ({
                eq: () => ({
                    order: () => ({
                        limit: () => ({
                            single: mockSelect
                        })
                    })
                })
            })
        })
    }
}));

describe('Automation Rules Logic', () => {
    it('should evaluate > correctly', async () => {
        mockSelect.mockResolvedValue({ data: { revenue: 50000 } });
        const result = await evaluateCondition({ metric: 'revenue', operator: '>', threshold: 10000 }, 'user1');
        expect(result.result).toBe(true);
    });

    it('should evaluate < correctly', async () => {
        mockSelect.mockResolvedValue({ data: { churn_rate: 0.05 } });
        const result = await evaluateCondition({ metric: 'churn_rate', operator: '<', threshold: 0.10 }, 'user1');
        expect(result.result).toBe(true);
    });

    it('should fail if threshold not met', async () => {
        mockSelect.mockResolvedValue({ data: { revenue: 5000 } });
        const result = await evaluateCondition({ metric: 'revenue', operator: '>', threshold: 10000 }, 'user1');
        expect(result.result).toBe(false);
    });

    it('should handle missing data gracefully', async () => {
        mockSelect.mockResolvedValue({ data: null });
        const result = await evaluateCondition({ metric: 'revenue', operator: '>', threshold: 10000 }, 'user1');
        expect(result.result).toBe(false);
    });
});
