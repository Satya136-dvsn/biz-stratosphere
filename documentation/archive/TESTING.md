# Testing Documentation

## Overview

Comprehensive testing suite for Biz Stratosphere platform with unit tests, component tests, and integration tests.

## Test Structure

```
src/
├── test/
│   ├── setup.ts           # Test setup and configuration
│   ├── factories.ts       # Mock data factories
│   ├── mocks.ts          # API and service mocks
│   ├── utils.ts          # Test utilities and helpers
│   └── integration.test.ts # Integration test placeholders
├── hooks/
│   ├── useEmbeddings.test.ts
│   └── useMLPredictions.test.ts
└── components/
    └── ErrorBoundary.tsx  # Error handling component
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test useEmbeddings

# Run E2E tests (Playwright)
npx playwright test
```

## Test Coverage

### Unit Tests

- ✅ `useEmbeddings` - Embeddings generation and search
- ✅ `useMLPredictions` - ML predictions and SHAP
- ⏳ `useRAGChat` - Conversations and messages (TODO)
- ⏳ `useReports` - Report generation (TODO)
- ⏳ `useChartConfigurations` - Chart configs (TODO)

### Component Tests

- ⏳ `AIChat` - Chat interface (TODO)
- ⏳ `MLPredictions` - ML predictions page (TODO)
- ⏳ `AdvancedCharts` - Charts page (TODO)

### Integration Tests

- ⏳ RAG Flow (Use Playwright E2E)
- ⏳ ML Prediction Flow (Use Playwright E2E)
- ⏳ Chart Creation Flow (Use Playwright E2E)
- ⏳ Report Generation Flow (Use Playwright E2E)

## Test Utilities

### Factories

Create consistent mock data:

```typescript
import { createMockDataset, createMockEmbedding } from '@/test/factories';

const dataset = createMockDataset({ name: 'Custom Name' });
const embeddings = createMockList(createMockEmbedding, 10);
```

### Mocks

Mock external services:

```typescript
import { mockGeminiAPI, mockMLService, mockFetch } from '@/test/mocks';

// Gemini API mocks
mockGeminiAPI.embedContent.mockResolvedValue({ ... });
mockGeminiAPI.generateContent.mockResolvedValue({ ... });

// ML Service mocks
mockMLService.predict.mockResolvedValue({ ... });
mockMLService.explain.mockResolvedValue({ ... });
```

### Test Rendering

Render components with providers:

```typescript
import { renderWithProviders } from '@/test/utils';

const { getByText, queryClient } = renderWithProviders(<MyComponent />);
```

## Error Handling

### Error Boundary

Wrap components to catch errors:

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

Or use HOC:

```typescript
import { withErrorBoundary } from '@/components/ErrorBoundary';

export default withErrorBoundary(MyComponent);
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Reset mocks after each test
3. **Async**: Use `waitFor` for async operations
4. **Coverage**: Aim for 80%+ on critical code
5. **E2E**: Use Playwright for full user flows

## CI/CD Integration

Tests run automatically on:

- PR creation
- Push to main branch
- Before deployment

## Coverage Goals

- **Hooks**: 90% (critical business logic)
- **Components**: 75% (UI + interaction)
- **Utils**: 85% (pure functions)
- **Overall**: 80%

## Current Coverage

Run `npm run test:coverage` to see detailed coverage report.

## Next Steps

1. Complete remaining hook tests
2. Add component tests
3. Implement E2E tests with Playwright
4. Achieve 80% coverage target
5. Set up CI/CD test pipeline
