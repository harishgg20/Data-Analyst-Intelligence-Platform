import asyncio
from backend.database import async_session
from backend.models import AIInsight
from sqlalchemy import select

async def check_insights():
    async with async_session() as db:
        result = await db.execute(select(AIInsight))
        insights = result.scalars().all()
        print(f"Total Insights Found: {len(insights)}")
        for i in insights:
            print(f"ID: {i.id}, Type: {i.type}, Created: {i.created_at}")

if __name__ == "__main__":
    asyncio.run(check_insights())
