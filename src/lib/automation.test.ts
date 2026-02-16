// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.


import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runAutomationRule } from './automation';

// Mock Supabase client
const mockInvoke = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        functions: {
            invoke: (...args: any[]) => mockInvoke(...args)
        }
    }
}));

describe('Automation Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should invoke the edge function with correct payload', async () => {
        // Mock successful response
        mockInvoke.mockResolvedValueOnce({
            data: { success: true, actionTriggered: true },
            error: null
        });

        const rule = {
            id: 'rule_123',
            name: 'Test Rule',
            condition_type: 'threshold',
            condition_value: { metric: 'revenue', operator: 'gt', value: 1000 },
            action_type: 'notification',
            action_config: { recipient: 'test@example.com' },
            is_active: true,
            user_id: 'user_1',
            created_at: new Date().toISOString()
        };

        await runAutomationRule(rule.id);

        expect(mockInvoke).toHaveBeenCalledTimes(1);
        expect(mockInvoke).toHaveBeenCalledWith('automation-evaluator', {
            body: { ruleId: rule.id }
        });
    });

    it('should handle edge function errors gracefully', async () => {
        // Mock error response
        mockInvoke.mockResolvedValueOnce({
            data: null,
            error: { message: 'Function failed' }
        });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const ruleId = 'rule_error';

        try {
            await runAutomationRule(ruleId);
        } catch (e) {
            // Expected
        }

        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});
