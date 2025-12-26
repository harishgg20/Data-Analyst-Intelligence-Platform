import asyncio
import sys
import os
sys.path.append(os.getcwd())
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from backend import models
from backend.database import DATABASE_URL

# Re-create engine/session logic since we are outside the app
engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def verify_data():
    async with AsyncSessionLocal() as db:
        print("\n--- Verifying Products (Category) ---")
        result = await db.execute(select(models.Product).where(models.Product.name.in_(['Laptop', 'T-Shirt'])))
        products = result.scalars().all()
        for p in products:
            print(f"Product: {p.name}, Category: {p.category}")
            if p.category in ["Electronics", "Clothing"]:
                print(f"✅ Category Match for {p.name}")
            else:
                print(f"❌ Category Mismatch for {p.name} (Expected Electronics/Clothing)")
            
        print("\n--- Verifying Orders (Dates) ---")
        # We look for orders with the specific amounts we uploaded
        result = await db.execute(select(models.Order).where(models.Order.total_amount.in_([9991.0, 9992.0, 9993.0])))
        orders = result.scalars().all()
        for o in orders:
            print(f"Order Amount: {o.total_amount}, Created At: {o.created_at}")
            if o.created_at.year == 2023:
                print(f"✅ Date Match for {o.total_amount}")
            else:
                print(f"❌ Date Mismatch for {o.total_amount} (Expected 2023)")

if __name__ == "__main__":
    asyncio.run(verify_data())
