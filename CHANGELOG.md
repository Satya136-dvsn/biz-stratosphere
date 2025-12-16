# Changelog

All notable changes to the Biz Stratosphere project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned

- Pagination for Advanced Charts (support >500 rows display)
- Data validation reports after upload
- Outlier detection and data cleaning UI
- Map visualization for geo-coded data
- Background processing queue for large uploads

---

## [2.1.0] - 2024-12-17

### Added - Phase 6: Platform Polish & Transparency

#### Platform Status Page

- **NEW `/platform-status` page**: Transparent categorization of all features
- Production-Ready section: Auth, Data Upload, Dashboards, Charts, Security
- Prototype section: AI queries, ML predictions, Automation rules
- Planned section: RAG chatbot, Monitoring, Compliance tools
- CSV capability transparency documentation
- Professional disclaimers with design-decision framing

#### Landing Page Redesign

- Updated hero section: "Turn Business Data into Actionable Insights — Faster"
- Professional subtitle highlighting production-ready status
- Redesigned CTA buttons: "Explore Demo Workspace" & "Platform Status"
- Honest features section (only implemented strengths)
- NEW Architecture/Trust section (Modern Stack, Secure by Design, Scalable)
- NEW Roadmap Preview section (AI Query Hardening, Automation & Alerts, RAG Assistant)
- NEW Professional footer with navigation links

#### Feature Badging System

- Created reusable `FeatureBadge` component with semantic color coding
- Green badges for production-ready features
- Amber/yellow badges for prototype features  
- Gray badges for planned features
- Added prototype badges to AI Chat, ML Predictions, and Automation Rules pages

#### CSV Transparency

- Added info box to Advanced Charts page (500 row limit disclosure)
- Helper text about optimal dataset sizes (1-10K rows)
- Data validation behavior documentation
- Professional language: "Some invalid rows may be skipped during ingestion; a detailed validation report is planned"

#### UX Refinements

- Softer CSV validation language (roadmap-aware)
- Enhanced platform disclaimer (design-decision framing)
- Professional CTA naming ("Explore Demo Workspace" vs "View Demo")
- Semantic color coding throughout UI

### Changed

- Landing page now focuses only on implemented strengths
- Removed misleading "fully AI-powered" claims
- Updated AI/ML page descriptions to include "evolving feature" notation

---

## [2.0.0] - 2024-12-17

### Added - Phase 5: Advanced Charts Enhancement

#### Data Upload Improvements

- **Dual storage strategy**: Raw CSV rows preserved alongside transformed data
- Raw rows marked with `metric_name = 'raw_csv_row'` in `data_points` table
- Complete original CSV data stored in `metadata.row_data` JSONB field
- All CSV columns accessible for charting (no transformation loss)
- Automatic React Query cache invalidation after upload (datasets list auto-refreshes)

#### Advanced Charts Features

- Full CSV column access for chart creation
- User can select ANY column for X-axis or Y-axis
- Auto-detection of column types (date, numeric, text)
- Columns exclude only internal fields (`_id`, `_date_recorded`, etc.)
- Improved query: fetches only raw CSV rows, not transformed data
- Added comprehensive debug logging for troubleshooting

#### Developer Experience

- Added `useMemo` for `availableColumns` and `numericColumns` (performance)
- Fixed undefined value handling in Select components (`value || ''`)
- Created CSV format guide for users
- Created system capability assessment document

### Fixed

- **Critical**: HTML-encoded arrow functions (`=&gt;`) causing syntax errors
- Variable shadowing in `useChartData.ts` (renamed `data` to `groupData`)
- Variable shadowing in `passwordSecurity.ts` (renamed to `encodedPassword` and `responseData`)
- Select components changing from uncontrolled to controlled (React warning)
- Upload list not refreshing after successful file upload

---

## [1.5.0] - 2024-12-15

### Added - Phase 4: Validation, Security Hardening & SEO

#### Input Validation

- **Zod validation library** integrated across all forms
- Centralized validation schemas in `src/lib/validation.ts`
- Email validation with RFC 5322 compliance
- Password validation with complexity requirements
- User profile validation schemas

#### Password Security

- **zxcvbn** password strength estimation
- Minimum password score: 3 out of 4
- Real-time password strength feedback in signup
- Checks against common passwords via HaveIBeenPwned API (k-anonymity model)

#### SEO Optimization

- **react-helmet-async** for dynamic meta tag management
- `SEO` component for reusable metadata
- Unique titles and descriptions for all pages
- `robots.txt` for search engine crawler directives
- `sitemap.xml` for search engine indexing
- Open Graph tags for social media sharing

#### Security Hardening

- Content Security Policy (CSP) warnings resolved
- Removed invalid meta tag directives

### Fixed

- Blank screen issue caused by duplicate `data` identifier in modules
- CSP warnings for meta-tag delivered directives

---

## [1.0.0] - 2024-12-10

### Added - Phase 3: Multi-Factor Authentication (MFA)

#### MFA Core Features

- TOTP-based two-factor authentication
- QR code generation for authenticator app pairing
- Backup codes for account recovery (10 single-use codes per user)
- Device trust management ("Remember this device for 30 days")
- MFA settings page for user management

### Added - Phase 2: Data Encryption

#### Encryption Features

- AES-256-GCM encryption using Web Crypto API
- PBKDF2 key derivation (100,000 iterations, SHA-256)
- Client-side file encryption/decryption

### Added - Phase 1: Core Platform

#### Business Intelligence

- Real-time analytics dashboard
- 8 chart types
- Custom report generation (PDF, Excel, CSV)
- CSV/Excel file upload

#### AI & Machine Learning

- RAG-powered chatbot using Google Gemini API
- ML model serving via Python FastAPI
- SHAP explainability

#### Data Management

- Multi-dataset support
- Automatic PII detection
- Real-time updates via Supabase subscriptions

---

## Version Summary

| Version | Release Date | Key Features |
|---------|--------------|--------------|
| 2.0.0 | Dec 17, 2024 | Advanced Charts enhancement, dual storage, auto-refresh |
| 1.5.0 | Dec 15, 2024 | Validation (Zod), SEO (react-helmet), Security hardening |
| 1.0.0 | Dec 10, 2024 | MFA (TOTP, backup codes), Encryption (Web Crypto API) |
