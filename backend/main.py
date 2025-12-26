from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .database import engine, Base
from . import models
from dotenv import load_dotenv
import os

load_dotenv() # Load .env file if present

from .routers import auth, admin, kpis, realtime, ai, ai_comparison, users, ai_report, upload, chat, analytics, alerts, products, integrations
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

from fastapi import Request
from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = f"GLOBAL CRASH: {str(exc)}\n{traceback.format_exc()}\n"
    print(error_msg)
    with open("global_errors.log", "a") as f:
        f.write(error_msg)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error_id": "Logged locally"},
    )

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(kpis.router)
app.include_router(realtime.router)
app.include_router(ai.router)
app.include_router(ai_comparison.router)
app.include_router(ai_report.router)
app.include_router(users.router)
app.include_router(upload.router)
app.include_router(chat.router)
app.include_router(analytics.router)
app.include_router(alerts.router)
app.include_router(products.router)
app.include_router(integrations.router)

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
