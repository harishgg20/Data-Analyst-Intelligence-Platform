from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .database import engine, Base
from . import models
from .routers import auth, admin, kpis, realtime, ai, ai_comparison, users, ai_report
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from .limiter import limiter

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="Data Analysis Intelligence Platform API", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(kpis.router)
app.include_router(realtime.router)
app.include_router(ai.router)
app.include_router(ai_comparison.router)
app.include_router(ai_report.router)
app.include_router(users.router)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Data Analysis Intelligence Platform API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
