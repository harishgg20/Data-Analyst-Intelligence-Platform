from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import json
from .. import dependencies, database
from ..services import ai_service

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Comparison"],
    # dependencies=[Depends(dependencies.require_viewer)]
)

class ComparisonRequest(BaseModel):
    current_period_label: str = "This Month"
    previous_period_label: str = "Last Month"
    # In a real app, pass actual start/end dates

@router.post("/compare")
async def compare_periods(request: ComparisonRequest):
    # Mock data generation for demonstration
    # In production, we would query kpi_service for these two specific ranges
    
    current_data = {
        "total_revenue": 52000,
        "active_orders": 610,
        "aov": 85.2
    }
    
    previous_data = {
        "total_revenue": 45000,
        "active_orders": 570,
        "aov": 78.9
    }
    
    delta = {
        "revenue_change": "+15.5%",
        "orders_change": "+7.0%",
        "aov_change": "+8.0%"
    }
    
    prompt = f"""
    Compare the following two periods and explain the performance change.
    
    Period A ({request.previous_period_label}):
    {json.dumps(previous_data, indent=2)}
    
    Period B ({request.current_period_label}):
    {json.dumps(current_data, indent=2)}
    
    Deltas:
    {json.dumps(delta, indent=2)}
    
    Provide a brief, executive-style explanation of why performance changed (simulated reason based on the numbers).
    """
    
    # helper to reusing ai_service connection but with custom prompt
    explanation_json = await ai_service.generate_business_insight({}, prompt_override=prompt)
    
    return {
        "current": current_data,
        "previous": previous_data,
        "delta": delta,
        "ai_explanation": explanation_json
    }
