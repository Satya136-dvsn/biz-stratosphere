import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils'
import { KPICard } from './KPICard'

describe('KPICard Component', () => {
    describe('Rendering', () => {
        it('renders KPI card with title and value', () => {
            render(
                <KPICard
                    title="Total Revenue"
                    value="125430"
                    change={12.5}
                    format="currency"
                />
            )

            expect(screen.getByText('TOTAL REVENUE')).toBeInTheDocument()
            expect(screen.getByText('$125,430')).toBeInTheDocument()
        })

        it('renders with number format', () => {
            render(
                <KPICard
                    title="Total Users"
                    value={1234}
                    change={5}
                    format="number"
                />
            )

            expect(screen.getByText('TOTAL USERS')).toBeInTheDocument()
            expect(screen.getByText('1,234')).toBeInTheDocument()
        })

        it('renders with percentage format', () => {
            render(
                <KPICard
                    title="Growth Rate"
                    value={15.5}
                    change={2.3}
                    format="percentage"
                />
            )

            expect(screen.getByText('15.5%')).toBeInTheDocument()
        })
    })

    describe('Change Indicator', () => {
        it('shows positive change with trending up icon', () => {
            render(
                <KPICard
                    title="Revenue"
                    value={1000}
                    change={15.5}
                />
            )

            expect(screen.getByText('+15.5%')).toBeInTheDocument()
            const trendUpIcons = document.querySelectorAll('.lucide-trending-up')
            expect(trendUpIcons.length).toBeGreaterThan(0)
        })

        it('shows negative change with trending down icon', () => {
            render(
                <KPICard
                    title="Revenue"
                    value={1000}
                    change={-8.3}
                />
            )

            expect(screen.getByText('-8.3%')).toBeInTheDocument()
            const trendDownIcons = document.querySelectorAll('.lucide-trending-down')
            expect(trendDownIcons.length).toBeGreaterThan(0)
        })

        it('shows zero change with minus icon', () => {
            render(
                <KPICard
                    title="Stable Metric"
                    value={500}
                    change={0}
                />
            )

            expect(screen.getByText('0%')).toBeInTheDocument()
            const minusIcons = document.querySelectorAll('.lucide-minus')
            expect(minusIcons.length).toBeGreaterThan(0)
        })

        it('applies correct styling for positive change', () => {
            render(
                <KPICard
                    title="Test"
                    value={100}
                    change={10}
                />
            )

            const changeText = screen.getByText('+10%')
            expect(changeText).toHaveClass('text-accent')
        })

        it('applies correct styling for negative change', () => {
            render(
                <KPICard
                    title="Test"
                    value={100}
                    change={-5}
                />
            )

            const changeText = screen.getByText('-5%')
            expect(changeText).toHaveClass('text-destructive')
        })
    })

    describe('Period Display', () => {
        it('shows default period text', () => {
            render(
                <KPICard
                    title="Revenue"
                    value={1000}
                    change={5}
                />
            )

            expect(screen.getByText('vs last month')).toBeInTheDocument()
        })

        it('shows custom period text', () => {
            render(
                <KPICard
                    title="Revenue"
                    value={1000}
                    change={5}
                    period="vs last year"
                />
            )

            expect(screen.getByText('vs last year')).toBeInTheDocument()
        })
    })

    describe('Variant Styling', () => {
        it('applies revenue variant styling', () => {
            const { container } = render(
                <KPICard
                    title="Revenue"
                    value={1000}
                    change={5}
                    variant="revenue"
                />
            )

            const card = container.querySelector('[class*="bg-gradient-revenue"]')
            expect(card).toBeInTheDocument()
        })

        it('applies growth variant styling', () => {
            const { container } = render(
                <KPICard
                    title="Growth"
                    value={1000}
                    change={15}
                    variant="growth"
                />
            )

            const card = container.querySelector('[class*="from-growth"]')
            expect(card).toBeInTheDocument()
        })

        it('applies warning variant styling', () => {
            const { container } = render(
                <KPICard
                    title="Warning"
                    value={1000}
                    change={-10}
                    variant="warning"
                />
            )

            const card = container.querySelector('[class*="from-warning"]')
            expect(card).toBeInTheDocument()
        })

        it('applies default info variant', () => {
            const { container } = render(
                <KPICard
                    title="Info"
                    value={1000}
                    change={5}
                />
            )

            const card = container.querySelector('[class*="bg-gradient-primary"]')
            expect(card).toBeInTheDocument()
        })
    })

    describe('Value Formatting', () => {
        it('formats currency correctly', () => {
            render(
                <KPICard
                    title="Revenue"
                    value={1234567}
                    change={5}
                    format="currency"
                />
            )

            expect(screen.getByText('$1,234,567')).toBeInTheDocument()
        })

        it('formats large numbers with commas', () => {
            render(
                <KPICard
                    title="Users"
                    value={9876543}
                    change={2}
                    format="number"
                />
            )

            // Use regex to match formatted number (handles different locale formats)
            expect(screen.getByText(/9[,.]876[,.]543/)).toBeInTheDocument()
        })

        it('handles string values', () => {
            render(
                <KPICard
                    title="Test"
                    value="123456"
                    change={1}
                    format="currency"
                />
            )

            expect(screen.getByText('$123,456')).toBeInTheDocument()
        })
    })

    describe('Visual Elements', () => {
        it('has hover animation class', () => {
            const { container } = render(
                <KPICard
                    title="Test"
                    value={100}
                    change={5}
                />
            )

            const card = container.firstChild
            expect(card).toHaveClass('hover:scale-105')
        })

        it('has fade-in animation', () => {
            const { container } = render(
                <KPICard
                    title="Test"
                    value={100}
                    change={5}
                />
            )

            const card = container.firstChild
            expect(card).toHaveClass('animate-fade-in')
        })

        it('displays decorative gradient overlay', () => {
            const { container } = render(
                <KPICard
                    title="Test"
                    value={100}
                    change={5}
                />
            )

            const overlay = container.querySelector('[class*="bg-gradient-to-br from-white"]')
            expect(overlay).toBeInTheDocument()
        })
    })
})
