// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'

// Create a new QueryClient for each test to ensure isolation
const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            gcTime: 0, // Previously cacheTime in older versions
        },
        mutations: {
            retry: false,
        },
    },
    logger: {
        log: console.log,
        warn: console.warn,
        error: () => { }, // Suppress error logs in tests
    },
})

interface AllTheProvidersProps {
    children: React.ReactNode
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
    const queryClient = createTestQueryClient()

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                {children}
                <Toaster />
            </BrowserRouter>
        </QueryClientProvider>
    )
}

const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything from React Testing Library
export * from '@testing-library/react'

// Override render method
export { customRender as render }

// Export wrapper for hooks
export { AllTheProviders as createWrapper }
export { AllTheProviders as wrapper }

// Helper to wait for async updates
export const waitForLoadingToFinish = () => {
    return new Promise(resolve => setTimeout(resolve, 0))
}
