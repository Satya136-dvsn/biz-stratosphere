# Design Document

> **📊 IMPLEMENTATION STATUS: 95% Complete** | **Last Updated: December 21, 2025**
>
> **Current Architecture Implemented:**
>
> - ✅ Next.js 14+ frontend with TypeScript, Tailwind CSS, Shadcn UI (49 components)
> - ✅ Supabase backend (Auth, PostgreSQL, Storage, Edge Functions - 16 functions deployed)
> - ✅ Database: 14 migrations, 20+ tables with RLS policies
> - ✅ Components: 80+ component directories, 10 pages (Auth, Dashboard, Upload, ML, Chat, etc.)
> - ✅ AI Integration: RAG system with `pgvector`, Gemini 2.5, tuning controls
> - ✅ ML Pipeline: TensorFlow.js in-browser training, automated versioning, metrics tracking
> - ✅ Vector embeddings (pgvector) fully implemented
> - ✅ Automation Engine: Rules execution logic & UI implementation complete
> - ✅ Dual Intelligence: Gemini (Cloud) vs Ollama (Local) comparison active
> - ❌ Rate limiting (Upstash Redis) planned for post-launch
> - ⚠️ Comprehensive testing suite (40% coverage)
>
> **Architectural Simplifications from Original Plan:**
>
> - ❌ Java Spring Boot backend → Replaced with Supabase (Completed)
> - ❌ Apache Airflow → Replaced with Supabase Edge Functions + triggers (Completed)
> - ❌ Kafka/Kinesis → Replaced with Supabase Realtime (Completed)
> - ❌ Public Deployment → Currently local-first development environment

## Overview

Biz Stratosphere 2.0 is a modern, AI-powered Business Intelligence platform built on Next.js and Supabase. The system enables companies to upload business data, automatically clean and analyze it, generate AI-driven insights, and visualize results through interactive dashboards. The architecture follows a serverless, event-driven design pattern optimized for scalability and developer velocity.

### Design Principles

1. **Serverless-First**: Leverage Supabase Edge Functions and Vercel serverless functions to minimize operational overhead
2. **Progressive Enhancement**: Build core functionality first (P0), then layer advanced features (P1/P2)
3. **Security by Default**: Implement authentication, authorization, and encryption at every layer
4. **API-First**: Design RESTful APIs that can support future mobile apps and integrations
5. **Observability**: Instrument all critical paths with logging, metrics, and tracing

## Architecture

