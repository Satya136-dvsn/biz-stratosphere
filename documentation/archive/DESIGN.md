# Design Document - Biz Stratosphere

## Document Information

- **Version**: 2.0
- **Last Updated**: December 17, 2024
- **Status**: Active

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌──────────────┐         ┌─────────────────┐         ┌───────────────┐
│              │         │                 │         │               │
│   Browser    │────────▶│  React SPA      │────────▶│   Supabase    │
│   (Client)   │         │  (Frontend)     │         │   (Backend)   │
│              │         │                 │         │               │
└──────────────┘         └─────────────────┘         └───────────────┘
                                  │                           │
                                  ▼                           ▼
                         ┌─────────────────┐         ┌───────────────┐
                         │                 │         │               │
                         │   ML Service    │         │   Google AI   │
                         │   (FastAPI)     │         │   (Gemini)    │
                         │                 │         │               │
                         └─────────────────┘         └───────────────┘
```

### 1.2 Technology Stack

**Frontend:**

- React 18 + TypeScript 5
- Vite 5 (build tool)
- TanStack Query v5 (data fetching)
- Shadcn UI + Tailwind CSS (styling)
- Web Crypto API (encryption)
- Zod (validation)
- React Helmet Async (SEO)

**Backend:**

- Supabase (BaaS)
  - PostgreSQL 14+
  - Row-Level Security
  - Realtime subscriptions
  - Edge Functions (Deno)
  
**ML/AI:**

- Python FastAPI (ML serving)
- Google Gemini API (embeddings & chat)
- Custom ML models

---

## 2. Data Flow Architecture

### 2.1 CSV Upload Flow (Phase 5 Enhancement)

```
User Uploads CSV
      │
      ▼
┌─────────────────────────────────────────

────┐
│  Frontend Processing                       │
│  - Parse with PapaParse                    │
│  - Validate file type (.csv, .xlsx)        │
│  - Check rate limit (10/day)               │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
      ┌────────────────────────────┐
      │ Transform Data              │
      │                             │
      │ FOR EACH ROW:               │
      │  1. Extract metric_name     │
      │  2. Extract metric_value    │
      │  3. Extract date_recorded   │
      │  4. Create TRANSFORMED row  │
      │                             │
      │  5. Create RAW row          │
      │     - metric_name='raw_csv_row' │
      │     - metadata.row_data = full row │
      │     - All original columns preserved │
      └──────────────┬─────────────────┘
                     │
                     ▼
      ┌──────────────────────────────┐
      │ Supabase Edge Function       │
      │ (data-upload)                │
      │                              │
      │ 1. Insert dataset record     │
      │ 2. Batch insert data_points  │
      │    - Transformed rows        │
      │    - Raw CSV rows            │
      └──────────────┬───────────────┘
                     │
                     ▼
      ┌──────────────────────────────┐
      │ PostgreSQL Database          │
      │                              │
      │ datasets table               │
      │ data_points table            │
      │  - Transformed (for KPIs)    │
      │  - Raw (for Advanced Charts) │
      └──────────────────────────────┘
```

### 2.2 Advanced Charts Data Retrieval (Phase 5)

```
User Selects Dataset
      │
      ▼
Query: SELECT * FROM data_points
       WHERE dataset_id = ?
       AND metric_name = 'raw_csv_row'
       LIMIT 500
      │
      ▼
Extract row_data from metadata
      │
      ▼
Flatten to: { date, metric_name, metric_value, region, ... }
      │
      ▼
Auto-detect column types:
  - Date columns (date, created_at, timestamp)
  - Numeric columns (numbers)
  - Text columns (everything else)
      │
      ▼
Populate X/Y column dropdowns with ALL columns
      │
      ▼
User creates chart with any columns
```

---

## 3. Database Schema (Key Tables)

### 3.1 Core Tables

```sql
-- User profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Uploaded datasets
CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data points (dual storage)
CREATE TABLE data_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  company_id UUID REFERENCES companies(id),
  
  -- Transformed format (for dashboards)
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  metric_type TEXT,
  date_recorded TIMESTAMPTZ,
  
  -- Raw format (for charts)
  -- When metric_name = 'raw_csv_row':
  --   metadata.row_data contains full original CSV row
  --   metadata.is_raw = true
  --   metadata.columns = array of column names
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for raw row queries (Phase 5)
CREATE INDEX idx_data_points_raw 
ON data_points(dataset_id, metric_name)
WHERE metric_name = 'raw_csv_row';
```

### 3.2 Security Tables (Phase 3 & 4)

```sql
-- MFA secrets
CREATE TABLE mfa_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MFA backup codes
CREATE TABLE mfa_backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trusted devices
CREATE TABLE mfa_trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  trusted_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limiting
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  limit_type TEXT NOT NULL, -- 'upload' or 'ai_query'
  count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Security Architecture (Phase 4 Hardening)

