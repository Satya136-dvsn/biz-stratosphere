# 🚀 Biz Stratosphere

## AI-Powered Business Intelligence & Analytics Platform

A modern, serverless analytics platform that empowers businesses with AI-driven insights, real-time predictions, and comprehensive data visualization - all at **$0/month operational cost**.

[![Tests](https://img.shields.io/badge/tests-215%20passing-brightgreen)](https://github.com) [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/) [![React](https://img.shields.io/badge/React-18.3-61dafb)](https://react.dev/) [![Supabase](https://img.shields.io/badge/Supabase-Serverless-3ECF8E)](https://supabase.com/)

---

## 📖 What is Biz Stratosphere?

**Biz Stratosphere** is an enterprise-grade business intelligence platform designed to democratize data analytics and machine learning for businesses of all sizes. Unlike traditional BI tools that require expensive infrastructure and complex setup, Biz Stratosphere leverages modern serverless technologies to deliver powerful analytics capabilities with zero operational costs.

### 🎯 What Does It Do?

Biz Stratosphere provides a complete suite of business intelligence and AI capabilities:

1. **📊 Visualize Your Data** - Upload CSV/Excel files and instantly create interactive dashboards with 8+ chart types (Bar, Line, Pie, Scatter, Radar, Treemap, Gauge, Funnel)

2. **🤖 AI-Powered Predictions** - Run machine learning models directly in your browser:
   - Predict customer churn before it happens
   - Forecast revenue based on business metrics
   - Train custom models with your own data
   - All processing happens client-side (100% private and free)

3. **💬 Chat with Your Data** - Ask questions about your business in plain English using our RAG-powered AI assistant with **confidence scoring** and **hallucination prevention**

4. **📈 Generate Reports** - Create professional reports in PDF, Excel, or CSV formats with automatic insights

5. **🔧 Automate Actions** - Build automation rules with AI-suggested triggers and scheduled actions

6. **🛡️ Enterprise Security** - Role-based access control, audit logging, and comprehensive monitoring

### 👥 Who Is It For?

- **Small Businesses** - Get enterprise-grade analytics without enterprise costs
- **Data Analysts** - Quickly prototype and share insights with stakeholders
- **Developers** - Build data-driven applications with our API
- **Product Teams** - Track KPIs and make data-informed decisions
- **Startups** - Scale from zero to production without infrastructure costs

### 💡 Why Choose Biz Stratosphere?

- ✅ **Zero Operational Costs** - Serverless architecture means $0/month baseline
- ✅ **Privacy-First** - ML models run in your browser, data never leaves
- ✅ **No Setup Required** - Sign up and start analyzing in minutes
- ✅ **Production-Ready** - Enterprise-grade security and performance
- ✅ **AI Trust & Transparency** - Confidence scoring and grounding validation
- ✅ **Fully Open Source** - Customize and self-host if needed

---

## ✨ Features

### 📊 **Business Intelligence**

- **Real-time Analytics Dashboard** - Monitor KPIs with live data updates
- **Advanced Charts & Visualizations** - 8 chart types (Bar, Line, Pie, Scatter, Radar, Treemap, Gauge, Funnel)
- **Custom Reports** - Generate professional PDF, Excel, and CSV reports
- **Data Upload** - CSV/Excel file upload with automatic quality analysis
- **Upload History** - Track all uploads with metadata and status

### 🤖 **AI & Machine Learning** ⭐ PRODUCTION-READY

- **AI Assistant (RAG Chat)** - Production-grade conversational AI with:
  - Context window management (configurable 5-20 messages)
  - Smart embedding cache (60%+ cache hit rate)
  - Rate limiting (50 daily / 1000 monthly)
  - Customizable settings (temperature, max tokens)
  - Export conversations (Markdown, JSON, Text)
  - Syntax-highlighted code blocks with copy button
  - Rich markdown rendering (tables, lists, links)
  - **🆕 Confidence Scoring** - Every response shows confidence level
  - **🆕 Hallucination Prevention** - Source transparency and grounding validation
  - **🆕 Low Confidence Warnings** - Visual alerts for uncertain responses

- **ML Predictions (Browser-Based)** ⭐ 100% FREE, Production-Ready:
  - **Customer Churn Prediction** - 96% accuracy after training
  - **Revenue Forecasting** - 87% R² score for business planning
  - **TensorFlow.js** - Models run entirely in your browser
  - **Custom Training** - Upload your own CSV data to train models
  - **Prediction History** - Track and review all past predictions
  - **Feature Importance** - Understand what drives predictions
  - **Zero Cost** - No servers, no API calls, 100% FREE forever
  - **Offline Capable** - Works without internet after model download
  - **Privacy First** - Your data never leaves your browser

### ⚡ **Automation Engine** ⭐ NEW

- **Automation Rules** - Create rules triggered by thresholds, schedules, or data changes
- **AI Rule Suggestions** - Get intelligent automation recommendations
- **Scheduled Execution** - Run rules on cron schedules or intervals
- **Email Notifications** - Send email alerts using Supabase Email Provider
- **Webhook Actions** - Trigger external services
- **Execution Logs** - Track rule execution history and status

### 🏢 **Workspace Management** ⭐ NEW

- **Multi-Workspace Support** - Organize data by project or team
- **Workspace Switching** - Quick switch between workspaces from sidebar
- **Usage Metrics** - Track uploads, AI queries, and automation triggers
- **Workspace Settings** - Configure per-workspace preferences

### 🛡️ **Admin & Security** ⭐ NEW

- **AI Decision Audit** - Admin dashboard to review AI response quality
- **Confidence Monitoring** - Track high/medium/low confidence distributions
- **Grounding Validation** - Verify AI responses against source data
- **Structured Logging** - Context-aware logging with userId, workspaceId, requestId
- **Row-Level Security (RLS)** - Secure data access at database level
- **Role-Based Access Control** - Admin, user, and viewer roles
- **Audit Logging** - Track all user actions
- **Rate Limiting** - Prevent abuse with configurable limits

### 📈 **Data Management**

- **Multi-Dataset Support** - Manage multiple datasets simultaneously
- **Data Quality Checks** - Automatic PII detection and validation
- **Real-time Updates** - Supabase realtime subscriptions
- **Secure Storage** - Enterprise-grade data security
- **Data Pagination** - Scalable handling of large datasets
- **Validation Reports** - Downloadable CSV quality reports

### 📡 **Streaming & Monitoring** ⭐ NEW

- **Streaming ETL** - Real-time data ingestion simulation
- **System Monitor** - Live metrics for API latency, throughput, and errors
- **Performance Dashboards** - Visual health checks (Healthy/Degraded/Critical)
- **Event Logging** - Real-time alerts for system anomalies

### 🔧 **Developer Features**

- **RESTful API** - Full API with authentication
- **API Management** - Generate and manage API keys
- **Webhooks** - Real-time event notifications  
- **Usage Analytics** - Track API usage and limits

---

## 🛠️ Tech Stack

### Frontend

- **React 18.3** - UI framework
- **TypeScript 5.0** - Type safety
- **Vite 5.4** - Build tool and dev server
- **TanStack Query v5** - Data fetching and caching
- **Shadcn UI** - Component library
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **jsPDF** - Professional PDF exports
- **date-fns** - Date utilities

### Backend

- **Supabase** - Backend as a service
  - PostgreSQL database with pgvector
  - Real-time subscriptions
  - Authentication & Authorization
  - Row-Level Security (RLS)
  - Edge Functions
  - Email Provider integration
- **Python ML Service** - FastAPI-based ML serving (optional)

### AI/ML

- **TensorFlow.js** - Browser-based ML predictions (churn, revenue)
- **Google Gemini API** - RAG chat and embeddings
- **pgvector** - Vector similarity search
- **Custom Confidence Scoring** - Deterministic confidence calculation
- **Grounding Validator** - Source verification for AI responses

### Testing

- **Vitest** - Unit testing (198 tests)
- **Playwright** - E2E testing (17 tests)
- **React Testing Library** - Component testing

### Observability

- **Sentry** - Error tracking and performance monitoring
- **Structured Logging** - Context-aware logging utility
- **Performance Monitoring** - Core Web Vitals tracking

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+ (for ML service, optional)
- **Supabase** account
- **Google AI API** key (for RAG features)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Satya136-dvsn/biz-stratosphere.git
cd biz-stratosphere
```

1. **Install dependencies**

```bash
npm install
```

1. **Set up environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

1. **Run database migrations**

Apply migrations in order via Supabase Dashboard or CLI:

- `supabase/migrations/` - All schema migrations

1. **Start development server**

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

---

## 🧪 Testing

```bash
# Run all unit tests
npm run test:run

# Run E2E tests
npx playwright test

# Run tests with UI
npm run test
```

### Test Coverage

| Type | Tests | Status |
|------|-------|--------|
| Unit Tests | 198 | ✅ Passing |
| E2E Tests | 17 | ✅ Passing |
| **Total** | **215** | ✅ **All Passing** |

---

## 📁 Project Structure

```text
biz-stratosphere/
├── src/
│   ├── components/           # React components
│   │   ├── ai/              # AI Chat, Confidence Badge
│   │   ├── automation/      # Automation rule components
│   │   ├── dashboard/       # Dashboard widgets, KPI cards
│   │   ├── layout/          # Sidebar, Workspace Selector
│   │   ├── ml/              # ML prediction components
│   │   ├── ui/              # Shadcn UI components
│   │   └── workspace/       # Workspace management
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts       # Authentication
│   │   ├── useRAGChat.ts    # AI Chat with confidence
│   │   ├── useWorkspaces.ts # Workspace management
│   │   └── useAutomationRules.ts # Automation engine
│   ├── lib/                 # Utility functions
│   │   ├── ai/              # Confidence scoring, grounding
│   │   ├── logger.ts        # Structured logging
│   │   └── errorTracking.ts # Sentry integration
│   ├── pages/               # Page components
│   │   ├── admin/           # Admin pages
│   │   │   ├── AIDecisionAudit.tsx  # AI audit dashboard
│   │   │   └── AdminDashboard.tsx
│   │   ├── AIChat.tsx       # AI Assistant
│   │   ├── AutomationRules.tsx
│   │   └── Dashboard.tsx
│   └── integrations/        # Third-party integrations
│       └── supabase/        # Supabase client & types
├── supabase/
│   ├── migrations/          # Database migrations
│   └── functions/           # Edge functions
├── e2e/                     # Playwright E2E tests
│   ├── fixtures/            # Auth fixtures
│   └── *.spec.ts            # Test files
└── public/                  # Static assets
```

---

## 🔒 Security Features

- **Row-Level Security (RLS)** - Secure data access at database level
- **JWT Authentication** - Secure API endpoints
- **API Key Management** - Controlled access with scopes
- **PII Detection** - Automatic sensitive data detection
- **Audit Logging** - Track all user actions (AI Decision Audit)
- **CSRF Protection** - Cross-site request forgery prevention
- **Rate Limiting** - Configurable limits (50 daily / 1000 monthly)
- **Role-Based Access Control** - Admin, user, and viewer roles
- **Workspace Isolation** - Data separation by workspace

---

## 📊 Database Schema

The platform uses the following main tables:

### Core Tables

- `profiles` - User profiles and settings
- `workspaces` - Team workspaces
- `workspace_members` - Workspace membership
- `datasets` - Uploaded data files
- `data_points` - Individual data records

### AI & ML Tables

- `chat_conversations` - AI chat sessions
- `chat_messages` - Chat message history
- `embeddings` - Vector embeddings for RAG
- `ml_predictions` - ML prediction history
- `ml_models` - ML model metadata
- `ai_response_audits` - AI confidence audit logs

### Automation Tables

- `automation_rules` - Rule definitions
- `automation_execution_logs` - Rule execution history
- `workspace_usage` - Usage metrics tracking

### Security Tables

- `api_keys` - API key management
- `notifications` - User notifications

See `/supabase/migrations/` for complete schema.

---

## 🗺️ Development Phases

### ✅ Phase 1: AI Chat RPC & Database Migration Fix

- Fixed `match_embeddings` RPC function
- Created comprehensive database migration
- Completed chunk processing and user uploads

### ✅ Phase 2: Email Notifications Integration

- Integrated Supabase Email Provider
- Added email notification action type to automation
- Created send_email Edge Function

### ✅ Phase 3: Workspace Switching

- Created WorkspaceSelector component
- Integrated into sidebar layout
- Added currentWorkspace state and localStorage persistence
- Implemented query invalidation on workspace switch

### ✅ Phase 4: E2E Test Coverage Fix

- Created auth fixtures for Playwright tests
- Added data-testid to KPICard, AIChat, AutomationRules
- Updated all test files with stable selectors
- All 17 E2E tests passing

### ✅ Phase 5: Hallucination Prevention

- Created confidence scoring utility (`confidenceScoring.ts`)
- Created grounding validation (`groundingValidator.ts`)
- Added ConfidenceBadge component with low-confidence warnings
- Created ai_response_audits table for logging
- Integrated confidence into useRAGChat hook
- Added source transparency indicators

### ✅ Phase 6: AI Decision Audit UI

- Created admin-only AIDecisionAudit page
- Filters by confidence level, date range, search
- Highlights low-confidence responses
- Shows stats: total queries, confidence distribution

### ✅ Phase 7: Structured Logging

- Enhanced logger.ts with context support
- Added workspaceId, requestId, component, action
- Created child logger and createLogger utilities
- Preserved Sentry integration

### ✅ Phase 8: Workspace Usage Metrics

- Created workspace_usage table with RLS
- Tracks uploads, AI queries, automation triggers
- Created WorkspaceUsageMetrics component
- Shows 30-day metrics with 7-day trends

### ✅ Phase 9: Enterprise Readiness & Monitoring

- **System Monitor**: Real-time dashboard for API performance and system health
- **Streaming ETL**: Simulated real-time data ingestion pipeline
- **Data Validation**: Row-level validation with downloadable error reports
- **Pagination**: Server-side pagination for handling large datasets
- **Enhanced Upload**: File size limits (50MB), progress bars, and quality analysis

### 📋 Future Roadmap

- [ ] Real-time collaboration
- [ ] Mobile app (React Native)
- [ ] Scheduled reports
- [ ] Data warehouse integration
- [ ] Custom dashboards builder
- [ ] AutoML for model optimization

---

## 🚢 Deployment

### Frontend (Vercel/Netlify)

1. **Build production bundle**

```bash
npm run build
```

1. **Deploy to Vercel**

```bash
vercel --prod
```

Or **deploy to Netlify**:

```bash
netlify deploy --prod --dir=dist
```

### Database Migrations

Apply all migrations via Supabase Dashboard SQL Editor:

1. `20260113_ai_response_audits.sql` - AI audit logging
2. `20260114_workspace_usage.sql` - Usage metrics

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **Supabase** - Backend infrastructure
- **Google AI** - Gemini API for RAG
- **TensorFlow.js** - Browser-based ML
- **Shadcn UI** - Beautiful component library
- **Recharts** - Data visualization
- **Playwright** - E2E testing
- **Vitest** - Unit testing

---

## 📧 Support

For support and questions:

- 📧 Email: <d.v.satyanarayana260@gmail.com>
- 📖 Documentation: [docs.bizstratosphere.com](https://docs.bizstratosphere.com)
- 🐛 Issues: [GitHub Issues](https://github.com/Satya136-dvsn/biz-stratosphere/issues)

---

Built with ❤️ by the Biz Stratosphere Team

*Transform your data into insights with AI-powered analytics.*