### High-Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        UI[Next.js Frontend<br/>React + TypeScript + Tailwind]
    end
    
    subgraph "API Layer"
        API[Next.js API Routes<br/>/api/*]
        AI[AI Service<br/>/api/ai/*]
    end
    
    subgraph "Supabase Backend"
        Auth[Supabase Auth<br/>JWT + OAuth]
        DB[(PostgreSQL<br/>Database)]
        Storage[Supabase Storage<br/>File Uploads]
        Functions[Edge Functions<br/>ETL + Jobs]
    end
    
    subgraph "External Services"
        OpenAI[OpenAI API<br/>GPT-4 + Embeddings]
        Sentry[Sentry<br/>Error Tracking]
        Email[Email Service<br/>Alerts]
    end
    
    UI --> API
    UI --> Auth
    API --> DB
    API --> Storage
    API --> Functions
    API --> AI
    AI --> OpenAI
    Functions --> DB
    Functions --> Email
    API --> Sentry
```

### Technology Stack

**Frontend:**

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS + Shadcn UI components
- Recharts for data visualization
- Framer Motion for animations
- React Hook Form + Zod for form validation

**Backend:**

- Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- Next.js API Routes (serverless functions on Vercel)
- OpenAI API (GPT-4 for natural language queries, text-embedding-3-small for embeddings)

**Infrastructure:**

- Vercel (frontend hosting + serverless functions)
- Supabase Cloud (managed backend)
- GitHub Actions (CI/CD)
- Sentry (error monitoring)

**Development Tools:**

- ESLint + Prettier (code quality)
- Jest + React Testing Library (unit tests)
- Playwright (E2E tests)
- Husky (git hooks)

## Components and Interfaces

### Frontend Components

#### Layout Components

**AppLayout** (`src/components/layout/AppLayout.tsx`)

- Provides consistent layout with sidebar navigation and top bar
- Handles responsive behavior (mobile drawer, desktop sidebar)
- Integrates workspace switcher in header
- Props: `children: ReactNode`

**Sidebar** (`src/components/layout/Sidebar.tsx`)

- Navigation menu with icons for Dashboard, Upload, Insights, Automation, Settings
- Active route highlighting
- Workspace selector dropdown
- User profile menu at bottom

**TopBar** (`src/components/layout/TopBar.tsx`)

- Breadcrumb navigation
- Global search (future)
- Notifications bell icon
- User avatar with dropdown menu

#### Feature Components

**DatasetUploader** (`src/components/upload/DatasetUploader.tsx`)

- Drag-and-drop file upload zone
- File type validation (CSV, XLSX)
- Upload progress indicator
- Error display with retry option
- Props: `onUploadComplete: (datasetId: string) => void`

**DatasetPreview** (`src/components/upload/DatasetPreview.tsx`)

- Table displaying first 10 rows of uploaded data
- Column headers with data type indicators
- PII detection warnings
- Props: `datasetId: string, columns: Column[], rows: Row[]`

**DashboardGrid** (`src/components/dashboard/DashboardGrid.tsx`)

- Responsive grid layout for KPI cards and charts
- Drag-and-drop reordering (future)
- Props: `widgets: Widget[]`

**KPICard** (`src/components/dashboard/KPICard.tsx`)

- Displays single metric with trend indicator
- Sparkline for historical trend
- Props: `title: string, value: number, trend: number, unit?: string`

**ChartWidget** (`src/components/dashboard/ChartWidget.tsx`)

- Wrapper for Recharts components
- Supports bar, line, pie, area charts
- Export to PNG/PDF functionality
- Props: `type: ChartType, data: ChartData, config: ChartConfig`

**AIQueryBox** (`src/components/insights/AIQueryBox.tsx`)

- Text input for natural language queries
- Loading state with animated dots
- Query history dropdown
- Example queries as suggestions
- Props: `datasetId: string, onQuerySubmit: (query: string) => void`

**InsightCard** (`src/components/insights/InsightCard.tsx`)

- Displays AI-generated insight with icon
- Supports text, chart, or table results
- "Explain" button for detailed breakdown
- Props: `insight: Insight, onExplain?: () => void`

**AutomationRuleBuilder** (`src/components/automation/AutomationRuleBuilder.tsx`)

- Form for creating automation rules
- Condition builder (field, operator, value)
- Alert channel selector (email, Slack)
- Test rule button
- Props: `datasetId: string, onSave: (rule: AutomationRule) => void`

**ChatWidget** (`src/components/chat/ChatWidget.tsx`)

- Persistent chat interface (collapsible)
- Message history with user/AI avatars
- Typing indicator
- Context-aware responses based on current page
- Props: `workspaceId: string`

#### Shared UI Components (Shadcn)

- Button, Input, Select, Checkbox, Radio
- Dialog, Sheet, Popover, Tooltip
- Table, Card, Badge, Alert
- Form components with validation

### Backend API Routes

#### Authentication Routes

**POST /api/auth/signup**

- Creates new user account
- Request: `{ email, password, name }`
- Response: `{ user, session }`

**POST /api/auth/login**

- Authenticates user
- Request: `{ email, password }`
- Response: `{ user, session, token }`

**POST /api/auth/logout**

- Invalidates session
- Response: `{ success: true }`

**GET /api/auth/session**

- Returns current session
- Response: `{ user, workspace }`

#### Dataset Routes

**POST /api/datasets/upload**

- Initiates file upload to Supabase Storage
- Request: `multipart/form-data` with file
- Response: `{ datasetId, uploadUrl, metadata }`
- Triggers ETL Edge Function asynchronously

**GET /api/datasets**

- Lists all datasets for current workspace
- Query params: `workspaceId, page, limit, sortBy`
- Response: `{ datasets: Dataset[], total, page }`

**GET /api/datasets/:id**

- Returns dataset details and preview
- Response: `{ dataset: Dataset, preview: Row[], stats: Stats }`

**DELETE /api/datasets/:id**

- Soft deletes dataset (marks for deletion)
- Response: `{ success: true, deletionScheduledAt }`

**GET /api/datasets/:id/download**

- Downloads original or cleaned dataset
- Query params: `format=csv|xlsx, version=original|cleaned`
- Response: File stream

#### AI Routes

**POST /api/ai/query**

- Processes natural language query
- Request: `{ datasetId, query, conversationId? }`
- Response: `{ result: InsightResult, chartData?, explanation }`
- Rate limited: 100 req/min per user

**POST /api/ai/explain**

- Generates explanation for insight or prediction
- Request: `{ insightId?, predictionId?, context }`
- Response: `{ explanation: string, featureImportance?: ShapValue[] }`

**POST /api/ai/chat**

- Chatbot conversation endpoint
- Request: `{ workspaceId, message, conversationId }`
- Response: `{ reply: string, conversationId, sources?: Source[] }`

#### Dashboard Routes

**GET /api/dashboards/:datasetId**

- Returns dashboard configuration and data
- Response: `{ widgets: Widget[], kpis: KPI[], lastUpdated }`

**POST /api/dashboards/:datasetId/export**

- Exports dashboard as PDF
- Request: `{ format: 'pdf', widgets: string[] }`
- Response: PDF file stream

#### Automation Routes

**POST /api/automation/rules**

- Creates automation rule
- Request: `{ datasetId, condition, threshold, alertChannel }`
- Response: `{ rule: AutomationRule }`

**GET /api/automation/rules**

- Lists automation rules for workspace
- Query params: `workspaceId, datasetId?`
- Response: `{ rules: AutomationRule[] }`

**PATCH /api/automation/rules/:id**

- Updates rule (enable/disable/modify)
- Request: `{ enabled?, condition?, threshold? }`
- Response: `{ rule: AutomationRule }`

**DELETE /api/automation/rules/:id**

- Deletes automation rule
- Response: `{ success: true }`

**GET /api/automation/alerts**

- Lists triggered alerts
- Query params: `workspaceId, page, limit`
- Response: `{ alerts: Alert[], total }`

#### Workspace Routes

**POST /api/workspaces**

- Creates new workspace
- Request: `{ name, description? }`
- Response: `{ workspace: Workspace }`

**GET /api/workspaces**

- Lists user's workspaces
- Response: `{ workspaces: Workspace[] }`

**POST /api/workspaces/:id/members**

- Invites member to workspace
- Request: `{ email, role: 'admin'|'analyst'|'viewer' }`
- Response: `{ invitation: Invitation }`

**GET /api/workspaces/:id/usage**

- Returns workspace usage stats
- Response: `{ storage: number, datasets: number, predictions: number, quotas: Quotas }`

#### ML Model Routes (P2)

**POST /api/models/train**

- Trains ML model on dataset
- Request: `{ datasetId, targetColumn, modelType, config }`
- Response: `{ jobId, status: 'queued' }`

**GET /api/models/jobs/:jobId**

- Returns training job status
- Response: `{ status, progress, metrics?, modelId? }`

**POST /api/models/:modelId/predict**

- Makes predictions using trained model
- Request: `{ features: Record<string, any>[] }`
- Response: `{ predictions: Prediction[], modelVersion }`

**GET /api/models/:modelId/explain**

- Returns SHAP values for model
- Query params: `predictionId?`
- Response: `{ shapValues: ShapValue[], baseValue, featureNames }`

### Supabase Edge Functions

**etl-processor** (`supabase/functions/etl-processor/index.ts`)

- Triggered when dataset uploaded
- Parses CSV/Excel file
- Cleans data (missing values, type conversion, duplicates)
- Generates data quality report
- Stores cleaned data in `cleaned_datasets` table
- Updates dataset status

**automation-evaluator** (`supabase/functions/automation-evaluator/index.ts`)

- Runs on schedule (every 5 minutes via pg_cron)
- Fetches active automation rules
- Evaluates conditions against latest data
- Triggers alerts via email/Slack when conditions met
- Logs alert history

**model-trainer** (`supabase/functions/model-trainer/index.ts`) - P2

- Triggered by training job creation
- Loads dataset from database
- Trains scikit-learn model (Random Forest, XGBoost)
- Calculates performance metrics
- Saves model artifact to Storage
- Updates job status

**embedding-generator** (`supabase/functions/embedding-generator/index.ts`) - P2

- Triggered when dataset uploaded (if consent given)
- Generates embeddings for text columns using OpenAI
- Stores embeddings in `pgvector` extension
- Enables semantic search for chatbot

## Data Models

### Database Schema

```sql
-- Users (managed by Supabase Auth)
-- auth.users table provided by Supabase

-- Workspaces
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  storage_quota_gb INTEGER DEFAULT 100,
  prediction_quota_daily INTEGER DEFAULT 1000
);

-- Workspace Members
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'analyst', 'viewer')) NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Datasets
CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  row_count INTEGER,
  column_count INTEGER,
  columns JSONB, -- Array of {name, type, hasPII}
  status TEXT CHECK (status IN ('uploading', 'processing', 'ready', 'failed', 'deleted')) DEFAULT 'uploading',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  pii_consent_given BOOLEAN DEFAULT FALSE
);

-- Cleaned Datasets (stores processed data)
CREATE TABLE cleaned_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  data JSONB NOT NULL, -- Array of row objects
  quality_report JSONB, -- {missingValues, duplicates, outliers}
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Automation Rules
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  condition JSONB NOT NULL, -- {field, operator, value}
  alert_channel TEXT CHECK (alert_channel IN ('email', 'slack')) NOT NULL,
  alert_recipients JSONB NOT NULL, -- Array of emails or Slack webhook URLs
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts (triggered automation rules)
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES automation_rules(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  condition_value JSONB, -- Actual value that triggered alert
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_error TEXT
);

-- AI Conversations (for chatbot)
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  messages JSONB NOT NULL, -- Array of {role, content, timestamp}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Queries (for insights)
CREATE TABLE ai_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  query_text TEXT NOT NULL,
  result JSONB, -- {type, data, chartConfig}
  tokens_used INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ML Models
CREATE TABLE ml_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  model_type TEXT CHECK (model_type IN ('classification', 'regression', 'churn', 'sales')) NOT NULL,
  target_column TEXT NOT NULL,
  artifact_url TEXT, -- Used for exports/backups
  version TEXT DEFAULT '1.0.0',
  status TEXT CHECK (status IN ('training', 'ready', 'failed')) DEFAULT 'training',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ML Model Metrics (Historical performance)
CREATE TABLE ml_model_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES ml_models(id) ON DELETE CASCADE,
  metrics JSONB NOT NULL, -- {accuracy, loss, r2, etc.}
  version TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  trained_at TIMESTAMPTZ DEFAULT NOW()
);

-- Predictions (P2)
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES ml_models(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  input_features JSONB NOT NULL,
  prediction_value JSONB NOT NULL,
  confidence FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Embeddings (P2 - requires pgvector extension)
CREATE TABLE dataset_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL,
  column_name TEXT NOT NULL,
  text_content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'dataset.upload', 'dataset.delete', 'model.train', etc.
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_datasets_workspace ON datasets(workspace_id);
CREATE INDEX idx_datasets_status ON datasets(status);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_automation_rules_dataset ON automation_rules(dataset_id);
CREATE INDEX idx_alerts_rule ON alerts(rule_id);
CREATE INDEX idx_ai_queries_dataset ON ai_queries(dataset_id);
CREATE INDEX idx_audit_logs_workspace ON audit_logs(workspace_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

### TypeScript Interfaces

```typescript
// Core Types
interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

interface Workspace {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  storage_quota_gb: number;
  prediction_quota_daily: number;
}

interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'admin' | 'analyst' | 'viewer';
  joined_at: string;
  user?: User;
}

interface Dataset {
  id: string;
  workspace_id: string;
  uploaded_by: string;
  file_name: string;
  file_url: string;
  file_size_bytes: number;
  row_count?: number;
  column_count?: number;
  columns?: Column[];
  status: 'uploading' | 'processing' | 'ready' | 'failed' | 'deleted';
  error_message?: string;
  created_at: string;
  updated_at: string;
  pii_consent_given: boolean;
}

interface Column {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  hasPII: boolean;
  nullable: boolean;
  unique: boolean;
}

interface DataQualityReport {
  missingValues: Record<string, number>;
  duplicateRows: number;
  outliers: Record<string, number[]>;
  dataTypes: Record<string, string>;
}

interface AutomationRule {
  id: string;
  workspace_id: string;
  dataset_id: string;
  created_by: string;
  name: string;
  condition: RuleCondition;
  alert_channel: 'email' | 'slack';
  alert_recipients: string[];
  enabled: boolean;
  created_at: string;
}

interface RuleCondition {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains';
  value: string | number;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}


interface Alert {
  id: string;
  rule_id: string;
  triggered_at: string;
  condition_value: any;
  notification_sent: boolean;
  notification_error?: string;
  rule?: AutomationRule;
}

interface AIQuery {
  id: string;
  dataset_id: string;
  user_id: string;
  query_text: string;
  result?: InsightResult;
  tokens_used?: number;
  latency_ms?: number;
  created_at: string;
}

interface InsightResult {
  type: 'text' | 'chart' | 'table';
  data: any;
  chartConfig?: ChartConfig;
  explanation?: string;
}

interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area';
  xAxis?: string;
  yAxis?: string;
  series?: string[];
  colors?: string[];
}

interface MLModel {
  id: string;
  dataset_id: string;
  workspace_id: string;
  created_by: string;
  name: string;
  model_type: 'classification' | 'regression';
  target_column: string;
  artifact_url: string;
  metrics?: ModelMetrics;
  feature_importance?: Record<string, number>;
  version: number;
  status: 'training' | 'ready' | 'failed';
  created_at: string;
}

interface ModelMetrics {
  accuracy?: number;
  rmse?: number;
  mae?: number;
  auc?: number;
  f1_score?: number;
  r2_score?: number;
}

interface Prediction {
  id: string;
  model_id: string;
  user_id: string;
  input_features: Record<string, any>;
  prediction_value: any;
  confidence?: number;
  created_at: string;
}

interface ShapValue {
  feature: string;
  value: number;
  contribution: number;
}
```

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```typescript
interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
    requestId: string;
  };
  status: number;
}
```

### Error Codes

- `AUTH_REQUIRED` (401): User not authenticated
- `FORBIDDEN` (403): User lacks permission for resource
- `NOT_FOUND` (404): Resource does not exist
- `VALIDATION_ERROR` (400): Invalid request parameters
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `QUOTA_EXCEEDED` (402): Workspace quota exceeded
- `FILE_TOO_LARGE` (413): Upload exceeds size limit
- `UNSUPPORTED_FORMAT` (415): File format not supported
- `ETL_FAILED` (500): Data processing error
- `AI_SERVICE_ERROR` (503): OpenAI API unavailable
- `INTERNAL_ERROR` (500): Unexpected server error

### Error Handling Strategy

**Frontend:**

1. Display user-friendly error messages using toast notifications
2. Provide actionable recovery options (retry, contact support)
3. Log errors to Sentry with user context
4. Implement exponential backoff for retries

**Backend:**

1. Catch and wrap all errors with consistent format
2. Log errors with stack traces and request context
3. Return appropriate HTTP status codes
4. Sanitize error messages to avoid exposing internals

**Edge Functions:**

1. Implement try-catch blocks around all operations
2. Update job status to 'failed' with error message
3. Send error notifications for critical failures
4. Implement dead letter queue for failed jobs

### Retry Logic

- **Transient errors** (network, timeout): Exponential backoff with max 3 retries
- **Rate limits**: Wait for reset time, then retry
- **Quota exceeded**: Do not retry, prompt user to upgrade
- **Validation errors**: Do not retry, return error to user

## Testing Strategy

### Unit Tests

**Coverage Target:** 80% for backend API routes and utility functions

**Tools:** Jest + React Testing Library

**Test Files:**

- `src/lib/utils/*.test.ts` - Utility functions (data parsing, validation)
- `src/lib/supabase/*.test.ts` - Database queries and mutations
- `src/components/**/*.test.tsx` - Component rendering and interactions
- `supabase/functions/**/index.test.ts` - Edge function logic

**Example Test Cases:**

- CSV parsing handles malformed data
- Data type detection correctly identifies columns
- Authentication middleware rejects invalid tokens
- Rate limiting enforces correct thresholds
- Chart components render with empty data

### Integration Tests

**Coverage:** Critical user flows and API integrations

**Tools:** Jest + Supertest (API testing)

**Test Scenarios:**

1. **Upload Flow:** Upload CSV → ETL processing → Dataset ready
2. **Authentication Flow:** Signup → Login → Access protected route
3. **AI Query Flow:** Submit query → OpenAI processing → Return results
4. **Automation Flow:** Create rule → Trigger condition → Send alert
5. **Workspace Flow:** Create workspace → Invite member → Verify access

### End-to-End Tests

**Coverage:** Complete user journeys from UI to database

**Tools:** Playwright

**Test Scenarios:**

1. New user signs up, creates workspace, uploads dataset, views dashboard
2. Analyst creates automation rule, rule triggers, receives email alert
3. User asks AI query, receives chart visualization, exports to PDF
4. Admin invites team member, member accepts, accesses shared datasets
5. User trains ML model, makes predictions, views SHAP explanations

### Performance Tests

**Tools:** k6 or Artillery

**Test Scenarios:**

- Load test: 500 concurrent users accessing dashboards
- Stress test: Upload 100 datasets simultaneously
- Spike test: Sudden burst of AI queries
- Endurance test: 24-hour sustained load

**Acceptance Criteria:**

- API p95 latency < 500ms (non-AI endpoints)
- AI query p95 latency < 8s
- Dashboard load time < 2s
- ETL processing: 10k rows/second

### Data Validation Tests

**Tools:** Great Expectations (future) or custom validators

**Validation Rules:**

- Schema validation: Column names and types match expected format
- Data quality: Missing value percentage < 20%
- Referential integrity: Foreign keys exist
- Business rules: Revenue values are positive, dates are valid

### Test Automation

**CI Pipeline (GitHub Actions):**

1. Lint and format check (ESLint, Prettier)
2. Type checking (TypeScript)
3. Unit tests (Jest)
4. Integration tests (API routes)
5. Build verification (Next.js build)
6. E2E tests (Playwright) - on staging only
7. Security scanning (npm audit, Snyk)

**Pre-deployment Checks:**

- All tests pass
- Code coverage meets threshold
- No critical security vulnerabilities
- Database migrations tested
- Environment variables configured

## Security Considerations

### Authentication & Authorization

**Implementation:**

- Supabase Auth with JWT tokens
- Row Level Security (RLS) policies on all tables
- Role-based access control (RBAC) for workspaces
- Session expiration: 7 days (configurable)
- Refresh token rotation

**RLS Policies:**

```sql
-- Users can only see workspaces they're members of
CREATE POLICY workspace_access ON workspaces
  FOR SELECT USING (
    id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can only access datasets in their workspaces
CREATE POLICY dataset_access ON datasets
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Only admins can delete datasets
CREATE POLICY dataset_delete ON datasets
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

### Data Encryption

**At Rest:**

- Supabase Storage: AES-256 encryption
- Database: Transparent Data Encryption (TDE) via Supabase
- Sensitive fields: Additional encryption for PII columns

**In Transit:**

- TLS 1.3 for all API communications
- HTTPS only (HSTS enabled)
- Secure WebSocket connections for real-time features

### Input Validation & Sanitization

**Frontend:**

- Zod schemas for form validation
- File type validation before upload
- Size limits enforced client-side

**Backend:**

- Validate all request parameters against schemas
- Sanitize SQL inputs (parameterized queries)
- Escape HTML in user-generated content
- Validate file contents after upload

### Rate Limiting

**Implementation:**

- Upstash Redis for distributed rate limiting
- Per-user and per-workspace limits
- Different limits for different endpoints

**Limits:**

- AI queries: 100 req/min per user
- Dataset uploads: 10 per day per user
- API calls: 1000 req/hour per user
- Predictions: 1000 per day per workspace

### Secrets Management

**Development:**

- `.env.local` for local secrets (gitignored)
- Supabase local development keys

**Production:**

- Vercel environment variables
- Supabase project secrets
- OpenAI API key rotation policy (90 days)
- Webhook signing secrets for Slack integration

### Security Headers

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
];
```

### Audit Logging

**Logged Events:**

- User authentication (login, logout, failed attempts)
- Dataset operations (upload, download, delete)
- Workspace changes (member added/removed, role changed)
- Model training and predictions
- Automation rule triggers
- API key usage

**Log Format:**

```typescript
interface AuditLog {
  id: string;
  workspace_id: string;
  user_id: string;
  action: string; // 'dataset.upload', 'model.train', etc.
  resource_type: string;
  resource_id: string;
  metadata: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}
```

**Retention:** 90 days, then archived to cold storage

## Performance Optimization

### Caching Strategy

**Client-Side:**

- React Query for API response caching (5 min stale time)
- LocalStorage for user preferences
- Service Worker for offline dashboard viewing (future)

**Server-Side:**

- Vercel Edge Cache for static assets (CDN)
- Redis cache for frequently accessed datasets (5 min TTL)
- Supabase connection pooling

**Database:**

- Materialized views for dashboard aggregations
- Partial indexes on filtered queries
- Query result caching in Supabase

### Database Optimization

**Indexing Strategy:**

- B-tree indexes on foreign keys and frequently filtered columns
- GiST index on JSONB columns for fast lookups
- Partial indexes for status-based queries

**Query Optimization:**

- Use `SELECT` with specific columns (avoid `SELECT *`)
- Implement pagination for large result sets
- Use database views for complex joins
- Batch inserts for bulk operations

**Connection Management:**

- Connection pooling via Supabase (PgBouncer)
- Max connections: 100 (configurable)
- Idle timeout: 10 minutes

### Frontend Optimization

**Code Splitting:**

- Route-based code splitting (Next.js automatic)
- Dynamic imports for heavy components (charts, PDF export)
- Lazy loading for below-the-fold content

**Asset Optimization:**

- Image optimization via Next.js Image component
- SVG icons instead of icon fonts
- Minification and compression (Brotli)

**Rendering Strategy:**

- Server-side rendering (SSR) for initial page load
- Static generation for marketing pages
- Client-side rendering for interactive dashboards
- Incremental Static Regeneration (ISR) for dashboard templates

### API Optimization

**Response Optimization:**

- Compress responses with gzip/brotli
- Implement field filtering (`?fields=id,name`)
- Use cursor-based pagination for large datasets
- Return minimal data (avoid over-fetching)

**Request Optimization:**

- Batch multiple requests into single call
- Implement request deduplication
- Use HTTP/2 for multiplexing
- Implement GraphQL for flexible queries (future)

### ETL Performance

**Processing Strategy:**

- Stream processing for large files (avoid loading entire file in memory)
- Parallel processing for independent operations
- Batch database inserts (1000 rows at a time)
- Use COPY command for bulk inserts

**Resource Limits:**

- Max file size: 100 MB
- Max rows: 1 million
- Processing timeout: 5 minutes
- Memory limit: 512 MB per Edge Function

## Monitoring & Observability

### Metrics Collection

**Application Metrics:**

- Request rate, latency (p50, p95, p99)
- Error rate by endpoint
- Active users and sessions
- API quota usage

**Business Metrics:**

- Datasets uploaded per day
- AI queries per day
- Models trained per day
- Automation rules triggered

**Infrastructure Metrics:**

- Database connection pool usage
- Storage usage by workspace
- Edge Function invocations
- OpenAI API token usage

### Logging

**Log Levels:**

- ERROR: Application errors, exceptions
- WARN: Degraded performance, quota warnings
- INFO: User actions, API calls
- DEBUG: Detailed debugging information (dev only)

**Log Aggregation:**

- Vercel logs for API routes
- Supabase logs for Edge Functions
- Sentry for error tracking and alerting
- Custom log sink for audit logs

**Structured Logging Format:**

```typescript
interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  context: {
    userId?: string;
    workspaceId?: string;
    requestId: string;
    endpoint?: string;
    duration?: number;
  };
  error?: {
    name: string;
    message: string;
    stack: string;
  };
}
```

### Alerting

**Alert Channels:**

- Email for critical errors
- Slack for operational alerts
- PagerDuty for on-call incidents (future)

**Alert Rules:**

- Error rate > 5% for 5 minutes
- API latency p95 > 10s for 5 minutes
- Database connection pool > 90% for 2 minutes
- Storage quota > 90% for workspace
- ETL job failures > 3 in 1 hour
- OpenAI API errors > 10 in 5 minutes

### Health Checks

**Endpoints:**

- `GET /api/health` - Basic health check
- `GET /api/health/db` - Database connectivity
- `GET /api/health/storage` - Storage availability
- `GET /api/health/ai` - OpenAI API status

**Response Format:**

```typescript
interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: { status: string; latency: number };
    storage: { status: string; latency: number };
    ai: { status: string; latency: number };
  };
  version: string;
}
```

### Tracing (Future)

**Implementation:** OpenTelemetry

**Traced Operations:**

- API request lifecycle
- Database queries
- External API calls (OpenAI)
- ETL job execution
- Model training and inference

## Deployment Architecture

### Infrastructure Diagram

```mermaid
graph TB
    subgraph "Vercel Edge Network"
        CDN[CDN / Edge Cache]
        Edge[Edge Functions]
    end
    
    subgraph "Vercel Serverless"
        NextJS[Next.js App<br/>API Routes]
    end
    
    subgraph "Supabase Cloud"
        PG[(PostgreSQL<br/>Database)]
        Storage[Object Storage]
        EdgeFn[Edge Functions<br/>Deno Runtime]
        Auth[Auth Service]
    end
    
    subgraph "External Services"
        OpenAI[OpenAI API]
        Sentry[Sentry]
        Email[SendGrid/Resend]
    end
    
    Users --> CDN
    CDN --> NextJS
    NextJS --> Auth
    NextJS --> PG
    NextJS --> Storage
    NextJS --> OpenAI
    NextJS --> Sentry
    EdgeFn --> PG
    EdgeFn --> Storage
    EdgeFn --> Email
    EdgeFn --> OpenAI
