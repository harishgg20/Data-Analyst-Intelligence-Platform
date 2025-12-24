# Data Analysis Intelligence Platform 📊🤖

A cutting-edge, **AI-powered Business Intelligence Dashboard** designed to transform raw e-commerce data into actionable insights. Built with **Next.js 14**, **FastAPI**, and **Google Gemini AI**.

[![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688)](https://fastapi.tiangolo.com/)
[![Powered by Gemini](https://img.shields.io/badge/AI-Gemini%20Pro-4285F4)](https://deepmind.google/technologies/gemini/)

## 🚀 Features

### 🧠 Generative AI Intelligence
- **Real-time Business Insights**: Automatically detects trends, anomalies, and opportunities in your sales data.
- **Comparison Analysis**: Select any two time periods, and the AI will analyze "Why did revenue drop/grow?" by decomposing the drivers.
- **Executive Summaries**: One-click generation of professional PDF reports for C-suite stakeholders.
- **Voice Narration**: Listen to your daily business brief with text-to-speech integration.

### 📈 Core Analytics
- **Live WebSocket Streaming**: Watch orders and revenue update in real-time without refreshing.
- **Interactive Visualizations**:
  - Revenue Trend Lines
  - Category Performance Bars
  - Regional Heatmaps
- **Drill-Down Filters**: Slice data by Date, Category, Region, and Marketing Channel.

### 🛡️ Enterprise Ready
- **Role-Based Access**: Secure Admin vs. Viewer roles.
- **PDF Exports**: Instant high-quality exports of dashboard views.
- **Data Security**: JWT Authentication and securely hashed passwords.

## 🛠️ Technology Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Frontend** | Next.js 15 (App Router) | React framework with Server Components & Turbopack |
| **UI/UX** | Tailwind CSS, Lucide | Modern styling and accessible icons |
| **Charts** | Recharts | Composable charting library |
| **Backend** | FastAPI | High-performance Python web framework |
| **Database** | PostgreSQL + SQLAlchemy | Async database access |
| **AI Model** | Google Gemini 1.5 Flash | Fast, cost-effective LLM for reasoning |
| **Realtime** | WebSockets | Push-based updates from server to client |

## 📦 Setup & Installation

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL** (or Docker to run it)
- **Google Gemini API Key** (Free tier available)

### Quick Start (Local Demo)

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/harishgg20/Data-Analyst-Intelligence-Platform.git
    cd Data-Analyst-Intelligence-Platform
    ```

2.  **Setup Backend**
    ```bash
    cd backend
    python -m venv venv
    
    # Windows
    venv\Scripts\activate
    # Mac/Linux
    # source venv/bin/activate
    
    pip install -r requirements.txt
    ```

3.  **Configure Environment**
    Create a `.env` file in `backend/`:
    ```ini
    DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/data_platform
    SECRET_KEY=your_secret_key
    ALGORITHM=HS256
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

4.  **Seed Data (Optional)**
    Run the seeder to populate the database with mock customers and orders:
    ```bash
    python -m backend.seed
    ```

5.  **Run Servers**
    *Terminal 1 (Backend):*
    ```bash
    uvicorn backend.main:app --reload
    ```
    
    *Terminal 2 (Frontend):*
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

6.  **Explore**
    Open [http://localhost:3000](http://localhost:3000) to view the dashboard!

## 📂 Project Structure

```bash
├── backend/
│   ├── routers/       # API endpoints (auth, kpis, ai, realtime)
│   ├── services/      # Business logic (AI processing, DB queries)
│   ├── models.py      # SQLAlchemy database models
│   └── main.py        # App entry point
├── frontend/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # Reusable UI components (Charts, AI Timeline)
│   └── hooks/         # Custom React hooks
└── docs/              # Architecture documentation
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
