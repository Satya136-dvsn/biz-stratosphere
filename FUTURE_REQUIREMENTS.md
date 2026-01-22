# Future Requirements & Roadmap

Based on the current project status (100% Phase 1-3 completion) and the original requirements, the following items represent the next phase of development.

## 1. High Priority Enhancements (Immediate Next Steps)

These features address current limitations in data handling and user feedback.

- [ ] **Pagination for Large Datasets**:
  - Current: Limited to top 500 rows for display.
  - Requirement: Server-side pagination to support browsing datasets >500 rows.
- [ ] **Data Validation Reports**:
  - Current: Rows with errors are skipped or basic errors shown.
  - Requirement: Detailed downloadable report of exactly which rows failed and why (e.g., "Row 45: Invalid Email Format").
- [ ] **Explicit File Size Limits**:
  - Current: Dependent on browser memory / Supabase limits.
  - Requirement: UI enforcement of specific limits (e.g., 50MB) with clear error messages before upload starts.
- [ ] **Upload Progress Bars**:
  - Requirement: Real-time progress percentage for large file uploads.
- [ ] **Enhanced Error Reporting**:
  - Requirement: More granular error messages in the UI for failed operations.

## 2. Infrastructure & DevOps (Production Readiness)

- [ ] **Streaming ETL Pipeline**:
  - Requirement: Integration with Kafka or similar for real-time data ingestion instead of batch CSV uploads.
- [ ] **Advanced Monitoring**:
  - Requirement: Prometheus + Grafana dashboards for system metrics (CPU, Memory, API latency).
- [ ] **Docker Production Configs**:
  - Requirement: Kubernetes manifests or advanced Docker Compose setup for scalable production deployment.

## 3. Medium Priority Features

- [ ] **Data Sampling**: Allow users to preview a random sample of large datasets.
- [ ] **Outlier Detection UI**: Visual interface to highlight and handle outliers (Z-score, IQR).
- [ ] **Data Cleaning UI**:
  - Interface to fill null values (mean/median/mode) or drop columns/rows interactively.
- [ ] **Export Filtered Data**:
  - Ability to export the *currently filtered view* of the data, not just the raw dataset.
- [ ] **Aggregation Functions**:
  - UI for "Group By" operations (e.g., Sum of Revenue by Region).

## 4. Advanced AI & ML Features

- [ ] **Vector Database Integration**:
  - Requirement: Move from simple embedding matching to a dedicated Vector DB (like Pinecone or Milvus) for scalable RAG.
- [ ] **Model Drift Detection**:
  - Requirement: Automated alerts when model accuracy degrades over time.
- [ ] **AutoML**:
  - Requirement: Automated model selection and hyperparameter tuning for user datasets.

## 5. Mobile & Collaboration (Low Priority)

- [ ] **Real-time Collaboration**: Multi-user editing or viewing of dashboards (cursor tracking).
- [ ] **Mobile App**: React Native application for iOS/Android.
- [ ] **Scheduled Reports**: Emailing PDF reports on a weekly/monthly schedule.
