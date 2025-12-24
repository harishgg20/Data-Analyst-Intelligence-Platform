# Data Analysis Intelligence Platform

A comprehensive, full-stack business intelligence dashboard powered by AI. This platform provides real-time analytics, AI-generated insights, and interactive data visualization for e-commerce businesses.

## 🚀 Features

### Core Analytics
- **Real-time Dashboard**: Live updates of revenue, orders, and customer counts via WebSockets.
- **Interactive Charts**: Revenue trends, category distribution, and regional analysis using Recharts.
- **Filtering**: Dynamic filtering by date range, category, and region.

### AI Intelligence (Gemini Powered)
- **Business Insights**: Automatically generated text explaining trends and anomalies.
- **Root Cause Analysis**: Drill-down into specific metrics to understand *why* they changed.
- **Period Comparison**: AI-driven explanation of performance differences between time periods.
- **Executive Summaries**: One-click generation of professional executive reports.
- **Voice Narration**: Text-to-speech playback for insights.

### Reporting & Tools
- **PDF Exports**: Download dashboard snapshots and executive summaries as PDF.
- **User Settings**: Profile management and admin configuration.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, Framer Motion (simulated), Lucide Icons.
- **Backend**: FastAPI (Python), SQLAlchemy, Pydantic, Uvicorn.
- **Database**: PostgreSQL (Dockerized).
- **AI**: Google Gemini API (Free Tier).
- **Real-time**: WebSockets.

## 📦 Setup & Installation

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.10+
- Google Gemini API Key

### 1. Database Setup
```bash
docker-compose up -d
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000/dashboard` to view the application.

## 📂 Project Structure

```
├── backend/
│   ├── routers/       # API endpoints (auth, kpis, ai, realtime)
│   ├── services/      # Business logic and external API calls
│   ├── models.py      # Database models
│   └── main.py        # App entry point
├── frontend/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # Reusable UI components
│   ├── hooks/         # Custom React hooks (useWebSocket)
│   └── utils/         # Helpers (PDF export)
└── docs/              # Architecture documentation
```
