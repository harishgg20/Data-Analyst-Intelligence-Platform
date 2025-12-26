import asyncio
from backend.database import engine, Base
from sqlalchemy import text

async def clear_data():
    async with engine.begin() as conn:
        print("Clearing all data...")
        # Truncate tables with cascade to handle foreign keys
        await conn.execute(text("TRUNCATE TABLE order_items CASCADE;"))
        await conn.execute(text("TRUNCATE TABLE orders CASCADE;"))
        await conn.execute(text("TRUNCATE TABLE customers CASCADE;"))
        await conn.execute(text("TRUNCATE TABLE products CASCADE;"))
        await conn.execute(text("TRUNCATE TABLE ai_insights CASCADE;"))
        # we can keep users if we want, or clear them too. Let's clear everything for a fresh start.
        await conn.execute(text("TRUNCATE TABLE users CASCADE;"))
        print("All data cleared successfully.")

if __name__ == "__main__":
    asyncio.run(clear_data())
