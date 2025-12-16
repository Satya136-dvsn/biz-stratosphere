# Project Requirements - Biz Stratosphere

## Document Version

- **Version**: 2.0
- **Last Updated**: December 17, 2024
- **Status**: Active Development

---

## 1. Functional Requirements

### 1.1 Authentication & Security (Phase 1-4) ✅

**FR-1.1: User Authentication**

- Users must be able to register, login, and logout
- Support email/password authentication via Supabase Auth
- JWT-based session management
- Password reset functionality

**FR-1.2: Multi-Factor Authentication (MFA)** ✅

- TOTP-based two-factor authentication
- QR code generation for authenticator apps
- Backup codes for account recovery (10 single-use codes)
- Device trust management (remember trusted devices)
- MFA verification history and audit trail

**FR-1.3: Data Encryption** ✅

- Client-side encryption using Web Crypto API
- AES-256-GCM encryption for sensitive data
- PBKDF2 key derivation from passwords
- Secure file encryption/decryption

**FR-1.4: Input Validation** ✅

- Zod schema validation for all forms
- Email validation with RFC compliance
- Password strength enforcement (minimum score 3/4 using zxcvbn)
- Client-side validation with user-friendly error messages

**FR-1.5: Security Hardening** ✅

- Content Security Policy (CSP) via HTTP headers
- HTTPS enforcement
- CSRF protection
- XSS prevention
- Row-Level Security (RLS) in database
- Rate limiting (10 uploads/day, 1000 AI queries/day)

### 1.2 Data Management (Phase 5) ✅

**FR-2.1: File Upload**

- Support CSV and Excel (.xlsx, .xls) file formats
- Maximum file size: Browser-dependent (no hard limit in code)
- Automatic file type detection
- Progress indication during upload
- Rate limiting: 10 uploads per 24 hours per user

**FR-2.2: Data Processing** ✅

- Dual storage strategy:
  - **Transformed data**: For dashboards/KPIs (metric_name, metric_value, date_recorded)
  - **Raw CSV rows**: For Advanced Charts (all original columns preserved)
- Automatic date field detection (date, created_at, timestamp, etc.)
- Automatic numeric field detection
- Handle missing values (nulls, empty strings)
- Skip invalid rows gracefully

**FR-2.3: Data Storage**

- Store datasets in Supabase PostgreSQL
- Each row marked as transformed (`metric_name != 'raw_csv_row'`) or raw (`metric_name = 'raw_csv_row'`)
- Raw rows store complete original data in `metadata.row_data` JSONB field
- User isolation via Row-Level Security
- Company-level data sharing (if company_id present)

**FR-2.4: Data Query**

- Query limit: 500 rows per request for Advanced Charts
- Support date range filtering
- Support text search filtering
- Real-time updates via Supabase subscriptions

### 1.3 Analytics & Visualization ✅

**FR-3.1: Dashboard**

- Real-time KPI monitoring
- Summary cards for key metrics
- Time-series charts
- Data refresh without page reload

**FR-3.2: Advanced Charts** ✅ (Phase 5 Enhancements)

- 8 chart types:
  - Bar Chart
  - Line Chart  
  - Area Chart
  - Pie Chart
  - Scatter Plot
  - Radar Chart
  - Treemap
  - Gauge Chart
  - Funnel Chart
- **Full CSV column access** (Phase 5):
  - All uploaded CSV columns available for charting
  - User selects any column for X-axis
  - User selects any column for Y-axis
  - Auto-detection of column types (date, numeric, text)
- Customization options:
  - Chart title
  - Legend toggle
  - Grid toggle
  - Tooltip toggle
  - Color customization
  - Dimensions (width, height)
- Export capabilities:
  - Export chart as PNG image
  - Export data as CSV
  - Save chart configuration

**FR-3.3: Reports**

- Generate PDF reports
- Generate Excel reports
- Generate CSV exports
- Custom report templates
- Scheduled report generation (future)

### 1.4 AI & Machine Learning

**FR-4.1: RAG-Powered Chatbot**

- Natural language queries about data
- Context-aware responses using vector embeddings
- Google Gemini API integration
- Conversation history

**FR-4.2: ML Model Serving**

- Deploy custom ML models via Python FastAPI service
- SHAP explainability for predictions
- Churn prediction model
- Model performance monitoring

### 1.5 API Management

**FR-5.1: API Keys**

- Generate API keys for programmatic access
- Key rotation and expiration
- Usage tracking per key
- Rate limiting per key

**FR-5.2: Webhooks**

- Event-based notifications
- Configurable webhook endpoints
- Retry logic for failed deliveries
- Webhook logs and monitoring

### 1.6 Collaboration

**FR-6.1: Workspaces**

- Create and manage team workspaces
- Invite team members
- Role-based access control (Owner, Admin, Member, Viewer)
- Workspace-level data isolation

**FR-6.2: Notifications**

- Real-time notifications
- Email notifications
- Notification preferences
- Mark as read/unread

### 1.7 SEO & Discoverability (Phase 4) ✅

**FR-7.1: Search Engine Optimization**

- Dynamic meta tags using react-helmet-async
- Unique titles and descriptions per page
- robots.txt for crawler directives
- sitemap.xml for search engine indexing
- Semantic HTML structure
- Proper heading hierarchy (single H1 per page)

