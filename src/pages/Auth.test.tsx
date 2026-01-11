import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import Auth from './Auth'
import { supabase } from '@/integrations/supabase/client'

// Mock window.location
delete (window as any).location
window.location = { href: '' } as any

describe.skip('Auth Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        window.location.href = ''
    })

    describe('Rendering', () => {
        it('renders the auth page with signin form by default', () => {
            render(<Auth />)

            expect(screen.getByText('Biz Stratosphere')).toBeInTheDocument()
            expect(screen.getByText('AI-Powered Business Intelligence Platform')).toBeInTheDocument()
            expect(screen.getByText('Welcome Back')).toBeInTheDocument()
            expect(screen.getByRole('tab', { name: /sign in/i })).toBeInTheDocument()
            expect(screen.getByRole('tab', { name: /sign up/i })).toBeInTheDocument()
        })

        it('shows sign in form elements', () => {
            render(<Auth />)

            expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
            expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
        })

        it('switches to signup form when clicking signup tab', async () => {
            const user = userEvent.setup()
            render(<Auth />)

            const signupTab = screen.getByRole('tab', { name: /sign up/i })
            await user.click(signupTab)

            // Should show display name field (only in signup)
            expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
        })
    })

    describe('Sign In Functionality', () => {
        it('validates required fields on sign in', async () => {
            const user = userEvent.setup()
            render(<Auth />)

            const signInButton = screen.getByRole('button', { name: /sign in/i })
            await user.click(signInButton)

            // Form should show validation since fields are empty
            const emailInput = screen.getByLabelText(/^email$/i)
            const passwordInput = screen.getByLabelText(/^password$/i)

            expect(emailInput).toBeRequired()
            expect(passwordInput).toBeRequired()
        })

        it('calls supabase signIn on form submit with valid credentials', async () => {
            const user = userEvent.setup()
            const mockSignIn = vi.mocked(supabase.auth.signInWithPassword)
            mockSignIn.mockResolvedValue({
                data: {
                    user: { id: '123', email: 'test@example.com' } as any,
                    session: { access_token: 'token' } as any,
                },
                error: null,
            })

            render(<Auth />)

            const emailInput = screen.getByLabelText(/^email$/i)
            const passwordInput = screen.getByLabelText(/^password$/i)
            const signInButton = screen.getByRole('button', { name: /sign in/i })

            await user.type(emailInput, 'test@example.com')
            await user.type(passwordInput, 'password123')
            await user.click(signInButton)

            await waitFor(() => {
                expect(mockSignIn).toHaveBeenCalledWith({
                    email: 'test@example.com',
                    password: 'password123',
                })
            })
        })

        it('shows loading state during sign in', async () => {
            const user = userEvent.setup()
            const mockSignIn = vi.mocked(supabase.auth.signInWithPassword)

            // Make the promise not resolve immediately
            let resolveSignIn: any
            mockSignIn.mockReturnValue(new Promise((resolve) => {
                resolveSignIn = resolve
            }))

            render(<Auth />)

            await user.type(screen.getByLabelText(/^email$/i), 'test@example.com')
            await user.type(screen.getByLabelText(/^password$/i), 'password123')
            await user.click(screen.getByRole('button', { name: /sign in/i }))

            // Should show loading state
            expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled()

            // Resolve the promise
            resolveSignIn({
                data: { user: { id: '123' }, session: {} },
                error: null,
            })
        })

        it('redirects to home on successful sign in', async () => {
            const user = userEvent.setup()
            const mockSignIn = vi.mocked(supabase.auth.signInWithPassword)
            mockSignIn.mockResolvedValue({
                data: {
                    user: { id: '123' } as any,
                    session: { access_token: 'token' } as any,
                },
                error: null,
            })

            render(<Auth />)

            await user.type(screen.getByLabelText(/^email$/i), 'test@example.com')
            await user.type(screen.getByLabelText(/^password$/i), 'password123')
            await user.click(screen.getByRole('button', { name: /sign in/i }))

            await waitFor(() => {
                expect(window.location.href).toBe('/')
            })
        })
    })

    describe('Sign Up Functionality', () => {
        it('shows all signup form fields', async () => {
            const user = userEvent.setup()
            render(<Auth />)

            await user.click(screen.getByRole('tab', { name: /sign up/i }))

            expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
            expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
            expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
        })

        it('validates all required fields on sign up', async () => {
            const user = userEvent.setup()
            render(<Auth />)

            await user.click(screen.getByRole('tab', { name: /sign up/i }))

            const displayNameInput = screen.getByLabelText(/display name/i)
            const emailInput = screen.getByLabelText(/email/i)
            const passwordInput = screen.getByLabelText(/password/i)

            expect(displayNameInput).toBeRequired()
            expect(emailInput).toBeRequired()
            expect(passwordInput).toBeRequired()
        })

        it('calls supabase signUp on form submit', async () => {
            const user = userEvent.setup()
            const mockSignUp = vi.mocked(supabase.auth.signUp)
            mockSignUp.mockResolvedValue({
                data: {
                    user: { id: '123', email: 'test@example.com' } as any,
                    session: null,
                },
                error: null,
            })

            render(<Auth />)

            await user.click(screen.getByRole('tab', { name: /sign up/i }))

            await user.type(screen.getByLabelText(/display name/i), 'Test User')
            await user.type(screen.getByLabelText(/email/i), 'test@example.com')
            await user.type(screen.getByLabelText(/password/i), 'password123')
            await user.click(screen.getByRole('button', { name: /create account/i }))

            await waitFor(() => {
                expect(mockSignUp).toHaveBeenCalledWith({
                    email: 'test@example.com',
                    password: 'password123',
                    options: expect.objectContaining({
                        data: {
                            display_name: 'Test User',
                        },
                    }),
                })
            })
        })

        it('enforces minimum password length of 6 characters', async () => {
            const user = userEvent.setup()
            render(<Auth />)

            await user.click(screen.getByRole('tab', { name: /sign up/i }))

            const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement
            expect(passwordInput.minLength).toBe(6)
        })
    })

    describe('Authentication Check on Mount', () => {
        it('redirects to home if user is already authenticated', async () => {
            const mockGetSession = vi.mocked(supabase.auth.getSession)
            mockGetSession.mockResolvedValue({
                data: {
                    session: {
                        access_token: 'token',
                        user: { id: '123' } as any,
                    } as any,
                },
                error: null,
            })

            render(<Auth />)

            await waitFor(() => {
                expect(window.location.href).toBe('/')
            })
        })

        it('does not redirect if no session exists', async () => {
            const mockGetSession = vi.mocked(supabase.auth.getSession)
            mockGetSession.mockResolvedValue({
                data: { session: null },
                error: null,
            })

            render(<Auth />)

            await waitFor(() => {
                expect(window.location.href).toBe('')
            })
        })
    })
})
