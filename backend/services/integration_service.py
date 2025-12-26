from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .. import models
import random
from datetime import datetime, timedelta

async def sync_provider(provider: str, db: AsyncSession):
    """
    Simulates fetching data from an external provider (Shopify, Stripe, etc.)
    and inserting it into the local database.
    """
    
    # 1. Generate Mock Products (if Shopify)
    if provider == 'shopify':
        suffixes = ["Pro", "Lite", "Plus", "Max", "Ultra", "Essential"]
        types = ["Widget", "Gadget", "Tool", "Device", "System"]
        
        # Create 2 random products
        for _ in range(2):
            name = f"{random.choice(suffixes)} {random.choice(types)} {random.randint(100, 999)}"
            price = round(random.uniform(19.99, 299.99), 2)
            product = models.Product(
                name=name,
                category=random.choice(["Electronics", "Home", "Office", "Wearables"]),
                price=price,
                cost=round(price * 0.4, 2), # 60% margin
                stock_quantity=random.randint(10, 100),
                sku=f"SKU-{random.randint(10000, 99999)}"
            )
            db.add(product)
    
    # 2. Get existing customers and products to link orders
    res_cust = await db.execute(select(models.Customer))
    customers = res_cust.scalars().all()
    
    if not customers:
        # Create a dummy customer if none exist
        c = models.Customer(name="Guest User", email="guest@example.com", region="NA")
        db.add(c)
        await db.commit()
        customers = [c]

    res_prod = await db.execute(select(models.Product))
    products = res_prod.scalars().all()
    
    if not products:
        return {"status": "error", "message": "No products to create orders from"}

    # 3. Generate Mock Orders (5-10)
    num_orders = random.randint(5, 10)
    new_revenue = 0.0
    
    for _ in range(num_orders):
        customer = random.choice(customers)
        # Random date within last 7 days
        days_ago = random.randint(0, 7)
        created_at = datetime.now() - timedelta(days=days_ago)
        
        order = models.Order(
            customer_id=customer.id,
            status="completed",
            total_amount=0, # Will calc
            created_at=created_at
        )
        db.add(order)
        await db.flush() # Get ID
        
        # Add items
        num_items = random.randint(1, 3)
        total = 0.0
        
        for _ in range(num_items):
            prod = random.choice(products)
            qty = random.randint(1, 2)
            item = models.OrderItem(
                order_id=order.id,
                product_id=prod.id,
                quantity=qty,
                price_at_purchase=prod.price
            )
            db.add(item)
            total += prod.price * qty
            
            # Update stock
            if prod.stock_quantity >= qty:
                prod.stock_quantity -= qty
        
        order.total_amount = total
        new_revenue += total
        
    await db.commit()
    
    return {
        "status": "success", 
        "message": f"Successfully synced {provider}", 
        "details": {
            "orders_imported": num_orders, 
            "revenue_added": round(new_revenue, 2)
        }
    }