### 4.1 Encryption Flow (Web Crypto API)

```
Password
  │
  ▼
PBKDF2 Key Derivation
  - 100,000 iterations
  - SHA-256
  - Random salt (16 bytes)
  │
  ▼
AES-256-GCM Key
  │
  ▼
Encrypt Data
  - Random IV (12 bytes)
  - Authentication tag
  │
  ▼
Encrypted Data + IV + Salt
```

### 4.2 Authentication Flow (with MFA)

```
1. User enters email + password
       │
       ▼
2. Supabase Auth validates
       │
       ▼
3. Check if MFA enabled
       │
       ├─ NO → Login complete
       │
       └─ YES → Prompt for TOTP
              │
              ▼
          Verify TOTP (6-digit code)
              │
              ├─ Valid → Check device trust
              │          │
              │          ├─ Trusted → Login complete
              │          └─ New → Offer to trust device
              │
              └─ Invalid → Allow backup code
                        │
                        ├─ Valid → Consume code, login
                        └─ Invalid → Deny access
```

### 4.3 Validation Architecture (Zod)

```typescript
// Centralized schemas (src/lib/validation.ts)
const emailSchema = z.string().email().toLowerCase();

const passwordSchema = z.string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Z]/, 'One uppercase letter')
  .regex(/[a-z]/, 'One lowercase letter')
  .regex(/[0-9]/, 'One number')
  .regex(/[^A-Za-z0-9]/, 'One special character');

// Usage in forms
try {
  const validated = loginSchema.parse(formData);
  // Proceed with validated data
} catch (error) {
  // Display user-friendly errors
}
```

---

## 5. Frontend Architecture

### 5.1 Component Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── MFASetup.tsx (Phase 3)
│   │   ├── MFAVerify.tsx (Phase 3)
│   │   └── LoginForm.tsx
│   ├── charts/
│   │   ├── DataSourcePicker.tsx (Phase 5)
│   │   ├── ChartFilters.tsx
│   │   └── ChartCustomizer.tsx
│   ├── dashboard/
│   │   └── (KPI widgets)
│   └── SEO.tsx (Phase 4)
│
├── hooks/
│   ├── useDataUpload.ts (Phase 5: dual storage)
│   ├── useAuth.ts
│   └── useChartData.ts
│
├── lib/
│   ├── encryption.ts (Phase 1: Web Crypto API)
│   ├── mfa.ts (Phase 3)
│   ├── validation.ts (Phase 4: Zod schemas)
│   ├── passwordSecurity.ts (Phase 4: zxcvbn)
│   └── rateLimit.ts
│
└── pages/
    ├── AdvancedCharts.tsx (Phase 5: enhanced)
    ├── MFASettings.tsx (Phase 3)
    └── (other pages with SEO)
```

### 5.2 State Management

**React Query for Server State:**

```typescript
// Automatic caching, refetching, invalidation
const { data, isLoading } = useQuery({
  queryKey: ['datasets', userId],
  queryFn: fetchDatasets,
});

