# 🚀 Biz Stratosphere

**AI-Powered Business Intelligence & Analytics Platform**

An enterprise-grade analytics platform that combines business intelligence, machine learning, and AI-powered insights to help organizations make data-driven decisions.

---

## ✨ Features

### 📊 **Business Intelligence**

- **Real-time Analytics Dashboard** - Monitor KPIs with live data updates
- **Advanced Charts & Visualizations** - 8 chart types (Bar, Line, Pie, Scatter, Radar, Treemap, Gauge, Funnel)
- **Custom Reports** - Generate professional PDF, Excel, and CSV reports
- **Data Upload** - CSV/Excel file upload with automatic quality analysis

### 🤖 **AI & Machine Learning**

- **RAG-Powered Chatbot** - Ask questions about your data in natural language
- **ML Model Serving** - Deploy and serve custom machine learning models
- **SHAP Explainability** - Understand ML model predictions
- **Churn Prediction** - Predict customer churn with ML

### 📈 **Data Management**

- **Multi-Dataset Support** - Manage multiple datasets simultaneously
- **Data Quality Checks** - Automatic PII detection and validation
- **Real-time Updates** - Supabase realtime subscriptions
- **Secure Storage** - Enterprise-grade data security

### 🔧 **Developer Features**

- **RESTful API** - Full API with authentication
- **API Management** - Generate and manage API keys
- **Webhooks** - Real-time event notifications  
- **Usage Analytics** - Track API usage and limits

### 👥 **Collaboration**

- **Workspaces** - Organize projects and teams
- **Team Management** - Role-based access control
- **Shared Reports** - Collaborate on insights

---

## 🛠️ Tech Stack

### Frontend

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TanStack Query** - Data fetching and caching
- **Shadcn UI** - Component library
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **jsPDF** - Professional PDF exports

### Backend

- **Supabase** - Backend as a service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication
  - Row-Level Security (RLS)
  - Edge Functions
- **Python ML Service** - FastAPI-based ML serving

### AI/ML

- **Google Gemini API** - RAG and embeddings
- **pgvector** - Vector similarity search
- **SHAP** - Model explainability
- **Custom ML Models** - Churn prediction, forecasting

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+ (for ML service)
- **Supabase** account
- **Google AI API** key (for RAG features)

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd biz-stratosphere
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_ML_SERVICE_URL=http://localhost:8000
```

4. **Run database migrations**

```bash
# Set up Supabase tables
supabase db push
```

5. **Start development server**

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

### ML Service Setup (Optional)

1. **Navigate to ML service directory**

```bash
cd ml-service
```

2. **Install Python dependencies**

```bash
pip install -r requirements.txt
```

3. **Start ML service**

```bash
uvicorn main:app --reload --port 8000
```

---

## 📁 Project Structure

```
biz-stratosphere/
├── src/
│   ├── components/        # React components
│   │   ├── dashboard/     # Dashboard widgets
│   │   ├── charts/        # Chart components
│   │   └── ui/            # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── pages/             # Page components
│   └── integrations/      # Third-party integrations
│       └── supabase/      # Supabase client
├── supabase/
│   ├── migrations/        # Database migrations
│   └── functions/         # Edge functions
├── ml-service/            # Python ML service
│   ├── main.py           # FastAPI app
│   └── models/           # ML models
└── public/               # Static assets
```

---

## 🔒 Security Features

- **Row-Level Security (RLS)** - Secure data access
- **JWT Authentication** - Secure API endpoints
- **API Key Management** - Controlled access
- **PII Detection** - Automatic sensitive data detection
- **Audit Logging** - Track all user actions
- **CSRF Protection** - Cross-site request forgery prevention
- **Rate Limiting** - Prevent abuse

---

## 📊 Database Schema

The platform uses the following main tables:

- `profiles` - User profiles and settings
- `datasets` - Uploaded data files
- `data_points` - Individual data records
- `reports` - Generated reports
- `chart_data` - Saved chart configurations
- `api_keys` - API key management
- `notifications` - User notifications
- `workspaces` - Team workspaces
- `embeddings` - Vector embeddings for RAG
- `ml_predictions` - ML model predictions

See `/supabase/migrations/` for complete schema.

---

## 🚢 Deployment

### Frontend (Vercel/Netlify)

1. **Build production bundle**

```bash
npm run build
```

2. **Deploy to Vercel**

```bash
vercel --prod
```

Or **deploy to Netlify**:

```bash
netlify deploy --prod --dir=dist
```

### ML Service (Docker)

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY ml-service/requirements.txt .
RUN pip install -r requirements.txt
COPY ml-service/ .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and deploy:

```bash
docker build -t biz-stratosphere-ml .
docker run -p 8000:8000 biz-stratosphere-ml
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run E2E tests
npm run test:e2e

# Run unit tests
npm run test:unit
```

---

## 📖 API Documentation

Access the interactive API documentation at `/help` after starting the development server.

### Example API Call

```bash
curl -X POST https://your-domain.com/api/predict \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "churn_prediction",
    "data": {
      "tenure": 24,
      "monthly_charges": 79.99,
      "total_charges": 1919.76
    }
  }'
```

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
- **Shadcn UI** - Beautiful component library
- **Recharts** - Data visualization
- **Lucide** - Icon library

---

## 📧 Support

For support and questions:

- 📧 Email: <support@bizstratosphere.com>
- 📖 Documentation: [docs.bizstratosphere.com](https://docs.bizstratosphere.com)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/biz-stratosphere/issues)

---

## 🗺️ Roadmap

- [ ] Real-time collaboration
- [ ] Mobile app (React Native)
- [ ] Advanced ML model marketplace
- [ ] Custom embedding models
- [ ] Scheduled reports
- [ ] Data warehouse integration
- [ ] Custom dashboards builder

---

**Built with ❤️ by the Biz Stratosphere Team**

*Transform your data into insights with AI-powered analytics.*
