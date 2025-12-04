import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@/test/utils'
import { DataUpload } from './DataUpload'

// Create stable mocks at module level
const mockUploadData = vi.fn()
const mockUser = { id: 'test-user-123', email: 'test@example.com' }

vi.mock('@/hooks/useDataUpload', () => ({
    useDataUpload: () => ({
        uploadData: mockUploadData,
        isUploading: false,
    }),
}))

vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        user: mockUser,
    }),
}))

describe('DataUpload Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        cleanup()
    })

    describe('Rendering', () => {
        it('renders upload component', async () => {
            render(<DataUpload />)

            await waitFor(() => {
                expect(screen.getByText('Data Management')).toBeInTheDocument()
            })
        })

        it('shows upload instructions', async () => {
            render(<DataUpload />)

            await waitFor(() => {
                expect(screen.getByText('Upload Your Data Files')).toBeInTheDocument()
                expect(screen.getByText(/Drag and drop your CSV, Excel, or JSON files/i)).toBeInTheDocument()
            })
        })

        it('has choose files button', async () => {
            render(<DataUpload />)

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /choose files/i })).toBeInTheDocument()
            })
        })

        it('displays file upload icon', async () => {
            render(<DataUpload />)

            await waitFor(() => {
                const uploadIcons = document.querySelectorAll('.lucide-upload')
                expect(uploadIcons.length).toBeGreaterThan(0)
            })
        })
    })

    describe('File Input', () => {
        it('has file input with correct attributes', async () => {
            render(<DataUpload />)

            await waitFor(() => {
                const input = screen.getByLabelText(/upload data files/i) as HTMLInputElement
                expect(input.accept).toBe('.csv,.xlsx,.xls')
                expect(input.multiple).toBe(true)
                expect(input).toHaveClass('hidden')
            })
        })

        it('file input accepts CSV files', async () => {
            render(<DataUpload />)

            const input = screen.getByLabelText(/upload data files/i) as HTMLInputElement
            expect(input.accept).toContain('.csv')
        })

        it('file input accepts Excel files', async () => {
            render(<DataUpload />)

            const input = screen.getByLabelText(/upload data files/i) as HTMLInputElement
            expect(input.accept).toContain('.xlsx')
            expect(input.accept).toContain('.xls')
        })
    })

    describe('Loading State', () => {
        it('shows loading state initially', () => {
            render(<DataUpload />)

            const skeletons = document.querySelectorAll('.animate-pulse')
            expect(skeletons.length).toBeGreaterThan(0)
        })

        it('displays recent uploads heading', async () => {
            render(<DataUpload />)

            await waitFor(() => {
                expect(screen.getByText('Recent Uploads')).toBeInTheDocument()
            })
        })
    })

    describe('Upload Button', () => {
        it('choose files button is not disabled when not uploading', async () => {
            render(<DataUpload />)

            await waitFor(() => {
                const button = screen.getByRole('button', { name: /choose files/i })
                expect(button).not.toBeDisabled()
            })
        })

        it('displays Choose Files text when not uploading', async () => {
            render(<DataUpload />)

            await waitFor(() => {
                expect(screen.getByText('Choose Files')).toBeInTheDocument()
            })
        })
    })

    describe('Upload Area', () => {
        it('displays drag and drop area', async () => {
            render(<DataUpload />)

            await waitFor(() => {
                const dropZone = screen.getByText(/Drag and drop/i).closest('div')
                expect(dropZone).toBeInTheDocument()
            })
        })

        it('shows border styling on upload area', async () => {
            render(<DataUpload />)

            await waitFor(() => {
                const dropZone = screen.getByText(/Drag and drop/i).closest('div')
                expect(dropZone).toHaveClass('border-2')
                expect(dropZone).toHaveClass('border-dashed')
            })
        })
    })
})