```

### Environments

**Development:**

- Local Next.js dev server (`npm run dev`)
- Supabase local development (Docker)
- Mock OpenAI responses (optional)
- `.env.local` for secrets

**Staging:**

- Vercel preview deployments (per PR)
- Supabase staging project
- Real OpenAI API with test keys
- Automated E2E tests run on deploy

**Production:**

- Vercel production deployment
- Supabase production project
- Production OpenAI API keys
- Blue-green deployment strategy
- Automated rollback on health check failure

### CI/CD Pipeline

**GitHub Actions Workflow:**

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js
      - Install dependencies
      - Run linter (ESLint)
      - Run type check (TypeScript)
      - Run unit tests (Jest)
      - Run integration tests
      - Upload coverage to Codecov
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js
      - Build Next.js app
      - Verify build artifacts
  
  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - Deploy to Vercel staging
      - Run E2E tests (Playwright)
      - Run smoke tests
  
  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - Deploy to Vercel production
      - Run health checks
      - Notify team (Slack)
```

### Database Migrations

**Tool:** Supabase CLI + SQL migrations

**Migration Strategy:**

1. Create migration file: `supabase migration new <name>`
2. Write SQL in `supabase/migrations/<timestamp>_<name>.sql`
3. Test locally: `supabase db reset`
4. Apply to staging: `supabase db push --db-url <staging-url>`
5. Verify staging
6. Apply to production: `supabase db push --db-url <prod-url>`

**Migration Best Practices:**

- Always include rollback script
- Test with production-like data volume
- Use transactions for atomic changes
- Avoid breaking changes (use feature flags)
- Document schema changes in migration file

**Example Migration:**

```sql
-- Migration: Add PII consent column
-- Created: 2025-01-15

BEGIN;

-- Add column with default value
ALTER TABLE datasets 
ADD COLUMN pii_consent_given BOOLEAN DEFAULT FALSE;

-- Create index for filtering
CREATE INDEX idx_datasets_pii_consent 
ON datasets(pii_consent_given) 
WHERE pii_consent_given = TRUE;

COMMIT;

-- Rollback:
-- ALTER TABLE datasets DROP COLUMN pii_consent_given;
-- DROP INDEX idx_datasets_pii_consent;
```

### Backup & Disaster Recovery

**Backup Strategy:**

- Automated daily backups via Supabase (02:00 UTC)
- Point-in-time recovery (PITR) enabled
- Backup retention: 30 days
- Cross-region replication (future)
- **Backup Owner**: SRE/Database Administrator

**Recovery Procedures:**

**Scenario 1: Database Corruption**

1. Identify last known good backup (Owner: On-call DB Admin)
2. Restore from backup to staging (Owner: On-call DB Admin)
3. Verify data integrity (Owner: Backend Team Lead)
4. Promote staging to production (Owner: SRE with approval)
5. RTO: 4 hours, RPO: 24 hours

**Scenario 2: Accidental Data Deletion**

1. Query audit logs for deletion event
2. Restore specific table from backup
3. Merge with current data
4. Verify with user
5. RTO: 2 hours, RPO: 24 hours

**Scenario 3: Complete Service Outage**

1. Check Vercel and Supabase status pages
2. Activate incident response team
3. Communicate with users (status page)
4. Failover to backup region (future)
5. RTO: 4 hours

### Rollback Procedures

**Automated Rollback:**

- Triggered by failed health checks during deployment
- Vercel automatically reverts to previous deployment
- Database migrations NOT rolled back automatically

**Manual Rollback:**

1. Identify problematic deployment
2. Revert to previous version in Vercel dashboard
3. If database migration involved, run rollback script
4. Verify system health
5. Post-mortem analysis

## AI/ML Implementation Details

### Natural Language Query Processing

**Architecture:**

```mermaid
sequenceDiagram
    participant User
    participant API
    participant OpenAI
    participant DB
    
    User->>API: POST /api/ai/query {query, datasetId}
    API->>DB: Fetch dataset schema
    DB-->>API: {columns, types, sample_data}
    API->>OpenAI: Generate analysis plan
    OpenAI-->>API: {intent, operations, filters}
    API->>DB: Execute analysis query
    DB-->>API: Query results
    API->>OpenAI: Generate explanation
    OpenAI-->>API: {explanation, chart_config}
    API-->>User: {result, chart, explanation}
```

**Prompt Engineering:**

```typescript
const systemPrompt = `You are a data analysis assistant. Given a dataset schema and user query, generate:
1. Analysis intent (comparison, trend, aggregation, filter)
2. SQL-like operations to perform
3. Chart type recommendation
4. User-friendly explanation

