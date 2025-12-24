import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import engine, Base, AsyncSessionLocal
from backend import models, auth
from sqlalchemy import select
from datetime import datetime, timedelta
import random

async def seed_data():
    async with engine.begin() as conn:
        # Optional: Drop tables to reset? Better to just append if empty.
        # await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Check if data exists
        result = await db.execute(select(models.User).limit(1))
        if result.scalar():
            print("Data already exists. Skipping seed.")
            return

        print("Seeding Users...")
        admin_user = models.User(
            email="admin@example.com",
            hashed_password=auth.get_password_hash("admin123"),
            role=models.UserRole.ADMIN
        )
        viewer_user = models.User(
            email="viewer@example.com",
            hashed_password=auth.get_password_hash("viewer123"),
            role=models.UserRole.VIEWER
        )
        db.add_all([admin_user, viewer_user])

        print("Seeding Products...")
        categories = ["Electronics", "Fashion", "Home", "Beauty", "Sports"]
        products = []
        for i in range(20):
            cat = random.choice(categories)
            prod = models.Product(
                name=f"{cat} Product {i+1}",
                category=cat,
                price=round(random.uniform(20.0, 500.0), 2),
                cost=round(random.uniform(10.0, 250.0), 2)
            )
            products.append(prod)
            db.add(prod)
        await db.commit() # Commit to get IDs

        print("Seeding Customers...")
        regions = ["North America", "Europe", "Asia", "RoW"]
        customers = []
        for i in range(50):
            cust = models.Customer(
                name=f"Customer {i+1}",
                email=f"customer{i+1}@test.com",
                region=random.choice(regions)
            )
            customers.append(cust)
            db.add(cust)
        await db.commit()

        print("Seeding Orders...")
        orders = []
        # Create orders over last 3 months
        start_date = datetime.now() - timedelta(days=90)
        
        for _ in range(200):
            cust = random.choice(customers)
            order_date = start_date + timedelta(days=random.randint(0, 90))
            
            # Create Order
            order = models.Order(
                customer_id=cust.id,
                created_at=order_date,
                status="completed",
                total_amount=0 # Will calc below
            )
            db.add(order)
            await db.commit() # Get Order ID
            
            # Add Items
            num_items = random.randint(1, 5)
            total = 0
            for _ in range(num_items):
                prod = random.choice(products)
                qty = random.randint(1, 3)
                item = models.OrderItem(
                    order_id=order.id,
                    product_id=prod.id,
                    quantity=qty,
                    price_at_purchase=prod.price
                )
                db.add(item)
                total += prod.price * qty
            
            order.total_amount = total
            db.add(order)
        
        await db.commit()
        print("Seeding Complete!")

if __name__ == "__main__":
    asyncio.run(seed_data())
