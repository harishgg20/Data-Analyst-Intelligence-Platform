from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List

from .. import database, dependencies, models, schemas
from ..services import ai_service, kpi_service
from ..limiter import limiter

    prefix="/api/ai",
    tags=["AI Insights"],
    # dependencies=[Depends(dependencies.require_admin)] # Disabled for Demo purposes
)

@router.post("/generate", response_model=schemas.AIInsightResponse)
@limiter.limit("5/minute")
async def generate_insight(request: Request, db: AsyncSession = Depends(database.get_db)):
    # 1. Fetch KPI Context
    revenue = await kpi_service.calculate_total_revenue(db, None, None)
    categories = await kpi_service.calculate_revenue_by_category(db)
    
    kpi_context = {
        "total_revenue": revenue,
        "revenue_by_category": categories
    }
    
    # 2. Call AI Service
    insight_json = await ai_service.generate_business_insight(kpi_context)
    
    # 3. Save to DB
    insight = await ai_service.save_insight(db, insight_json)
    
    if not insight:
        raise HTTPException(status_code=500, detail="Failed to generate/save insight")
        
    return insight

@router.get("/insights")
async def get_insights(db: AsyncSession = Depends(database.get_db)):
    query = select(models.AIInsight).order_by(desc(models.AIInsight.created_at)).limit(10)
    result = await db.execute(query)
    return result.scalars().all()
