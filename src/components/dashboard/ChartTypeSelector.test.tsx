import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { ChartTypeSelector, ChartType } from './ChartTypeSelector'

describe('ChartTypeSelector Component', () => {
    const mockOnTypeChange = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Rendering', () => {
        it('renders chart type selector', () => {
            render(
                <ChartTypeSelector
                    selectedType="line"
                    onTypeChange={mockOnTypeChange}
                />
            )

            expect(screen.getByText('Chart Type')).toBeInTheDocument()
        })

        it('renders all chart type buttons by default', () => {
            render(
                <ChartTypeSelector
                    selectedType="line"
                    onTypeChange={mockOnTypeChange}
                />
            )

            expect(screen.getByText('Line Chart')).toBeInTheDocument()
            expect(screen.getByText('Bar Chart')).toBeInTheDocument()
            expect(screen.getByText('Area Chart')).toBeInTheDocument()
            expect(screen.getByText('Pie Chart')).toBeInTheDocument()
        })

        it('renders only available chart types when specified', () => {
            render(
                <ChartTypeSelector
                    selectedType="line"
                    onTypeChange={mockOnTypeChange}
                    availableTypes={['line', 'bar']}
                />
            )

            expect(screen.getByText('Line Chart')).toBeInTheDocument()
            expect(screen.getByText('Bar Chart')).toBeInTheDocument()
            expect(screen.queryByText('Area Chart')).not.toBeInTheDocument()
            expect(screen.queryByText('Pie Chart')).not.toBeInTheDocument()
        })

        it('displays icons for each chart type', () => {
            render(
                <ChartTypeSelector
                    selectedType="line"
                    onTypeChange={mockOnTypeChange}
                />
            )

            const lineIcon = document.querySelector('.lucide-line-chart')
            const barIcon = document.querySelector('.lucide-bar-chart-3')
            const areaIcon = document.querySelector('.lucide-area-chart')
            const pieIcon = document.querySelector('.lucide-pie-chart')

            expect(lineIcon).toBeInTheDocument()
            expect(barIcon).toBeInTheDocument()
            expect(areaIcon).toBeInTheDocument()
            expect(pieIcon).toBeInTheDocument()
        })
    })

    describe('Selection State', () => {
        it('highlights selected chart type with default variant', () => {
            render(
                <ChartTypeSelector
                    selectedType="bar"
                    onTypeChange={mockOnTypeChange}
                />
            )

            const barButton = screen.getByText('Bar Chart').closest('button')
            expect(barButton).toHaveAttribute('data-variant', 'default')
        })

        it('shows non-selected types with outline variant', () => {
            render(
                <ChartTypeSelector
                    selectedType="line"
                    onTypeChange={mockOnTypeChange}
                />
            )

            const barButton = screen.getByText('Bar Chart').closest('button')
            expect(barButton).toHaveAttribute('data-variant', 'outline')
        })

        it('updates selection when different type is selected', () => {
            const { rerender } = render(
                <ChartTypeSelector
                    selectedType="line"
                    onTypeChange={mockOnTypeChange}
                />
            )

            let lineButton = screen.getByText('Line Chart').closest('button')
            expect(lineButton).toHaveAttribute('data-variant', 'default')

            rerender(
                <ChartTypeSelector
                    selectedType="area"
                    onTypeChange={mockOnTypeChange}
                />
            )

            const areaButton = screen.getByText('Area Chart').closest('button')
            expect(areaButton).toHaveAttribute('data-variant', 'default')

            lineButton = screen.getByText('Line Chart').closest('button')
            expect(lineButton).toHaveAttribute('data-variant', 'outline')
        })
    })

    describe('User Interaction', () => {
        it('calls onTypeChange when line chart is clicked', async () => {
            const user = userEvent.setup()

            render(
                <ChartTypeSelector
                    selectedType="bar"
                    onTypeChange={mockOnTypeChange}
                />
            )

            const lineButton = screen.getByText('Line Chart')
            await user.click(lineButton)

            expect(mockOnTypeChange).toHaveBeenCalledWith('line')
            expect(mockOnTypeChange).toHaveBeenCalledTimes(1)
        })

        it('calls onTypeChange when bar chart is clicked', async () => {
            const user = userEvent.setup()

            render(
                <ChartTypeSelector
                    selectedType="line"
                    onTypeChange={mockOnTypeChange}
                />
            )

            const barButton = screen.getByText('Bar Chart')
            await user.click(barButton)

            expect(mockOnTypeChange).toHaveBeenCalledWith('bar')
        })

        it('calls onTypeChange when area chart is clicked', async () => {
            const user = userEvent.setup()

            render(
                <ChartTypeSelector
                    selectedType="line"
                    onTypeChange={mockOnTypeChange}
                />
            )

            const areaButton = screen.getByText('Area Chart')
            await user.click(areaButton)

            expect(mockOnTypeChange).toHaveBeenCalledWith('area')
        })

        it('calls onTypeChange when pie chart is clicked', async () => {
            const user = userEvent.setup()

            render(
                <ChartTypeSelector
                    selectedType="line"
                    onTypeChange={mockOnTypeChange}
                />
            )

            const pieButton = screen.getByText('Pie Chart')
            await user.click(pieButton)

            expect(mockOnTypeChange).toHaveBeenCalledWith('pie')
        })

        it('allows clicking the currently selected type', async () => {
            const user = userEvent.setup()

            render(
                <ChartTypeSelector
                    selectedType="line"
                    onTypeChange={mockOnTypeChange}
                />
            )

            const lineButton = screen.getByText('Line Chart')
            await user.click(lineButton)

            expect(mockOnTypeChange).toHaveBeenCalledWith('line')
        })
    })

    describe('Layout', () => {
        it('uses grid layout for buttons', () => {
            const { container } = render(
                <ChartTypeSelector
                    selectedType="line"
                    onTypeChange={mockOnTypeChange}
                />
            )

            const grid = container.querySelector('.grid-cols-2')
            expect(grid).toBeInTheDocument()
        })

        it('has proper spacing between elements', () => {
            const { container } = render(
                <ChartTypeSelector
                    selectedType="line"
                    onTypeChange={mockOnTypeChange}
                />
            )

            const wrapper = container.querySelector('.space-y-3')
            expect(wrapper).toBeInTheDocument()
        })

        it('renders within a Card component', () => {
            const { container } = render(
                <ChartTypeSelector
                    selectedType="line"
                    onTypeChange={mockOnTypeChange}
                />
            )

            const card = container.querySelector('[class*="card"]')
            expect(card).toBeInTheDocument()
        })
    })

    describe('Accessibility', () => {
        it('buttons are keyboard accessible', () => {
            render(
                <ChartTypeSelector
                    selectedType="line"
                    onTypeChange={mockOnTypeChange}
                />
            )

            const buttons = screen.getAllByRole('button')
            expect(buttons.length).toBeGreaterThan(0)
            buttons.forEach(button => {
                expect(button).toBeInTheDocument()
            })
        })

        it('has descriptive button labels', () => {
            render(
                <ChartTypeSelector
                    selectedType="line"
                    onTypeChange={mockOnTypeChange}
                />
            )

            expect(screen.getByText('Line Chart')).toBeInTheDocument()
            expect(screen.getByText('Bar Chart')).toBeInTheDocument()
            expect(screen.getByText('Area Chart')).toBeInTheDocument()
            expect(screen.getByText('Pie Chart')).toBeInTheDocument()
        })
    })

    describe('Edge Cases', () => {
        it('handles empty availableTypes array', () => {
            render(
                <ChartTypeSelector
                    selectedType="line"
                    onTypeChange={mockOnTypeChange}
                    availableTypes={[]}
                />
            )

            expect(screen.queryByText('Line Chart')).not.toBeInTheDocument()
            expect(screen.queryByText('Bar Chart')).not.toBeInTheDocument()
        })

        it('handles single chart type', () => {
            render(
                <ChartTypeSelector
                    selectedType="pie"
                    onTypeChange={mockOnTypeChange}
                    availableTypes={['pie']}
                />
            )

            expect(screen.getByText('Pie Chart')).toBeInTheDocument()
            expect(screen.queryByText('Line Chart')).not.toBeInTheDocument()
        })

        it('handles three chart types', () => {
            render(
                <ChartTypeSelector
                    selectedType="line"
                    onTypeChange={mockOnTypeChange}
                    availableTypes={['line', 'bar', 'area']}
                />
            )

            expect(screen.getByText('Line Chart')).toBeInTheDocument()
            expect(screen.getByText('Bar Chart')).toBeInTheDocument()
            expect(screen.getByText('Area Chart')).toBeInTheDocument()
            expect(screen.queryByText('Pie Chart')).not.toBeInTheDocument()
        })
    })
})
