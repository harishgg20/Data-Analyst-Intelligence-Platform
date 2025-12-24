from fastapi import APIRouter, Depends
from pydantic import BaseModel
import json
from .. import dependencies
from ..services import ai_service, kpi_service
# We might need database session if we query kpis directly, but kpi_service might already handle it or we mock for speed as per previous patterns.
# Actually, kpi_service functions need db session. 
# For this task, to keep it consistent with previous patterns where we simulated or used simple dependencies:
# I will use dependencies.get_db if needed.

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Reporting"],
    # dependencies=[Depends(dependencies.require_viewer)]
)

class ReportRequest(BaseModel):
    period: str = "This Month"

@router.post("/executive-summary")
async def generate_executive_summary(request: ReportRequest):
    # In a real app, we would fetch actual aggregate data here.
    # We'll use the same mock/simulated values as the comparison or overview for consistency.
    
    kpi_snapshot = {
        "period": request.period,
        "total_revenue": 52450,
        "revenue_growth": "+12.5%",
        "active_customers": 120,
        "customer_growth": "+5%",
        "top_product": "Premium Plan",
        "challenges": "High churn in Basic tier"
    }
    
    prompt = f"""
    You are a Chief Strategy Officer. Write a professional Executive Summary for the following business performance data.
    
    Data:
    {json.dumps(kpi_snapshot, indent=2)}
    
    Structure:
    1. **Performance Overview**: High-level summary of revenue and growth.
    2. **Key Drivers**: What went well (Top product, new customers).
    3. **Strategic Risks**: addressing challenges.
    4. **Recommendations**: 2-3 bullet points on what to do next.
    
    Tone: Professional, concise, authoritative.
    Format your response in Markdown.
    """
    
    # We use our friendly ai_service. 
    # Note: generate_business_insight returns a JSON usually, but we want text here.
    # However, our updated generate_business_insight might still try to wrap it if the default prompt was used.
    # But we are overriding the prompt.
    # The current ai_service implementation (from previous step) returns `model.generate_content(prompt).text`.
    # So it returns a string. Perfect.
    
    summary_text = await ai_service.generate_business_insight({}, prompt_override=prompt)
    
    return {
        "report_date": "2024-08-25",
        "period": request.period,
        "summary_markdown": summary_text
    }
