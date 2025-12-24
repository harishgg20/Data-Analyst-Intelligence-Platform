import google.generativeai as genai
import os
import json
from typing import Dict, Any
from async_lru import alru_cache
from sqlalchemy.ext.asyncio import AsyncSession
from .. import models

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

@alru_cache(maxsize=32)
async def generate_business_insight_cached(kpi_data_json: str, prompt_override: str = None) -> str:
    kpi_data = json.loads(kpi_data_json)
    if not api_key:
        return "Gemini API Key not configured."

    model = genai.GenerativeModel('gemini-1.5-flash')
    
    if prompt_override:
        prompt = prompt_override
    else:
        prompt = f"""
        You are a senior business intelligence analyst. Analyze the following KPI data and generate a concise, actionable insight.
        Focus on trends, anomalies, or opportunities for growth.
        
        Data:
        {json.dumps(kpi_data, indent=2)}
        
        Format your response as a JSON object with the following fields:
        - title: A short headline for the insight.
        - type: "TREND" | "ANOMALY" | "PREDICTION"
        - content: A 2-3 sentence explanation.
        - confidence_score: A float between 0.0 and 1.0 representing your confidence.
        """

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating insight: {e}")
        return json.dumps({
            "title": "Analysis Unavailable",
            "type": "ANOMALY",
            "content": "Could not generate insight at this time.",
            "confidence_score": 0.0
        })

async def generate_business_insight(kpi_data: Dict[str, Any], prompt_override: str = None) -> str:
    # Wrapper to handle dict -> json string for cacheability
    return await generate_business_insight_cached(json.dumps(kpi_data, sort_keys=True), prompt_override)

async def save_insight(db: AsyncSession, insight_json: str):
    try:
        data = json.loads(insight_json)
        new_insight = models.AIInsight(
            title=data.get("title", "New Insight"),
            type=data.get("type", "TREND"),
            content=data.get("content", ""),
            confidence_score=data.get("confidence_score", 0.8)
        )
        db.add(new_insight)
        await db.commit()
        await db.refresh(new_insight)
        return new_insight
    except json.JSONDecodeError:
        print("Failed to decode AI response")
        return None