Dataset Schema:
${JSON.stringify(schema, null, 2)}

Sample Data:
${JSON.stringify(sampleRows, null, 2)}

Respond in JSON format.`;

const userPrompt = `User query: "${query}"`;
```

**Response Parsing:**

- Extract structured JSON from OpenAI response
- Validate operations against dataset schema
- Execute safe operations (no DELETE, UPDATE, DROP)
- Generate chart configuration
- Return results with explanation

### Embeddings & Semantic Search (P2)

**Implementation:**

1. Generate embeddings for text columns using `text-embedding-3-small`
2. Store embeddings in PostgreSQL with `pgvector` extension
3. Enable semantic search for chatbot context retrieval

**Embedding Generation:**

```typescript
async function generateEmbeddings(datasetId: string) {
  const dataset = await getDataset(datasetId);
  const textColumns = dataset.columns.filter(c => c.type === 'string');
  
  for (const column of textColumns) {
    const rows = await getColumnData(datasetId, column.name);
    const embeddings = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: rows.map(r => r[column.name])
    });
    
    await storeEmbeddings(datasetId, column.name, embeddings.data);
  }
}
```

**Semantic Search:**

```sql
-- Find similar rows based on query embedding
SELECT 
  row_index,
  text_content,
  1 - (embedding <=> $1::vector) AS similarity
FROM dataset_embeddings
WHERE dataset_id = $2
ORDER BY embedding <=> $1::vector
LIMIT 10;
```

### ML Model Training (P2)

**Supported Models:**

- Classification: Random Forest, XGBoost, Logistic Regression
- Regression: Random Forest, XGBoost, Linear Regression

**Training Pipeline:**

```typescript
// Edge Function: model-trainer
async function trainModel(jobId: string) {
  const job = await getTrainingJob(jobId);
  const dataset = await getCleanedDataset(job.dataset_id);
  
  // Prepare data
  const X = dataset.data.map(row => 
    Object.entries(row)
      .filter(([key]) => key !== job.target_column)
      .map(([_, value]) => value)
  );
  const y = dataset.data.map(row => row[job.target_column]);
  
  // Train model (using Python subprocess or external service)
  const model = await trainSklearnModel({
    X, y,
    model_type: job.model_type,
    config: job.config
  });
  
  // Calculate metrics
  const metrics = await evaluateModel(model, X, y);
  
  // Save model artifact
  const artifactUrl = await saveModelArtifact(model, jobId);
  
  // Update job status
  await updateTrainingJob(jobId, {
    status: 'ready',
    metrics,
    artifact_url: artifactUrl
  });
}
```

**Model Serving:**

- Load pickled model from Storage
- Validate input features against training schema
- Make predictions
- Return results with confidence scores

### SHAP Explainability (P2)

**Implementation:**

```python
import shap
import pickle

def explain_prediction(model_path, features):
    # Load model
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    
    # Create explainer
    explainer = shap.TreeExplainer(model)
    
    # Calculate SHAP values
    shap_values = explainer.shap_values(features)
    
    # Return feature contributions
    return {
        'base_value': explainer.expected_value,
        'shap_values': shap_values.tolist(),
        'feature_names': model.feature_names_,
        'feature_values': features.tolist()
    }
```

**Visualization:**

- Waterfall chart showing feature contributions
- Force plot for individual predictions
- Summary plot for global feature importance

## Scalability Considerations

### Horizontal Scaling

**Stateless Design:**

- All API routes are stateless (no in-memory sessions)
- Use database for session storage
- Enable auto-scaling on Vercel (automatic)

**Database Scaling:**

- Supabase handles connection pooling
- Read replicas for analytics queries (future)
- Partitioning for large tables (future)

**Storage Scaling:**

- Supabase Storage auto-scales
- CDN for frequently accessed files
- Lifecycle policies for old datasets

### Vertical Scaling

**Edge Function Resources:**

- Memory: 512 MB (configurable up to 2 GB)
- Timeout: 5 minutes (configurable)
- CPU: Shared (Deno runtime)

**Database Resources:**

- Supabase Pro plan: 8 GB RAM, 2 CPU cores
- Upgrade to larger instance as needed
- Monitor connection pool usage

### Caching Layers

**Layer 1: Browser Cache**

- Static assets: 1 year
- API responses: 5 minutes (via React Query)

**Layer 2: CDN Cache (Vercel Edge)**

- Static pages: 1 hour
- API responses: Not cached (dynamic)

**Layer 3: Application Cache (Redis)**

- Dataset metadata: 5 minutes
- Dashboard configurations: 10 minutes
- User sessions: 7 days

**Layer 4: Database Cache**

- Query result cache: 5 minutes
- Materialized views: Refresh every 15 minutes

### Queue Management

**Background Jobs:**

- ETL processing: Supabase Edge Functions (async)
- Model training: Queue with max 10 concurrent jobs
- Automation evaluation: Scheduled every 5 minutes
- Email sending: Queue with retry logic

**Job Prioritization:**

1. High: User-initiated actions (upload, query)
2. Medium: Scheduled tasks (automation checks)
3. Low: Background maintenance (cleanup, archival)

## Future Enhancements

### Phase 7+ Features

**Real-time Collaboration:**

- Live dashboard updates via WebSockets
- Collaborative query building
- Shared cursors and annotations

**Advanced Analytics:**

- Predictive forecasting with time series models
- Anomaly detection algorithms
- Cohort analysis and retention metrics

**External Integrations:**

- Google Sheets sync
- Power BI connector
- Slack bot for queries
- Zapier integration

**Mobile App:**

- React Native mobile app
- Push notifications for alerts
- Offline dashboard viewing

**Enterprise Features:**

- SSO (SAML, OKTA)
- Custom branding
- Advanced audit logs
- SLA guarantees
- Dedicated support

## Design Decisions & Rationale

### Why Next.js?

- Server-side rendering for better SEO and initial load
- API routes eliminate need for separate backend
- Excellent TypeScript support
- Vercel deployment integration
- Large ecosystem and community

### Why Supabase?

- PostgreSQL with built-in auth and storage
- Row Level Security for data isolation
- Edge Functions for serverless compute
- Real-time subscriptions (future)
- Open source and self-hostable

### Why OpenAI API?

- State-of-the-art language understanding
- Reliable embeddings for semantic search
- Function calling for structured outputs
- Extensive documentation and support
- Cost-effective for MVP

### Why Recharts?

- React-native charting library
- Composable and customizable
- Good performance with large datasets
- Active maintenance
- TypeScript support

### Why Not GraphQL?

- REST is simpler for MVP
- Less overhead for small team
- Can migrate later if needed
- Next.js API routes work well with REST

### Why Not Microservices?

- Monolithic Next.js app is simpler
- Easier to develop and deploy
- Lower operational overhead
- Can split later if needed
- Supabase Edge Functions provide isolation

## Conclusion

This design provides a solid foundation for Biz Stratosphere 2.0, balancing simplicity with scalability. The architecture leverages modern serverless technologies to minimize operational overhead while maintaining flexibility for future enhancements. The phased approach allows for iterative development, starting with core features (P0) and progressively adding advanced capabilities (P1, P2).

Key strengths of this design:

- **Serverless-first** reduces infrastructure management
- **Security by default** with RLS and encryption
- **Scalable** architecture supports growth
- **Observable** with comprehensive monitoring
- **Testable** with clear testing strategy
- **Maintainable** with TypeScript and modern tooling

The design addresses all 22 requirements from the requirements document and provides clear implementation guidance for the development team.

## Appendix A: Detailed Architecture Artifacts

