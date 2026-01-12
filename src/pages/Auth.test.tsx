import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import Auth from './Auth'

// Mock window.location
delete (window as any).location
window.location = { href: '' } as any

describe('Auth Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        window.location.href = ''
    })

    describe('Rendering', () => {
        it('renders the auth page with signin form by default', () => {
            render(<Auth />)

            expect(screen.getByText('Biz Stratosphere')).toBeInTheDocument()
            expect(screen.getByText('AI-Powered Business Intelligence Platform')).toBeInTheDocument()
        })

        it('shows sign in form elements', () => {
            render(<Auth />)

            expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
            expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
        })

        it('shows signup tab', () => {
            render(<Auth />)

            expect(screen.getByRole('tab', { name: /sign in/i })).toBeInTheDocument()
            expect(screen.getByRole('tab', { name: /sign up/i })).toBeInTheDocument()
        })
    })

    describe('Form Validation', () => {
        it('has required fields for sign in', () => {
            render(<Auth />)

            const emailInput = screen.getByLabelText(/^email$/i)
            const passwordInput = screen.getByLabelText(/^password$/i)

            expect(emailInput).toBeRequired()
            expect(passwordInput).toBeRequired()
        })
    })

    describe('Sign Up Form', () => {
        it('switches to signup form when clicking signup tab', async () => {
            const user = userEvent.setup()
            render(<Auth />)

            const signupTab = screen.getByRole('tab', { name: /sign up/i })
            await user.click(signupTab)

            // Should show display name field (only in signup)
            expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
        })
    })
})