**FR-7.2: Social Media Integration**

- Open Graph tags for social sharing
- Twitter Card tags
- Preview-friendly metadata

---

## 2. Non-Functional Requirements

### 2.1 Performance

**NFR-1: Response Time**

- Page load time: < 3 seconds
- API response time: < 500ms for 95th percentile
- Chart rendering: < 2 seconds for 1,000 data points

**NFR-2: Scalability**

- Support 10,000+ rows for data upload
- Effective handling up to 50,000 rows with performance degradation
- Concurrent users: 100+ simultaneous users

**NFR-3: Availability**

- Uptime: 99.5% (allows ~3.6 hours downtime/month)
- No data loss during failures
- Automatic failover (via Supabase infrastructure)

### 2.2 Security

**NFR-4: Data Protection**

- All sensitive data encrypted at rest and in transit
- PII detection and masking
- Audit logs for all data access
- Compliance with GDPR principles

**NFR-5: Authentication**

- Session timeout: 7 days of inactivity
- MFA enforcement for admin accounts
- Password complexity requirements (min length, special chars, numbers)
- Account lockout after 5 failed login attempts

### 2.3 Usability

**NFR-6: User Experience**

- Responsive design (mobile, tablet, desktop)
- Intuitive navigation
- Contextual help and tooltips
- Loading indicators for async operations
- Error messages user-friendly and actionable

**NFR-7: Accessibility**

- WCAG 2.1 Level AA compliance target
- Keyboard navigation support
- Screen reader compatible
- Sufficient color contrast

### 2.4 Reliability

**NFR-8: Data Integrity**

- Transaction support for critical operations
- Data validation on client and server
- Backup and recovery procedures
- Version control for schema changes

**NFR-9: Error Handling**

- Graceful degradation on failures
- User-facing error messages
- Server-side error logging
- Failed operation retry logic

---

## 3. System Capabilities (Current State)

### 3.1 Supported Data Scales

| Data Size | Upload | Visualization | Performance |
|-----------|--------|---------------|-------------|
| 1-1,000 rows | ✅ Excellent | ✅ Excellent | Fast |
| 1K-10K rows | ✅ Good | ✅ Good | Good |
| 10K-50K rows | ⚠️ Slow | ⚠️ Limited (500 display) | Degraded |
| 50K-100K rows | ⚠️ Very Slow | ❌ Limited | Poor |
| 100K+ rows | ❌ May timeout | ❌ Not supported | N/A |

### 3.2 Data Quality Handling

| Issue Type | Current Handling |
|------------|------------------|
| Null values | Skipped (row excluded) |
| Invalid dates | Fallback to current date |
| Non-numeric in number field | Row skipped |
| Empty strings | Row skipped |
| Outliers (e.g., 999999999) | Accepted (no detection) |

### 3.3 Supported CSV Formats

- ✅ Any CSV structure (headers required)
- ✅ Mixed data types (numeric, text, dates)
- ✅ Industry-specific formats (FinTech, SaaS, Retail, Telecom)
- ✅ ML-ready datasets (encoded features, labels)
- ⚠️ Geo-mapped data (lat/long accepted, but no map visualization)

---

## 4. Future Enhancements

### 4.1 High Priority

1. Pagination for large datasets (>500 rows)
2. Data validation reports
3. Explicit file size limits (e.g., 50MB)
4. Upload progress bars
5. Better error reporting (show what failed)

### 4.2 Medium Priority

6. Data sampling for large datasets
7. Outlier detection (z-score, IQR)
8. Data cleaning UI (handle nulls, transform columns)
9. Export filtered/aggregated data
10. Aggregation functions (group by, sum, avg, count)

### 4.3 Low Priority (Nice-to-Have)

11. Map visualization for geo-coded data (Leaflet/Mapbox)
12. Correlation matrix for ML datasets
13. Background processing queue for uploads
14. Scheduled data imports
15. Real-time collaboration features
16. Mobile app (React Native)

---

## 5. Dependencies

### 5.1 External Services

- Supabase (Database, Auth, Storage, Edge Functions)
- Google Gemini API (AI/ML features)
- Python ML Service (Model serving, SHAP)

### 5.2 Third-Party Libraries

- React 18
- TypeScript 5
- Vite 5
- TanStack Query v5
- Zod 3
- zxcvbn 4
- react-helmet-async 2
- Recharts 2
- jsPDF
- Papa Parse (CSV parsing)
- XLSX (Excel parsing)

---

## 6. Constraints

### 6.1 Technical Constraints

- **Browser**: Modern browsers only (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- **JavaScript**: ES2020+ features required
- **Web Crypto API**: Required for encryption features
- **Database**: PostgreSQL 14+ (via Supabase)

### 6.2 Business Constraints

- **Rate Limits**:
  - 10 uploads per user per 24 hours
  - 1,000 AI queries per user per 24 hours
- **Data Retention**: Unlimited (user-managed deletion)
- **User Limits**: No hard cap (infrastructure-dependent)

---

## 7. Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Nov 2024 | Initial requirements | Biz Stratosphere Team |
| 1.5 | Dec 2024 | Added Phase 3 MFA requirements | Biz Stratosphere Team |
| 2.0 | Dec 17, 2024 | Added Phase 4 (SEO, Validation) & Phase 5 (Advanced Charts) | Biz Stratosphere Team |
