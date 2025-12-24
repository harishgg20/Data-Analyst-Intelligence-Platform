# System Architecture

## Overview
The Data Analysis Intelligence Platform follows a modern, decoupled architecture separating the frontend user interface from the backend data processing and AI services.

## High-Level Diagram

```mermaid
graph TD
    User[User] -->|HTTPS| Frontend[Next.js Frontend]
    Frontend -->|REST API| Backend[FastAPI Backend]
    Frontend -->|WebSocket| Backend
    Backend -->|SQL| DB[(PostgreSQL)]
    Backend -->|API| AI[Gemini AI]
    
    subgraph "Backend Services"
        Auth[Auth Service]
        KPI[KPI Engine]
        Realtime[WebSocket Manager]
        AISvc[AI Service]
    end
    
    Backend --> Auth
    Backend --> KPI
    Backend --> Realtime
    Backend --> AISvc
```

## Data Flow

1. **Ingestion**: Transactional data is stored in PostgreSQL.
2. **Processing**: `KPI Service` aggregates raw data into meaningful metrics (Revenue, AOV).
3. **Streaming**: `WebSocket Manager` pushes updates to connected clients every 30 seconds.
4. **Intelligence**: 
   - `AI Service` queries aggregated KPIs.
   - Formats a prompt for Gemini.
   - Parses the JSON response and stores it in the `ai_insights` table.
   - Frontend fetches or receives these insights.

## Security
- **Authentication**: JWT (JSON Web Tokens) for stateless session management.
- **Authorization**: Role-based access control (RBAC) ensuring only Admins can trigger costly AI generation.
- **Environment**: Sensitive keys (DB credentials, API keys) are managed via `.env` files.
