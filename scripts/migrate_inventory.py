import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from backend.database import DATABASE_URL
import os

# Ensure we use the URL from env if available (logic from main.py/database.py)
# But here we just import DATABASE_URL from backend.database provided it's configured correctly.

async def migrate():
    print(f"Connecting to database...")
    engine = create_async_engine(DATABASE_URL)
    
    async with engine.begin() as conn:
        print("Adding stock_quantity column...")
        await conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;"))
        
        print("Adding sku column...")
        await conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR;"))
        
        print("Adding low_stock_threshold column...")
        await conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10;"))
        
    print("Migration complete!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate())