### A.1 Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ workspace_members : "belongs to"
    users ||--o{ datasets : "uploads"
    users ||--o{ automation_rules : "creates"
    users ||--o{ ai_conversations : "has"
    users ||--o{ ai_queries : "submits"
    users ||--o{ ml_models : "trains"
    users ||--o{ predictions : "requests"
    
    workspaces ||--o{ workspace_members : "has"
    workspaces ||--o{ datasets : "contains"
    workspaces ||--o{ automation_rules : "has"
    workspaces ||--o{ ai_conversations : "has"
    workspaces ||--o{ ml_models : "has"
    workspaces ||--o{ audit_logs : "tracks"
    
    datasets ||--o{ cleaned_datasets : "has"
    datasets ||--o{ automation_rules : "monitors"
    datasets ||--o{ ai_queries : "analyzes"
    datasets ||--o{ ml_models : "trains"
    datasets ||--o{ dataset_embeddings : "generates"
    
    automation_rules ||--o{ alerts : "triggers"
    
    ml_models ||--o{ predictions : "generates"
    
    users {
        uuid id PK
        string email
        string name
        string avatar_url
    }
    
    workspaces {
        uuid id PK
        string name
        text description
        uuid created_by FK
        int storage_quota_gb
        int prediction_quota_daily
        timestamptz created_at
    }
    
    workspace_members {
        uuid id PK
        uuid workspace_id FK
        uuid user_id FK
        enum role
        timestamptz joined_at
    }
    
    datasets {
        uuid id PK
        uuid workspace_id FK
        uuid uploaded_by FK
        string file_name
        string file_url
        bigint file_size_bytes
        int row_count
        jsonb columns
        enum status
        boolean pii_consent_given
        timestamptz created_at
    }
    
    cleaned_datasets {
        uuid id PK
        uuid dataset_id FK
        jsonb data
        jsonb quality_report
        timestamptz created_at
    }
    
    automation_rules {
        uuid id PK
        uuid workspace_id FK
        uuid dataset_id FK
        uuid created_by FK
        string name
        jsonb condition
        enum alert_channel
        jsonb alert_recipients
        boolean enabled
        timestamptz created_at
    }
    
    alerts {
        uuid id PK
        uuid rule_id FK
        timestamptz triggered_at
        jsonb condition_value
        boolean notification_sent
    }
    
    ai_conversations {
        uuid id PK
        uuid workspace_id FK
        uuid user_id FK
        jsonb messages
        timestamptz created_at
    }
    
    ai_queries {
        uuid id PK
        uuid dataset_id FK
        uuid user_id FK
        text query_text
        jsonb result
        int tokens_used
        timestamptz created_at
    }
    
    ml_models {
        uuid id PK
        uuid dataset_id FK
        uuid workspace_id FK
        uuid created_by FK
        string name
        enum model_type
        string artifact_url
        jsonb metrics
        enum status
        timestamptz created_at
    }
    
    predictions {
        uuid id PK
        uuid model_id FK
        uuid user_id FK
        jsonb input_features
        jsonb prediction_value
        float confidence
        timestamptz created_at
    }
    
    dataset_embeddings {
        uuid id PK
        uuid dataset_id FK
        int row_index
        string column_name
        text text_content
        vector embedding
        timestamptz created_at
    }
    
    audit_logs {
        uuid id PK
        uuid workspace_id FK
        uuid user_id FK
        string action
        string resource_type
        uuid resource_id
        jsonb metadata
        timestamptz created_at
    }
```

### A.2 Critical Flow Sequence Diagrams

#### Upload → ETL → Ready Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant API as Next.js API
    participant Storage as Supabase Storage
    participant DB as PostgreSQL
    participant ETL as ETL Edge Function
    
    User->>UI: Upload CSV file
    UI->>UI: Validate file type & size
    UI->>API: POST /api/datasets/upload
    API->>DB: Create dataset record (status: uploading)
    API->>Storage: Upload file
    Storage-->>API: file_url
    API->>DB: Update dataset (file_url, status: processing)
    API->>ETL: Trigger ETL function (async)
    API-->>UI: {datasetId, status: processing}
    UI-->>User: Show processing indicator
    
    ETL->>Storage: Download file
    Storage-->>ETL: file content
    ETL->>ETL: Parse CSV
    ETL->>ETL: Detect PII columns
    
    alt PII Detected & No Consent
        ETL->>DB: Update dataset (status: ready, columns with PII flags)
        ETL->>UI: Notify user (WebSocket/polling)
        UI-->>User: Request PII consent
    else No PII or Consent Given
        ETL->>ETL: Clean data (missing values, types, duplicates)
        ETL->>ETL: Generate quality report
        ETL->>DB: Insert cleaned_datasets
        ETL->>DB: Update dataset (status: ready, row_count, columns)
        ETL->>UI: Notify user (WebSocket/polling)
        UI-->>User: Show preview & quality report
    end
    
    alt ETL Fails
        ETL->>DB: Update dataset (status: failed, error_message)
        ETL->>UI: Notify user
        UI-->>User: Show error with retry option
    end
```

#### AI Query Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant API as /api/ai/query
    participant DB as PostgreSQL
    participant OpenAI
    participant Cache as Redis
    
    User->>UI: Enter query "What's the average revenue?"
    UI->>API: POST /api/ai/query {datasetId, query}
    API->>API: Check rate limit (100 req/min)
    
    alt Rate Limit Exceeded
        API-->>UI: 429 Rate Limit Exceeded
        UI-->>User: Show error with retry time
    else Within Limit
        API->>Cache: Check cache for similar query
        
        alt Cache Hit
            Cache-->>API: Cached result
            API-->>UI: Return cached result
        else Cache Miss
            API->>DB: Fetch dataset schema & sample rows
            DB-->>API: {columns, types, sample_data}
            
            API->>OpenAI: Generate analysis plan
            Note over API,OpenAI: Prompt: schema + query
            OpenAI-->>API: {intent, operations, filters}
            
            API->>DB: Execute analysis query
            DB-->>API: Query results
            
            API->>OpenAI: Generate explanation & chart config
            OpenAI-->>API: {explanation, chart_type, config}
            
            API->>DB: Log query (ai_queries table)
            API->>Cache: Store result (5 min TTL)
            API-->>UI: {result, chart, explanation}
        end
        
        UI-->>User: Display chart & explanation
    end
    
    alt OpenAI Error
        OpenAI-->>API: 503 Service Unavailable
        API->>API: Retry with exponential backoff (max 3)
        alt Retry Succeeds
            OpenAI-->>API: Success
        else All Retries Fail
            API-->>UI: 503 AI Service Error
            UI-->>User: Show error with fallback options
        end
    end
```

#### Automation Rule Evaluation Flow

```mermaid
sequenceDiagram
    participant Cron as pg_cron Scheduler
    participant Evaluator as automation-evaluator
    participant DB as PostgreSQL
    participant Email as Email Service
    participant Slack
    
    Cron->>Evaluator: Trigger every 5 minutes
    Evaluator->>DB: Fetch active automation rules
    DB-->>Evaluator: List of rules
    
    loop For Each Rule
        Evaluator->>DB: Fetch latest dataset data
        DB-->>Evaluator: Dataset rows
        
        Evaluator->>Evaluator: Evaluate condition
        Note over Evaluator: e.g., AVG(revenue) < threshold
        
        alt Condition Met
            Evaluator->>DB: Check if alert already sent (last 1 hour)
            
            alt Not Recently Alerted
                Evaluator->>DB: Create alert record
                
                alt Email Channel
                    Evaluator->>Email: Send alert email
                    Email-->>Evaluator: Success/Failure
                else Slack Channel
                    Evaluator->>Slack: Post to webhook
                    Slack-->>Evaluator: Success/Failure
                end
                
                Evaluator->>DB: Update alert (notification_sent: true)
            else Recently Alerted
                Evaluator->>Evaluator: Skip (avoid spam)
            end
        else Condition Not Met
            Evaluator->>Evaluator: Continue to next rule
        end
    end
    
    Evaluator->>DB: Log evaluation run
```

### A.3 Database Migration Plan

**Migration Ordering:**

```
Phase 0: Foundation
├── 001_enable_extensions.sql (uuid-ossp, pgvector)
├── 002_create_workspaces.sql
├── 003_create_workspace_members.sql
└── 004_create_audit_logs.sql

Phase 1: Data Upload
├── 005_create_datasets.sql
├── 006_create_cleaned_datasets.sql
└── 007_add_rls_policies_datasets.sql

Phase 2: ETL & Quality
├── 008_add_quality_report_columns.sql
└── 009_create_etl_job_tracking.sql

Phase 3: Dashboards
└── 010_create_dashboard_configs.sql (future)

Phase 4: AI Queries
├── 011_create_ai_queries.sql
├── 012_create_ai_conversations.sql
└── 013_add_indexes_ai_tables.sql

Phase 5: Automation
├── 014_create_automation_rules.sql
├── 015_create_alerts.sql
└── 016_setup_pg_cron.sql

Phase 6: ML Models (P2)
├── 017_create_ml_models.sql
├── 018_create_predictions.sql
├── 019_create_dataset_embeddings.sql
└── 020_add_vector_indexes.sql
```

**Sample Migration File:**

```sql
-- Migration: 005_create_datasets.sql
-- Description: Create datasets table with PII tracking
-- Phase: 1
-- Dependencies: 002_create_workspaces.sql

BEGIN;

CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
  row_count INTEGER,
  column_count INTEGER,
  columns JSONB,
  status TEXT NOT NULL CHECK (status IN ('uploading', 'processing', 'ready', 'failed', 'deleted')) DEFAULT 'uploading',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  pii_consent_given BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_datasets_workspace ON datasets(workspace_id);
CREATE INDEX idx_datasets_status ON datasets(status) WHERE status != 'deleted';
CREATE INDEX idx_datasets_uploaded_by ON datasets(uploaded_by);
CREATE INDEX idx_datasets_created ON datasets(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_datasets_updated_at
  BEFORE UPDATE ON datasets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Rollback:
-- DROP TRIGGER IF EXISTS update_datasets_updated_at ON datasets;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP TABLE IF EXISTS datasets CASCADE;
```

### A.4 OpenAPI Specification (Core Endpoints)

```yaml
openapi: 3.0.3
info:
  title: Biz Stratosphere 2.0 API
  version: 1.0.0
  description: AI-Powered Business Intelligence Platform API

servers:
  - url: https://api.bizstratosphere.com/v1
    description: Production
  - url: https://staging-api.bizstratosphere.com/v1
    description: Staging

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  
  schemas:
    Error:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: object
            requestId:
              type: string
        status:
          type: integer
    
    Dataset:
      type: object
      properties:
        id:
          type: string
          format: uuid
        workspace_id:
          type: string
          format: uuid
        file_name:
          type: string
        file_size_bytes:
          type: integer
        row_count:
          type: integer
        column_count:
          type: integer
        columns:
          type: array
          items:
            type: object
            properties:
              name:
                type: string
              type:
                type: string
                enum: [string, number, date, boolean]
              hasPII:
                type: boolean
        status:
          type: string
          enum: [uploading, processing, ready, failed, deleted]
        created_at:
          type: string
          format: date-time
    
    AIQueryRequest:
      type: object
      required:
        - datasetId
        - query
      properties:
        datasetId:
          type: string
          format: uuid
        query:
          type: string
          minLength: 3
          maxLength: 500
        conversationId:
          type: string
          format: uuid
    
    AIQueryResponse:
      type: object
      properties:
        result:
          type: object
          properties:
            type:
              type: string
              enum: [text, chart, table]
            data:
              type: object
            chartConfig:
              type: object
            explanation:
              type: string
        tokensUsed:
          type: integer
        latencyMs:
          type: integer

security:
  - bearerAuth: []

paths:
  /auth/signup:
    post:
      summary: Create new user account
      tags: [Authentication]
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password, name]
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
                name:
                  type: string
      responses:
        '201':
          description: User created successfully
        '400':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
  
  /auth/login:
    post:
      summary: Authenticate user
      tags: [Authentication]
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    type: object
                  session:
                    type: object
                  token:
                    type: string
        '401':
          description: Invalid credentials
  
  /datasets:
    get:
      summary: List datasets
      tags: [Datasets]
      parameters:
        - name: workspaceId
          in: query
          required: true
          schema:
            type: string
            format: uuid
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
      responses:
        '200':
          description: List of datasets
          content:
            application/json:
              schema:
                type: object
                properties:
                  datasets:
                    type: array
                    items:
                      $ref: '#/components/schemas/Dataset'
                  total:
                    type: integer
                  page:
                    type: integer
    
    post:
      summary: Upload dataset
      tags: [Datasets]
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: [file, workspaceId]
              properties:
                file:
                  type: string
                  format: binary
                workspaceId:
                  type: string
                  format: uuid
      responses:
        '201':
          description: Dataset upload initiated
          content:
            application/json:
              schema:
                type: object
                properties:
                  datasetId:
                    type: string
                    format: uuid
                  status:
                    type: string
        '413':
          description: File too large
        '415':
          description: Unsupported file format
  
  /datasets/{id}:
    get:
      summary: Get dataset details
      tags: [Datasets]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Dataset details
          content:
            application/json:
              schema:
                type: object
                properties:
                  dataset:
                    $ref: '#/components/schemas/Dataset'
                  preview:
                    type: array
                    items:
                      type: object
                  stats:
                    type: object
        '404':
          description: Dataset not found
    
    delete:
      summary: Delete dataset
      tags: [Datasets]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Dataset marked for deletion
        '403':
          description: Insufficient permissions
  
  /ai/query:
    post:
      summary: Submit AI query
      tags: [AI]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AIQueryRequest'
      responses:
        '200':
          description: Query result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AIQueryResponse'
        '429':
          description: Rate limit exceeded
        '503':
          description: AI service unavailable
  
  /ai/chat:
    post:
      summary: Chat with AI assistant
      tags: [AI]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [workspaceId, message]
              properties:
                workspaceId:
                  type: string
                  format: uuid
                message:
                  type: string
                conversationId:
                  type: string
                  format: uuid
      responses:
        '200':
          description: AI response
          content:
            application/json:
              schema:
                type: object
                properties:
                  reply:
                    type: string
                  conversationId:
                    type: string
                    format: uuid
                  sources:
                    type: array
                    items:
                      type: object
  
  /automation/rules:
    get:
      summary: List automation rules
      tags: [Automation]
      parameters:
        - name: workspaceId
          in: query
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: List of rules
    
    post:
      summary: Create automation rule
      tags: [Automation]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [datasetId, name, condition, alertChannel, alertRecipients]
              properties:
                datasetId:
                  type: string
                  format: uuid
                name:
                  type: string
                condition:
                  type: object
                  properties:
                    field:
                      type: string
                    operator:
                      type: string
                      enum: [gt, lt, eq, gte, lte, contains]
                    value:
                      oneOf:
                        - type: string
                        - type: number
                alertChannel:
                  type: string
                  enum: [email, slack]
                alertRecipients:
                  type: array
                  items:
                    type: string
      responses:
        '201':
          description: Rule created
  
  /dashboards/{datasetId}:
    get:
      summary: Get dashboard data
      tags: [Dashboards]
      parameters:
        - name: datasetId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Dashboard configuration and data
  
  /health:
    get:
      summary: Health check
      tags: [System]
      security: []
      responses:
        '200':
          description: System healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    enum: [healthy, degraded, unhealthy]
                  timestamp:
                    type: string
                    format: date-time
                  checks:
                    type: object
```

### A.5 Component/Service Responsibility Matrix

| Feature/API | Component Type | Owner Service | Technology | Priority | Notes |
|-------------|---------------|---------------|------------|----------|-------|
| **Authentication** |
| Signup/Login | API Route | Next.js | `/api/auth/*` | P0 | Delegates to Supabase Auth |
| Session Management | Middleware | Next.js | `middleware.ts` | P0 | JWT validation |
| OAuth (Google) | External | Supabase | Auth provider | P0 | Configured in Supabase |
| **Data Upload** |
| File Upload UI | Component | Next.js | `DatasetUploader.tsx` | P0 | Client-side validation |
| Upload API | API Route | Next.js | `/api/datasets/upload` | P0 | Proxies to Storage |
| File Storage | Storage | Supabase | Storage bucket | P0 | Managed service |
| **ETL Pipeline** |
| ETL Processing | Edge Function | Supabase | `etl-processor` | P0 | Deno runtime |
| Data Cleaning | Library | Supabase | Python/Deno | P0 | In Edge Function |
| PII Detection | Library | Supabase | Regex patterns | P1 | In Edge Function |
| Quality Report | Edge Function | Supabase | `etl-processor` | P1 | Generated during ETL |
| **Dashboards** |
| Dashboard UI | Component | Next.js | `DashboardGrid.tsx` | P0 | Client-side rendering |
| Chart Rendering | Component | Next.js | Recharts library | P0 | Client-side |
| KPI Calculation | API Route | Next.js | `/api/dashboards/*` | P0 | Server-side aggregation |
| PDF Export | API Route | Next.js | `/api/dashboards/export` | P1 | Puppeteer/jsPDF |
| **AI Queries** |
| Query Input UI | Component | Next.js | `AIQueryBox.tsx` | P1 | Client-side |
| Query Processing | API Route | Next.js | `/api/ai/query` | P1 | Orchestrates OpenAI |
| OpenAI Integration | External | OpenAI | GPT-4 API | P1 | Managed service |
| Query Caching | Cache | Redis/Upstash | Redis | P1 | 5 min TTL |
| Rate Limiting | Middleware | Next.js | Upstash Rate Limit | P1 | Per-user limits |
| **Automation** |
| Rule Builder UI | Component | Next.js | `AutomationRuleBuilder.tsx` | P1 | Client-side |
| Rule CRUD API | API Route | Next.js | `/api/automation/rules` | P1 | Database operations |
| Rule Evaluation | Edge Function | Supabase | `automation-evaluator` | P1 | Scheduled (pg_cron) |
| Email Alerts | External | SendGrid/Resend | Email API | P1 | Managed service |
| Slack Alerts | External | Slack | Webhook | P1 | Configured by user |
| **Workspaces** |
| Workspace UI | Component | Next.js | `WorkspaceSelector.tsx` | P1 | Client-side |
| Workspace API | API Route | Next.js | `/api/workspaces/*` | P1 | Database operations |
| Member Management | API Route | Next.js | `/api/workspaces/members` | P1 | Invitations |
| RBAC Enforcement | Database | Supabase | RLS policies | P0 | Row Level Security |
| **AI Chatbot** |
| Chat Widget UI | Component | Next.js | `ChatWidget.tsx` | P2 | Client-side |
| Chat API | API Route | Next.js | `/api/ai/chat` | P2 | Orchestrates OpenAI |
| Embeddings Generation | Edge Function | Supabase | `embedding-generator` | P2 | OpenAI embeddings |
| Vector Search | Database | Supabase | pgvector extension | P2 | Semantic search |
| **ML Models** |
| Model Training UI | Component | Next.js | `ModelTrainer.tsx` | P2 | Client-side |
| Training API | API Route | Next.js | `/api/models/train` | P2 | Job creation |
| Training Job | Edge Function | Supabase | `model-trainer` | P2 | Python/scikit-learn |
| Model Storage | Storage | Supabase | Storage bucket | P2 | Pickle files |
| Prediction API | API Route | Next.js | `/api/models/predict` | P2 | Load & predict |
| SHAP Explainability | API Route | Next.js | `/api/models/explain` | P2 | Python/SHAP |
| **Monitoring** |
| Error Tracking | External | Sentry | Sentry SDK | P1 | Managed service |
| Logging | Platform | Vercel/Supabase | Native logs | P1 | Managed service |
| Metrics | External | Vercel Analytics | Analytics | P1 | Managed service |
| Health Checks | API Route | Next.js | `/api/health` | P0 | Custom endpoints |
| **Infrastructure** |
| Frontend Hosting | Platform | Vercel | Edge Network | P0 | Managed service |
| Database | Database | Supabase | PostgreSQL | P0 | Managed service |
| CI/CD | Platform | GitHub Actions | Workflows | P0 | `.github/workflows` |
| Secrets Management | Platform | Vercel/Supabase | Env vars | P0 | Managed service |

**On-Call Responsibilities:**

- **P0 Issues**: Full team response (auth, upload, dashboard, database)
- **P1 Issues**: Feature team response (AI, automation, workspaces)
- **P2 Issues**: Best-effort response (chatbot, ML models)

### A.6 Security & Compliance Architecture

#### Data Flow for PII Handling

```mermaid
flowchart TD
    A[User Uploads Dataset] --> B{File Validation}
    B -->|Invalid| C[Reject Upload]
    B -->|Valid| D[Store in Supabase Storage]
    D --> E[Trigger ETL Function]
    E --> F[Parse & Analyze Columns]
    F --> G{PII Detected?}
    
    G -->|No PII| H[Clean & Process Data]
    H --> I[Store in cleaned_datasets]
    I --> J[Mark Dataset as Ready]
    
    G -->|PII Found| K[Flag PII Columns]
    K --> L[Mark Dataset as Ready with PII Flag]
    L --> M[Notify User - Request Consent]
    M --> N{User Grants Consent?}
    
    N -->|No| O[Dataset Available - No Embeddings]
    N -->|Yes| P[Update pii_consent_given = true]
    P --> Q[Trigger Embedding Generation]
    Q --> R[Generate Embeddings for Text Columns]
    R --> S[Store in dataset_embeddings]
    S --> T[Enable AI Chatbot Features]
    
    O --> U[User Can Query & Visualize]
    T --> U
    
    V[User Requests Deletion] --> W[Soft Delete Dataset]
    W --> X[Schedule File Deletion - 24hrs]
    X --> Y[Schedule Embedding Deletion - 30 days]
    Y --> Z[Schedule Model Artifact Deletion - 30 days]
    Z --> AA[Log Deletion in Audit Trail]
```

#### Compliance Checklist

**GDPR Compliance:**

- [ ] Right to Access: Users can export all their data via `/api/workspaces/:id/export`
- [ ] Right to Deletion: Users can delete datasets, embeddings removed within 30 days
- [ ] Right to Rectification: Users can re-upload corrected datasets
- [ ] Data Minimization: Only collect necessary data (no tracking beyond usage)
- [ ] Consent Management: Explicit consent required for PII processing and embeddings
- [ ] Data Portability: Export in machine-readable CSV format
- [ ] Breach Notification: Sentry alerts + manual notification process
- [ ] Privacy by Design: RLS policies, encryption at rest/transit
- [ ] Data Processing Agreement: Required for enterprise customers
- [ ] Audit Logs: 90-day retention for compliance reporting

**Data Retention Policy:**

| Data Type | Retention Period | Deletion Method | Notes |
|-----------|------------------|-----------------|-------|
| Dataset Files | Until user deletes + 24hrs | Permanent deletion from Storage | Soft delete first |
| Cleaned Data | Until user deletes + 24hrs | Permanent deletion from DB | Cascade delete |
| Embeddings | Until user deletes + 30 days | Permanent deletion from DB | Grace period for rollback |
| Model Artifacts | 30 days after training | Permanent deletion from Storage | Keep for rollback |
| Audit Logs | 90 days | Automatic deletion | Compliance requirement |
| AI Query Logs | 90 days | Automatic deletion | Analytics only |
| User Sessions | 7 days | Automatic expiration | JWT expiry |
| Backup Snapshots | 30 days | Automatic deletion | Point-in-time recovery |

**Encryption Standards:**

- **At Rest**: AES-256 (Supabase default)
- **In Transit**: TLS 1.3 (HTTPS only)
- **PII Columns**: Additional application-level encryption (future)
- **API Keys**: Stored in Vercel/Supabase secrets, never in code
- **JWT Tokens**: HS256 signing, 7-day expiry, refresh token rotation

### A.7 Observability & SLO Playbook

#### Service Level Objectives (SLOs)

| Service | SLO Metric | Target | Measurement Window | Alert Threshold |
|---------|------------|--------|-------------------|-----------------|
| **Platform Availability** | Uptime | 99.9% | 30 days | < 99.5% for 1 hour |
| **API Latency (Non-AI)** | p95 latency | < 500ms | 5 minutes | > 1s for 5 min |
| **AI Query Latency** | p95 latency | < 8s | 5 minutes | > 12s for 5 min |
| **Dashboard Load Time** | p95 load time | < 2s | 5 minutes | > 4s for 5 min |
| **ETL Processing** | Success rate | > 95% | 1 hour | < 90% for 15 min |
| **Error Rate** | Error percentage | < 1% | 5 minutes | > 5% for 5 min |
| **Database Queries** | p95 latency | < 100ms | 5 minutes | > 500ms for 5 min |
| **Storage Operations** | Success rate | > 99% | 1 hour | < 95% for 15 min |

#### Alert Configuration

**Critical Alerts (PagerDuty/Phone):**

```yaml
- name: Platform Down
  condition: uptime < 99% for 5 minutes
  severity: critical
  channels: [pagerduty, slack]
  
- name: Database Unreachable
  condition: db_connection_errors > 10 in 1 minute
  severity: critical
  channels: [pagerduty, slack]
  
- name: High Error Rate
  condition: error_rate > 10% for 5 minutes
  severity: critical
  channels: [pagerduty, slack]
```

**Warning Alerts (Slack):**

```yaml
- name: Elevated Latency
  condition: p95_latency > 1s for 10 minutes
  severity: warning
  channels: [slack]
  
- name: ETL Failures
  condition: etl_failures > 5 in 1 hour
  severity: warning
  channels: [slack]
  
- name: Storage Quota Warning
  condition: workspace_storage > 90% of quota
  severity: warning
  channels: [slack, email]
  
- name: OpenAI API Errors
  condition: openai_errors > 10 in 5 minutes
  severity: warning
  channels: [slack]
```

**Info Alerts (Email):**

```yaml
- name: Daily Usage Report
  schedule: daily at 09:00 UTC
  severity: info
  channels: [email]
  
- name: Weekly Cost Report
  schedule: weekly on Monday
  severity: info
  channels: [email]
```

#### Runbooks

**Runbook 1: ETL Job Failure**

**Symptoms:**

- Dataset stuck in "processing" status
- Error message in dataset record
- Alert: "ETL Failures > 5 in 1 hour"

**Diagnosis:**

1. Check Supabase Edge Function logs: `supabase functions logs etl-processor`
2. Identify error type: parsing error, memory limit, timeout, database error
3. Check dataset file: size, format, corruption

**Resolution:**

- **Parsing Error**: Invalid CSV format → Notify user, provide error details
- **Memory Limit**: File too large → Increase function memory or implement streaming
- **Timeout**: Processing too slow → Optimize code or increase timeout
- **Database Error**: Connection issue → Check Supabase status, retry job

**Prevention:**

- Add file validation before upload
- Implement streaming for large files
- Add retry logic with exponential backoff

---

**Runbook 2: High AI Query Latency**

**Symptoms:**

- AI queries taking > 12s (p95)
- User complaints about slow responses
- Alert: "AI Query Latency > 12s for 5 min"

**Diagnosis:**

1. Check OpenAI API status: <https://status.openai.com>
2. Check rate limiting: Are we hitting OpenAI limits?
3. Check cache hit rate: Is Redis cache working?
4. Check database query performance: Slow dataset fetches?

**Resolution:**

- **OpenAI Outage**: Display user-friendly error, implement fallback
- **Rate Limiting**: Implement queue, increase OpenAI tier
- **Cache Miss**: Verify Redis connection, check TTL settings
- **Slow DB**: Optimize queries, add indexes

**Prevention:**

- Implement circuit breaker for OpenAI API
- Increase cache TTL for popular queries
- Pre-compute common aggregations

---

**Runbook 3: Compromised API Key**

**Symptoms:**

- Unusual API usage patterns
- Unauthorized access attempts
- Security alert from Sentry

**Immediate Actions:**

1. Rotate compromised API key immediately
2. Revoke all active sessions for affected users
3. Check audit logs for unauthorized access
4. Notify affected users

**Investigation:**

1. Identify source of compromise (code leak, phishing, etc.)
2. Review recent code changes and deployments
3. Check for data exfiltration in audit logs

**Recovery:**

1. Generate new API keys
2. Update environment variables in Vercel/Supabase
3. Deploy updated configuration
4. Monitor for continued suspicious activity

**Prevention:**

- Implement API key rotation policy (90 days)
- Use secret scanning in GitHub
- Implement IP allowlisting for admin operations
- Enable 2FA for all team members

### A.8 Cost & Sizing Estimation

#### Monthly Cost Estimates

**Small Team (10 users, 50 datasets, 1000 AI queries/month):**

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| Vercel | Pro | $20/month | Includes 100GB bandwidth |
| Supabase | Pro | $25/month | 8GB database, 100GB storage |
| OpenAI API | Pay-as-you-go | ~$50/month | ~500K tokens (GPT-4-mini) |
| Upstash Redis | Free | $0 | 10K requests/day |
| SendGrid | Free | $0 | 100 emails/day |
| Sentry | Developer | $26/month | 5K errors/month |
| **Total** | | **~$121/month** | |

**Medium Team (50 users, 500 datasets, 10K AI queries/month):**

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| Vercel | Pro | $20/month | May need additional bandwidth |
| Supabase | Pro | $25/month | May need storage add-on |
| Supabase Storage | Add-on | $10/month | +100GB storage |
| OpenAI API | Pay-as-you-go | ~$300/month | ~3M tokens |
| Upstash Redis | Pay-as-you-go | $10/month | 100K requests/day |
| SendGrid | Essentials | $20/month | 50K emails/month |
| Sentry | Team | $80/month | 50K errors/month |
| **Total** | | **~$465/month** | |

**Enterprise (500 users, 5K datasets, 100K AI queries/month):**

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| Vercel | Enterprise | $500/month | Custom bandwidth, SLA |
| Supabase | Team | $599/month | Dedicated resources |
| Supabase Storage | Add-on | $100/month | +1TB storage |
| OpenAI API | Pay-as-you-go | ~$2000/month | ~20M tokens |
| Upstash Redis | Pro | $80/month | 1M requests/day |
| SendGrid | Pro | $90/month | 1.5M emails/month |
| Sentry | Business | $299/month | 500K errors/month |
| **Total** | | **~$3,668/month** | |

#### Resource Sizing Guidelines

**Database Sizing:**

- **Small**: 8GB RAM, 2 CPU cores (Supabase Pro)
  - Supports: 100 concurrent connections, 500 datasets, 10M rows
- **Medium**: 16GB RAM, 4 CPU cores (Supabase Team)
  - Supports: 200 concurrent connections, 5K datasets, 100M rows
- **Large**: 32GB RAM, 8 CPU cores (Supabase Enterprise)
  - Supports: 500 concurrent connections, 50K datasets, 1B rows

**Storage Sizing:**

- Average dataset size: 5MB (CSV)
- Cleaned dataset overhead: 2x original size
- Embeddings overhead: 1KB per row (for text columns)
- Model artifacts: 10-50MB per model

**Example Calculation (500 datasets):**

```
Raw files: 500 × 5MB = 2.5GB
Cleaned data: 2.5GB × 2 = 5GB
Embeddings: 500 datasets × 10K rows × 1KB = 5GB
Models: 50 models × 30MB = 1.5GB
Total: ~14GB storage needed
```

**Compute Sizing:**

- **ETL Processing**: 512MB memory, 5 min timeout (handles up to 1M rows)
- **AI Queries**: 1GB memory, 30s timeout (handles complex queries)
- **Model Training**: 2GB memory, 15 min timeout (handles up to 100K rows)

**Bandwidth Estimates:**

- Dashboard page load: ~500KB (including charts)
- Dataset upload: Average 5MB per upload
- Dataset download: Average 5MB per download
- API calls: Average 10KB per request

**Example Calculation (Medium Team):**

```
Monthly page views: 50 users × 100 views = 5,000 views
Dashboard bandwidth: 5,000 × 500KB = 2.5GB
Uploads: 100 uploads × 5MB = 500MB
Downloads: 50 downloads × 5MB = 250MB
API calls: 50K calls × 10KB = 500MB
Total: ~3.75GB/month (well within Vercel Pro limits)
```

#### Cost Optimization Strategies

**Reduce OpenAI Costs:**

- Use GPT-4-mini instead of GPT-4 (10x cheaper)
- Implement aggressive caching (5-10 min TTL)
- Batch similar queries
- Use embeddings for semantic search instead of full queries
- Implement query result reuse

**Reduce Storage Costs:**

- Implement data lifecycle policies (archive old datasets)
- Compress cleaned datasets (gzip)
- Delete unused embeddings
- Implement storage quotas per workspace

**Reduce Compute Costs:**

- Optimize Edge Functions (reduce cold starts)
- Implement connection pooling
- Use database indexes effectively
- Cache frequently accessed data
- Implement lazy loading for dashboards

**Reduce Bandwidth Costs:**

- Implement CDN caching
- Compress API responses (gzip/brotli)
- Use pagination for large datasets
- Implement image optimization
- Lazy load chart components

#### Scaling Triggers

**When to upgrade Supabase:**

- Database CPU > 80% for sustained periods
- Connection pool > 90% utilized
- Storage > 80% of quota
- Query latency p95 > 500ms

**When to upgrade Vercel:**

- Bandwidth > 80% of quota
- Function invocations > 80% of quota
- Build minutes exhausted
- Need custom SLA

**When to optimize OpenAI usage:**

- Monthly cost > $500
- Rate limits frequently hit
- Query latency > 10s consistently
- Cache hit rate < 50%

## Appendix B: Implementation Details & Clarifications

### B.1 Authentication & Authorization Details

**JWT Token Format:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Payload:**

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "analyst",
  "workspace_id": "workspace-uuid",
  "iat": 1234567890,
  "exp": 1234654290
}
```

**Refresh Token Flow:**

1. Client sends expired access token + refresh token to `/api/auth/refresh`
2. Server validates refresh token
3. Server issues new access token + rotates refresh token
4. Client stores new tokens
5. Refresh tokens are single-use and invalidated after rotation

**Error Response Examples:**

```json
// 401 Unauthorized
{
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Authentication required. Please log in.",
    "requestId": "req_abc123"
  },
  "status": 401
}

// 403 Forbidden
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource.",
    "details": {
      "required_role": "admin",
      "user_role": "viewer"
    },
    "requestId": "req_def456"
  },
  "status": 403
}
```

### B.2 OpenAPI Common Schemas

```yaml
components:
  schemas:
    Pagination:
      type: object
      properties:
        page:
          type: integer
          minimum: 1
        limit:
          type: integer
          minimum: 1
          maximum: 100
        total:
          type: integer
        totalPages:
          type: integer
    
    UploadStatus:
      type: string
      enum:
        - uploading
        - processing
        - ready
        - failed
        - deleted
      description: |
        - uploading: File is being uploaded to storage
        - processing: ETL pipeline is cleaning and analyzing data
        - ready: Dataset is ready for use
        - failed: ETL processing failed, see error_message
        - deleted: Dataset marked for deletion
    
    ErrorResponse:
      type: object
      required:
        - error
        - status
      properties:
        error:
          type: object
          required:
            - code
            - message
            - requestId
          properties:
            code:
              type: string
              example: VALIDATION_ERROR
            message:
              type: string
              example: Invalid request parameters
            details:
              type: object
            requestId:
              type: string
              example: req_abc123
        status:
          type: integer
          example: 400
```

### B.3 Database Migration Rollback Strategy

**Migration Best Practices:**

1. **Always include rollback script** in migration file comments
2. **Use feature flags** for schema changes that affect application code
3. **Test rollback** on staging before production deployment
4. **Document dependencies** between migrations

**Multi-Step Migration Example:**

```sql
-- Migration: 021_add_dataset_tags.sql
-- Description: Add tagging support for datasets
-- Dependencies: 005_create_datasets.sql
-- Feature Flag: ENABLE_DATASET_TAGS

BEGIN;

-- Step 1: Create tags table
CREATE TABLE dataset_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dataset_id, tag)
);

-- Step 2: Create index
CREATE INDEX idx_dataset_tags_dataset ON dataset_tags(dataset_id);
CREATE INDEX idx_dataset_tags_tag ON dataset_tags(tag);

-- Step 3: Add trigger for tag validation
CREATE OR REPLACE FUNCTION validate_tag()
RETURNS TRIGGER AS $$
BEGIN
  IF LENGTH(NEW.tag) < 2 OR LENGTH(NEW.tag) > 50 THEN
    RAISE EXCEPTION 'Tag must be between 2 and 50 characters';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_dataset_tag
  BEFORE INSERT OR UPDATE ON dataset_tags
  FOR EACH ROW
  EXECUTE FUNCTION validate_tag();

COMMIT;

-- Rollback Script (run in reverse order):
-- BEGIN;
-- DROP TRIGGER IF EXISTS validate_dataset_tag ON dataset_tags;
-- DROP FUNCTION IF EXISTS validate_tag();
-- DROP INDEX IF EXISTS idx_dataset_tags_tag;
-- DROP INDEX IF EXISTS idx_dataset_tags_dataset;
-- DROP TABLE IF EXISTS dataset_tags CASCADE;
-- COMMIT;

-- Rollback Owner: Database Administrator
-- Rollback Testing: Required on staging with production-like data
```

**Non-Backward-Compatible Changes:**

For breaking schema changes (e.g., renaming columns, changing types):

1. **Phase 1**: Add new column alongside old column
2. **Phase 2**: Deploy application code that writes to both columns
3. **Phase 3**: Backfill data from old to new column
4. **Phase 4**: Deploy application code that reads from new column
5. **Phase 5**: Remove old column (after verification period)

**Feature Flag Integration:**

```typescript
// lib/featureFlags.ts
export const FEATURE_FLAGS = {
  ENABLE_DATASET_TAGS: process.env.NEXT_PUBLIC_ENABLE_DATASET_TAGS === 'true',
  ENABLE_ML_MODELS: process.env.NEXT_PUBLIC_ENABLE_ML_MODELS === 'true',
  ENABLE_CHATBOT: process.env.NEXT_PUBLIC_ENABLE_CHATBOT === 'true',
};

// Usage in component
if (FEATURE_FLAGS.ENABLE_DATASET_TAGS) {
  // Render tags UI
}
```

### B.4 ETL Streaming for Large Files

**Streaming Implementation:**

```typescript
// supabase/functions/etl-processor/index.ts
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';

async function processLargeFile(fileUrl: string, datasetId: string) {
  const response = await fetch(fileUrl);
  const stream = response.body;
  
  const parser = parse({
    columns: true,
    skip_empty_lines: true,
    max_rows_per_batch: 1000 // Process in batches
  });
  
  let rowCount = 0;
  let batch = [];
  
  for await (const row of stream.pipe(parser)) {
    batch.push(row);
    rowCount++;
    
    // Insert batch every 1000 rows
    if (batch.length >= 1000) {
      await insertBatch(datasetId, batch);
      batch = [];
      
      // Update progress
      await updateDatasetProgress(datasetId, rowCount);
    }
    
    // Enforce row limit
    if (rowCount >= 1_000_000) {
      throw new Error('Dataset exceeds maximum row limit of 1 million');
    }
  }
  
  // Insert remaining rows
  if (batch.length > 0) {
    await insertBatch(datasetId, batch);
  }
  
  return rowCount;
}
```

**User Experience for Large Files:**

- Files > 100MB: Show "Processing large file, this may take several minutes" message
- Display progress bar with estimated time remaining
- Allow user to navigate away (processing continues in background)
- Send email notification when processing completes
- If file > 1M rows or > 500MB: Reject with error message suggesting data sampling or splitting

### B.5 PII Consent UI/UX Flow

**PII Detection Modal:**

```typescript
// Component: PIIConsentModal.tsx
interface PIIConsentModalProps {
  datasetId: string;
  piiColumns: string[];
  onConsent: () => void;
  onDecline: () => void;
}

// Modal Content:
```

**Modal Text (Legal-Approved):**

```
⚠️ Personal Information Detected

We've detected the following columns that may contain personally identifiable information (PII):

• email_address
• phone_number
• customer_name

To enable AI-powered features like semantic search and chatbot assistance, we need to:
1. Generate embeddings (mathematical representations) of this data
2. Store embeddings in our secure database
3. Use embeddings to provide contextual AI responses

Your data security:
✓ Embeddings are encrypted at rest and in transit
✓ Original data never leaves your workspace
✓ You can delete embeddings at any time
✓ Embeddings are automatically deleted 30 days after dataset deletion

Do you consent to generating embeddings for AI features?

[Decline - Basic features only]  [Accept - Enable AI features]

Learn more about our data handling practices
```

**Consent Tracking:**

- Store consent decision in `datasets.pii_consent_given` column
- Log consent action in `audit_logs` table
- Display consent status in dataset details page
- Allow users to revoke consent (deletes embeddings immediately)

### B.6 Acceptance Test Matrix

| Requirement | Acceptance Criterion | Test Type | Test Location | CI Gate | Owner |
|-------------|---------------------|-----------|---------------|---------|-------|
| **Req 1: Authentication** |
| 1.1 | Valid credentials authenticate user | Integration | `tests/api/auth.test.ts` | Required | Backend |
| 1.2 | Support email/password and OAuth | Integration | `tests/api/auth.test.ts` | Required | Backend |
| 1.3 | RBAC enforced for workspaces | Unit | `tests/lib/rbac.test.ts` | Required | Backend |
| 1.4 | Unauthenticated users redirected | E2E | `tests/e2e/auth.spec.ts` | Required | Frontend |
| 1.5 | Session persists across refreshes | E2E | `tests/e2e/auth.spec.ts` | Required | Frontend |
| **Req 2: Data Upload** |
| 2.1 | Validate file format and size | Unit | `tests/lib/validation.test.ts` | Required | Backend |
| 2.2 | Store files in Supabase Storage | Integration | `tests/api/upload.test.ts` | Required | Backend |
| 2.3 | Parse and extract schema | Unit | `tests/lib/parser.test.ts` | Required | Backend |
| 2.4 | Display preview table | E2E | `tests/e2e/upload.spec.ts` | Required | Frontend |
| 2.5 | Save dataset metadata | Integration | `tests/api/datasets.test.ts` | Required | Backend |
| 2.6 | Display error on failure | E2E | `tests/e2e/upload.spec.ts` | Required | Frontend |
| **Req 3: ETL Pipeline** |
| 3.1 | Handle missing values | Unit | `tests/etl/cleaning.test.ts` | Required | ETL |
| 3.2 | Normalize data types | Unit | `tests/etl/cleaning.test.ts` | Required | ETL |
| 3.3 | Detect duplicates | Unit | `tests/etl/cleaning.test.ts` | Required | ETL |
| 3.4 | Generate quality report | Integration | `tests/etl/pipeline.test.ts` | Required | ETL |
| 3.5 | Store cleaned data | Integration | `tests/etl/pipeline.test.ts` | Required | ETL |
| **Req 4: AI Queries** |
| 4.1 | Interpret natural language | Integration | `tests/api/ai.test.ts` | Required | AI |
| 4.2 | Generate analysis logic | Unit | `tests/lib/ai-parser.test.ts` | Required | AI |
| 4.3 | Return structured results | Integration | `tests/api/ai.test.ts` | Required | AI |
| 4.4 | Handle various query types | Integration | `tests/api/ai.test.ts` | Required | AI |
| 4.5 | Provide helpful error messages | Unit | `tests/lib/ai-parser.test.ts` | Required | AI |
| **Req 5: Dashboards** |
| 5.1 | Generate summary statistics | Unit | `tests/lib/stats.test.ts` | Required | Backend |
| 5.2 | Display visualizations | E2E | `tests/e2e/dashboard.spec.ts` | Required | Frontend |
| 5.3 | Render dashboard for dataset | E2E | `tests/e2e/dashboard.spec.ts` | Required | Frontend |
| 5.4 | Export to PDF | Integration | `tests/api/export.test.ts` | Optional | Backend |
| 5.5 | Update on data changes | E2E | `tests/e2e/dashboard.spec.ts` | Optional | Frontend |
| **Req 6: Automation** |
| 6.1 | Store automation rules | Integration | `tests/api/automation.test.ts` | Required | Backend |
| 6.2 | Evaluate rules on schedule | Integration | `tests/functions/evaluator.test.ts` | Required | ETL |
| 6.3 | Send notifications | Integration | `tests/functions/evaluator.test.ts` | Required | ETL |
| 6.4 | Enable/disable/delete rules | Integration | `tests/api/automation.test.ts` | Required | Backend |
| 6.5 | Log alert triggers | Integration | `tests/functions/evaluator.test.ts` | Required | ETL |
| **Req 15: Performance** |
| 15.1 | Support 1M rows, 100MB files | Performance | `tests/performance/upload.test.ts` | Optional | QA |
| 15.2 | Handle 500 concurrent users | Performance | `tests/performance/load.test.ts` | Optional | QA |
| 15.3 | Scale Edge Functions | Performance | `tests/performance/functions.test.ts` | Optional | QA |
| 15.4 | Cache dashboards (5 min) | Unit | `tests/lib/cache.test.ts` | Required | Backend |
| 15.5 | AI queries < 8s (p95) | Performance | `tests/performance/ai.test.ts` | Optional | QA |

**CI Pipeline Gates:**

- **Required Tests**: Must pass before merge to main
- **Optional Tests**: Run nightly or on-demand, failures don't block merge
- **Performance Tests**: Run weekly on staging environment

### B.7 Secrets & Key Rotation Runbook

**Quarterly Key Rotation Procedure:**

**OpenAI API Key Rotation:**

1. **Preparation** (Owner: Backend Lead)
   - [ ] Generate new API key in OpenAI dashboard
   - [ ] Test new key in staging environment
   - [ ] Schedule rotation during low-traffic window

2. **Rotation** (Owner: SRE)
   - [ ] Update `OPENAI_API_KEY` in Vercel environment variables
   - [ ] Update `OPENAI_API_KEY` in Supabase secrets
   - [ ] Trigger redeployment of all services
   - [ ] Verify health checks pass

3. **Verification** (Owner: Backend Lead)
   - [ ] Test AI query endpoint in production
   - [ ] Monitor error rates for 1 hour
   - [ ] Check OpenAI usage dashboard

4. **Cleanup** (Owner: SRE)
   - [ ] Revoke old API key in OpenAI dashboard (after 24 hours)
   - [ ] Document rotation in audit log
   - [ ] Update key rotation schedule

**Supabase Keys Rotation:**

1. **Preparation** (Owner: Database Admin)
   - [ ] Generate new service role key in Supabase dashboard
   - [ ] Test new key with read/write operations in staging

2. **Rotation** (Owner: SRE)
   - [ ] Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel
   - [ ] Update Edge Function environment variables
   - [ ] Redeploy all services

3. **Verification** (Owner: Database Admin)
   - [ ] Test database operations
   - [ ] Test file uploads to Storage
   - [ ] Monitor connection pool

4. **Cleanup** (Owner: SRE)
   - [ ] Revoke old service role key (after 24 hours)
   - [ ] Document in audit log

**Emergency Key Rotation (Compromised Key):**

1. **Immediate Actions** (Owner: On-call SRE)
   - [ ] Revoke compromised key immediately
   - [ ] Generate and deploy new key (< 15 minutes)
   - [ ] Monitor for unauthorized access attempts

2. **Investigation** (Owner: Security Team)
   - [ ] Review audit logs for suspicious activity
   - [ ] Identify source of compromise
   - [ ] Assess data exposure

3. **Communication** (Owner: Product Manager)
   - [ ] Notify affected users if data exposed
   - [ ] Update security incident log
   - [ ] Post-mortem within 48 hours

### B.8 SLO Ownership & Escalation

| SLO | Owner Team | Alert Severity | Escalation Path |
|-----|------------|----------------|-----------------|
| Platform Availability (99.9%) | SRE | Critical | SRE → Engineering Manager → CTO |
| API Latency (p95 < 500ms) | Backend | Warning | Backend Lead → Engineering Manager |
| AI Query Latency (p95 < 8s) | AI/ML | Warning | ML Engineer → Backend Lead |
| Dashboard Load (p95 < 2s) | Frontend | Warning | Frontend Lead → Engineering Manager |
| ETL Success Rate (> 95%) | Data Engineering | Warning | Data Engineer → Backend Lead |
| Error Rate (< 1%) | Backend | Critical | Backend Lead → Engineering Manager |
| Database Latency (p95 < 100ms) | Database Admin | Critical | DBA → SRE → Engineering Manager |
| Storage Operations (> 99%) | SRE | Warning | SRE → Engineering Manager |

**Escalation Timing:**

- **Warning Alerts**: Escalate if not resolved within 2 hours
- **Critical Alerts**: Escalate if not acknowledged within 15 minutes
- **After-Hours**: Page on-call engineer immediately for critical alerts

### B.9 Accessibility Checklist (WCAG 2.1 Level AA)

**Visual Design:**

- [ ] Color contrast ratio ≥ 4.5:1 for normal text
- [ ] Color contrast ratio ≥ 3:1 for large text (18pt+)
- [ ] Information not conveyed by color alone
- [ ] Focus indicators visible on all interactive elements
- [ ] Text resizable up to 200% without loss of functionality

**Keyboard Navigation:**

- [ ] All interactive elements accessible via keyboard
- [ ] Logical tab order throughout application
- [ ] Skip navigation links for main content
- [ ] Keyboard shortcuts documented and customizable
- [ ] No keyboard traps

**Screen Reader Support:**

- [ ] All images have alt text
- [ ] Form inputs have associated labels
- [ ] ARIA landmarks for page regions
- [ ] ARIA live regions for dynamic content
- [ ] Meaningful page titles

**Forms & Inputs:**

- [ ] Error messages clearly associated with fields
- [ ] Required fields indicated with text, not just asterisk
- [ ] Input purpose identified (autocomplete attributes)
- [ ] Sufficient time for form completion
- [ ] Confirmation for destructive actions

**Charts & Visualizations:**

- [ ] Data tables provided as alternative to charts
- [ ] Chart elements have descriptive labels
- [ ] Color-blind friendly color palettes
- [ ] Patterns/textures in addition to colors
- [ ] Keyboard navigation for interactive charts

**Testing Tools:**

- Automated: axe DevTools, Lighthouse
- Manual: NVDA/JAWS screen readers, keyboard-only navigation
- User testing: Include users with disabilities in beta testing

This completes all the implementation clarifications and details needed for the task breakdown phase!
