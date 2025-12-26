import asyncio
import sys
import os
import json

# Add current directory to path
sys.path.append(os.getcwd())

from backend.database import AsyncSessionLocal
from backend.services import kpi_service, ai_service
from backend.models import User

async def force_generation():
    print("Starting Manual Insight Generation...")
    try:
        async with AsyncSessionLocal() as db:
            # 1. Fetch KPI Data (simulating what the dashboard sees)
            print("Fetching KPI Aggregates...")
            total_revenue = await kpi_service.calculate_total_revenue(db)
            orders_count = await kpi_service.count_orders(db)
            aov = await kpi_service.calculate_aov(db)
            
            # Fetch some breakdown context
            top_categories = await kpi_service.calculate_revenue_by_category(db)
            top_regions = await kpi_service.calculate_revenue_by_region(db)
            
            kpi_context = {
                "total_revenue": total_revenue,
                "orders_count": orders_count,
                "average_order_value": aov,
                "top_categories": top_categories[:3] if top_categories else [],
                "top_regions": top_regions[:3] if top_regions else []
            }
            
            print(f"Context Prepared: {json.dumps(kpi_context, indent=2)}")
            
            # 2. Generate Insight
            print("Calling Gemini AI...")
            # Customize prompt for small dataset if needed
            prompt = """
            You are a Data Analyst. Analyze this E-commerce snapshot.
            Since this might be a single day of data or a small dataset, focus on the immediate performance.
            Generate a JSON response (title, type, content, confidence_score).
            Title should be catchy. Start content with "Based on your uploaded data...".
            """
            
            insight_json = await ai_service.generate_business_insight(kpi_context, prompt_override=None)
            print(f"AI Response: {insight_json}")
            
            # 3. Save to DB
            if insight_json and "Analysis Unavailable" not in insight_json:
                # Add type="DATASET_ANALYSIS" manually since ai_service might default to TREND
                # Actually ai_service.save_insight parses the JSON.
                # We need to inject the type into the JSON or rely on the AI.
                # Better: Parse locally and save manually to ensure type="DATASET_ANALYSIS"
                
                valid_json = json.loads(insight_json)
                valid_json["type"] = "DATASET_ANALYSIS" # Force this type for Dashboard to pick it up
                
                await ai_service.save_insight(db, json.dumps(valid_json))
                print("Insight Saved Successfully!")
            else:
                print("AI failed to return valid insight.")

    except Exception as e:
        import traceback
        print(f"Error FULL: {repr(e)}")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(force_generation())
