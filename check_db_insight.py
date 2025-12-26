import asyncio
import sys
import os
from sqlalchemy import select

# Add current directory to path
sys.path.append(os.getcwd())

from backend.database import AsyncSessionLocal
from backend.models import AIInsight

async def check_insights():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(AIInsight).order_by(AIInsight.created_at.desc()).limit(1))
        insight = result.scalar_one_or_none()
        if insight:
            print(f"Latest Insight: {insight.title}")
            print(f"Content: {insight.content[:100]}...")
        else:
            print("No insights found.")

if __name__ == "__main__":
    asyncio.run(check_insights())
