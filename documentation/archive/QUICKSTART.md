# 🚀 Biz Stratosphere - Quick Start Guide

## ⚡ Get Started in 5 Minutes

### Prerequisites

- Node.js 18+
- Git

### Setup Steps

**1. Clone & Install**

```bash
git clone <your-repo-url>
cd biz-stratosphere
npm install
```

**2. Environment Variables**

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GEMINI_API_KEY=your_gemini_key (optional)
```

**3. Start Development**

```bash
npm run dev
```

Open <http://localhost:8080>

**4. First Login**

- Click "Sign Up"
- Create account
- Start using!

---

## 📊 Try These Features

### Upload Data

1. Go to Dashboard
2. Find "Enhanced Data Upload"
3. Upload `sample_churn_data.csv` (in project root)
4. Click Analyze → Upload

### Create Chart

1. Click "Advanced Charts"
2. Select your dataset
3. Choose chart type (Bar, Line, Pie, etc.)
4. Select X and Y columns
5. View chart!

### Generate Report

1. Click "Reports"
2. Choose template
3. Select dataset
4. Click "Generate Report"
5. Export as PDF/Excel/CSV

---

## 🎯 What's Included

✅ **Dashboard** - KPIs and analytics
✅ **Charts** - 8 visualization types
✅ **Reports** - Professional exports
✅ **AI Chat** - Ask data questions (needs API key)
✅ **ML Predictions** - Churn forecasting (needs ML service)
✅ **API** - REST endpoints
✅ **Workspaces** - Team collaboration

---

## 🐛 Troubleshooting

**Port already in use?**

```bash
# Kill process on port 8080
npx kill-port 8080
npm run dev
```

**Database errors?**

- Check Supabase credentials in `.env.local`
- Ensure migrations are run

**No data showing?**

- Upload sample data first
- Check browser console for errors

---

## 📖 Full Documentation

- **User Guide:** See `user_guide_complete.md` artifact
- **README:** See GitHub README.md
- **Testing:** See `e2e_testing_complete.md` artifact

---

## ✨ Key Features

**Business Intelligence:**

- Real-time KPI dashboard
- 8 chart types
- Custom reports
- Data upload (CSV/Excel)

**AI & ML:**

- RAG-powered chatbot
- ML model serving
- Churn prediction
- SHAP explanations

**Collaboration:**

- Workspaces
- Team management
- API access
- Webhooks

---

**Ready to Go!** 🎉

Your platform is production-ready with:

- Professional UI/UX
- Complete documentation
- Verified functionality
- Sample data included

*For detailed guides, see artifacts created during session.*
