import asyncio
from backend.database import AsyncSessionLocal
from backend import models
from sqlalchemy import select, func

async def check_data():
    async with AsyncSessionLocal() as db:
        # Check Orders
        result = await db.execute(select(func.count(models.Order.id)))
        order_count = result.scalar()
        print(f"Total Orders: {order_count}")
        
        # Check Analysis
        result = await db.execute(select(models.AIInsight).order_by(models.AIInsight.created_at.desc()).limit(1))
        insight = result.scalar_one_or_none()
        
        if insight:
            import json
            print(f"Latest Insight Type: {insight.type}")
            try:
                content = json.loads(insight.content)
                cols_str = f"CSV Columns: {content.get('columns')}"
                print(cols_str)
                with open("debug_cols.txt", "w") as f:
                    f.write(cols_str)
            except:
                print("Could not parse content JSON")
        else:
            print("No Insights found.")

if __name__ == "__main__":
    asyncio.run(check_data())
