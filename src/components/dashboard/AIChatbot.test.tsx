import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AIChatbot } from './AIChatbot';

// Mock the hook used by AIChatbot
vi.mock('@/hooks/useAIConversation', () => ({
  useAIConversation: () => ({
    messages: [],
    isTyping: false,
    sendMessage: vi.fn(),
    isSending: false,
    tokenUsage: { total: 0 },
    estimatedCost: 0,
  }),
}));

describe('AIChatbot', () => {
  it('renders send button with proper aria-label', () => {
    render(<AIChatbot />);
    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeInTheDocument();
  });
});
