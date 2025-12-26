from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List

from .. import database, dependencies, models, schemas
from ..services import ai_service, kpi_service
from ..limiter import limiter

router = APIRouter(
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

@router.post("/explain")
@limiter.limit("10/minute")
async def explain_chart(request: Request, body: dict, db: AsyncSession = Depends(database.get_db)):
    """
    Generates a contextual explanation for a chart.
    """
    chart_name = body.get("chart_name", "Chart")
    context = body.get("context", {})
    selected_item = body.get("selected_item")
    
    # Prompt Logic
    if selected_item:
        task = f"Explain the performance of '{selected_item}' specifically, comparing it to the rest of the data."
        focus = f"Selection: {selected_item}"
    else:
        task = "Explain the OVERALL TREND and key insights of the entire graph. Do not focus on just one item unless it is the clear winner/loser."
        focus = "Selection: None (Analyze Whole Graph)"

    prompt = f"""
    You are a data analyst presenting to a business executive.
    
    Chart: {chart_name}
    {focus}
    
    Task: {task}
    
    Data Context:
    {context}
    
    Rules:
    - Provide **3 to 4 sentences** of deep, actionable insight.
    - Focus on the "Why" and "So What" (business impact).
    - Be professional, direct, and insightful.
    - Return ONLY the explanation text.
    """
    
    # Call Service
    explanation = await ai_service.generate_concise_explanation(prompt)
    return {"explanation": explanation}

@router.get("/insights")
async def get_insights(db: AsyncSession = Depends(database.get_db)):
    query = select(models.AIInsight).order_by(desc(models.AIInsight.created_at)).limit(10)
    result = await db.execute(query)
    return result.scalars().all()
