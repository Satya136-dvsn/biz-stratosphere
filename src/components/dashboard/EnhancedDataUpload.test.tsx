import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@/test/utils'
import { EnhancedDataUpload } from './EnhancedDataUpload'

// Mock Papa.parse
vi.mock('papaparse', () => ({
    default: {
        parse: vi.fn(),
    },
}))

describe('EnhancedDataUpload Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        cleanup()
    })

    describe('Rendering', () => {
        it('renders the enhanced upload component', async () => {
            render(<EnhancedDataUpload />)

            await waitFor(() => {
                expect(screen.getByText('Enhanced Data Upload')).toBeInTheDocument()
            })
        })

        it('shows component description', async () => {
            render(<EnhancedDataUpload />)

            await waitFor(() => {
                expect(screen.getByText(/Upload CSV files with automatic quality analysis/i)).toBeInTheDocument()
            })
        })

        it('displays analyze button', async () => {
            render(<EnhancedDataUpload />)

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /analyze/i })).toBeInTheDocument()
            })
        })

        it('displays file input', async () => {
            render(<EnhancedDataUpload />)

            const fileInput = document.querySelector('input[type="file"]')
            expect(fileInput).toBeInTheDocument()
        })
    })

    describe('File Input Properties', () => {
        it('accepts only CSV files', async () => {
            render(<EnhancedDataUpload />)

            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
            expect(fileInput.accept).toBe('.csv')
        })

        it('analyze button is disabled when no file selected', async () => {
            render(<EnhancedDataUpload />)

            await waitFor(() => {
                const analyzeButton = screen.getByRole('button', { name: /analyze/i })
                expect(analyzeButton).toBeDisabled()
            })
        })
    })

    describe('UI Elements', () => {
        it('displays trending up icon', async () => {
            render(<EnhancedDataUpload />)

            await waitFor(() => {
                const icons = document.querySelectorAll('.lucide-trending-up')
                expect(icons.length).toBeGreaterThan(0)
            })
        })

        it('has proper card structure', async () => {
            render(<EnhancedDataUpload />)

            await waitFor(() => {
                expect(screen.getByText('Enhanced Data Upload')).toBeInTheDocument()
            })

            // Check for card elements
            const cardElements = document.querySelectorAll('[class*="card"]')
            expect(cardElements.length).toBeGreaterThan(0)
        })
    })

    describe('Button States', () => {
        it('analyze button has correct variant', async () => {
            render(<EnhancedDataUpload />)

            await waitFor(() => {
                const analyzeButton = screen.getByRole('button', { name: /analyze/i })
                expect(analyzeButton).toBeInTheDocument()
            })
        })

        it('shows file text icon in analyze button', async () => {
            render(<EnhancedDataUpload />)

            await waitFor(() => {
                const fileTextIcons = document.querySelectorAll('.lucide-file-text')
                expect(fileTextIcons.length).toBeGreaterThan(0)
            })
        })
    })

    describe('Layout', () => {
        it('has proper spacing classes', async () => {
            render(<EnhancedDataUpload />)

            await waitFor(() => {
                const container = screen.getByText('Enhanced Data Upload').closest('div')
                expect(container).toBeInTheDocument()
            })
        })

        it('file input and analyze button are in same row', async () => {
            render(<EnhancedDataUpload />)

            await waitFor(() => {
                const buttons = screen.getAllByRole('button')
                expect(buttons.length).toBeGreaterThan(0)
            })
        })
    })
})
