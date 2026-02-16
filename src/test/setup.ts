// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.


import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { Crypto } from '@peculiar/webcrypto';

// Polyfill Web Crypto API for Node.js/jsdom environment
if (!globalThis.crypto?.subtle) {
    globalThis.crypto = new Crypto() as any;
}

// Mock ResizeObserver for Recharts
class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}
global.ResizeObserver = ResizeObserver;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock scrollTo
window.scrollTo = vi.fn() as any;

// Mock IntersectionObserver
class IntersectionObserver {
    constructor() { }
    observe() { }
    unobserve() { }
    disconnect() { }
}
global.IntersectionObserver = IntersectionObserver as any;

// Mock navigator.sendBeacon
global.navigator.sendBeacon = vi.fn() as any;

// Note: Supabase mocks are in __mocks__ directory
// Note: useAuth mocks are in __mocks__ directory