// Invalidate after upload (Phase 5)
queryClient.invalidateQueries({ queryKey: ['datasets'] });
```

**React useState for UI State:**

```typescript
const [selectedDatasetId, setSelectedDatasetId] = useState<string>();
const [xColumn, setXColumn] = useState<string>();
const [yColumn, setYColumn] = useState<string>();
```

---

## 6. Key Design Decisions

### 6.1 Dual Storage Strategy (Phase 5)

**Problem**: Dashboard needs transformed data, but Advanced Charts needs original columns.

**Solution**: Store both formats:

1. **Transformed rows** (metric_name, metric_value, date_recorded) for dashboards
2. **Raw CSV rows** (metric_name='raw_csv_row', full data in metadata) for charts

**Benefits**:

- No breaking changes to existing dashboards
- Full column access in Advanced Charts
- Backward compatible

**Trade-offs**:

- 2x storage (acceptable for typical datasets)
- Slightly slower uploads (minimal impact)

### 6.2 Web Crypto API vs. Libraries (Phase 1)

**Decision**: Use browser-native Web Crypto API instead of @noble/ciphers

**Rationale**:

- Avoided Vite bundler issues
- Better performance (native implementation)
- No external dependencies
- Better browser compatibility

**Implementation**:

```typescript
// AES-256-GCM encryption
const key = await crypto.subtle.importKey(...);
const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  data
);
```

### 6.3 Client-Side Validation with Zod (Phase 4)

**Decision**: Centralized Zod schemas in `src/lib/validation.ts`

**Benefits**:

- Type-safe validation
- Reusable across components
- Better error messages
- Auto-completion in IDE

**Alternative Considered**: Server-only validation
**Rejected Because**: Poor UX (slow feedback), wasted network requests

### 6.4 Rate Limiting Design

**Implementation**: Database-backed with sliding window

**Configuration**:

```typescript
const RATE_LIMITS = {
  upload: { limit: 10, windowHours: 24 },
  ai_query: { limit: 1000, windowHours: 24 },
};
```

**Why Database?** Prevents circumvention, works across devices/sessions

---

## 7. Performance Considerations

### 7.1 Query Optimization

**Advanced Charts Query**:

```sql
-- Only fetch raw CSV rows
SELECT * FROM data_points
WHERE dataset_id = $1
  AND metric_name = 'raw_csv_row'
LIMIT 500;  -- Prevent excessive data transfer
```

**Index**: `idx_data_points_raw` for fast filtering

### 7.2 Frontend Optimization

- **useMemo** for expensive calculations (column detection)
- **React.lazy** for code splitting
- **TanStack Query caching** (5-minute stale time)
- **Recharts** renders only visible data points

### 7.3 Known Limitations

| Feature | Limit | Mitigation |
|---------|-------|------------|
| Chart display | 500 rows | Pagination (future) |
| Upload size | Browser memory | Chunking (future) |
| Concurrent uploads | 1 at a time | Queue (future) |

---

## 8. SEO Architecture (Phase 4)

### 8.1 Implementation

```tsx
// Per-page SEO
<SEO
  title="Advanced Charts - Biz Stratosphere"
  description="Create custom visualizations..."
  canonical="/advanced-charts"
/>
```

**Renders**:

```html
<head>
  <title>Advanced Charts - Biz Stratosphere</title>
  <meta name="description" content="..." />
  <link rel="canonical" href="..." />
  <meta property="og:title" content="..." />
  <!-- etc -->
</head>
```

### 8.2 Static Files

- **robots.txt**: Allow all, sitemap reference
- **sitemap.xml**: Static list of public pages

---

## 9. Testing Strategy

### 9.1 Unit Tests

- Encryption functions (30 tests)
- Validation schemas
- MFA utilities

### 9.2 Integration Tests

- Upload flow end-to-end
- Chart rendering with real data
- MFA setup and verification

### 9.3 Manual Testing

- Browser compatibility
- Responsive design
- Accessibility (keyboard nav, screen readers)

---

## 10. Deployment Architecture

```
GitHub
  │
  ├─ Push to main
  │    │
  │    ▼
  │  Vercel/Netlify
  │    │
  │    ├─ Build: npm run build
  │    ├─ Deploy: dist/
  │    └─ CDN distribution
  │
  └─ Supabase
       │
       ├─ Migrations: supabase db push
       ├─ Edge Functions: supabase functions deploy
       └─ Realtime: Auto-configured
```

---

## 11. Monitoring & Observability

### 11.1 Error Tracking

- Console error logging
- Supabase function logs
- User-facing error boundaries

### 11.2 Analytics

- Page views (via SEO metadata)
- API usage tracking (rate_limits table)
- Chart usage metrics

### 11.3 Performance Monitoring

- React DevTools Profiler
- Lighthouse scores
- Real User Monitoring (future)

---

## 12. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 2024 | Initial design |
| 1.5 | Dec 2024 | Added MFA architecture |
| 2.0 | Dec 17, 2024 | Added Phase 4 (SEO, validation) & Phase 5 (dual storage) |
