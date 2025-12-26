from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, text
from .. import models
from typing import List, Dict, Any

async def calculate_affinity(db: AsyncSession, min_support: int = 2) -> List[Dict[str, Any]]:
    """
    Calculates Market Basket Analysis metrics (Support, Confidence, Lift)
    for product pairs found in completed orders.
    
    min_support: Minimum number of times a pair must occur to be included.
    """
    
    # 1. Finding Pairs (A, B) where A.order_id = B.order_id AND A.product_id < B.product_id
    # We use raw SQL for efficiency in self-joins and aggregation in one go, 
    # or build clean SQLAlchemy Core queries. 
    # Let's use SQLAlchemy Core for type safety if possible, or text if complex.
    
    # Query: Count co-occurrences of product pairs
    # SELECT p1.name, p2.name, COUNT(*) as frequency
    # FROM order_items oi1
    # JOIN order_items oi2 ON oi1.order_id = oi2.order_id
    # JOIN products p1 ON oi1.product_id = p1.id
    # JOIN products p2 ON oi2.product_id = p2.id
    # WHERE oi1.product_id < oi2.product_id
    # GROUP BY p1.name, p2.name
    # HAVING frequency >= min_support
    # ORDER BY frequency DESC
    
    stmt_pairs = (
        select(
            models.Product.name.label("product_a"),
            models.Product.id.label("product_a_id"),
            text("p2.name").label("product_b"),
            text("p2.id").label("product_b_id"),
            func.count().label("pair_frequency")
        )
        .select_from(models.OrderItem)
        .join(models.Product, models.OrderItem.product_id == models.Product.id)
        # Self join for the pair
        .join(
            text("order_items as oi2"), 
            text("order_items.order_id = oi2.order_id")
        )
        .join(
            text("products as p2"), 
            text("oi2.product_id = p2.id")
        )
        .where(text("order_items.product_id < oi2.product_id")) # Ensure unique pairs (A,B) not (B,A)
        .group_by(models.Product.name, models.Product.id, text("p2.name"), text("p2.id"))
        .having(func.count() >= min_support)
        .order_by(desc("pair_frequency"))
        .limit(50)
    )
    
    result_pairs = await db.execute(stmt_pairs)
    pairs = result_pairs.all()
    
    if not pairs:
        return []

    # 2. Get Individual Product Frequencies (for Confidence/Lift)
    # We need Global Order Count for Support calculation?
    # Support(A) = Freq(A) / Total Orders
    # Confidence(A->B) = Support(A,B) / Support(A)
    # Lift(A,B) = Support(A,B) / (Support(A) * Support(B)) 
    #           = (Freq(A,B) * TotalOrders) / (Freq(A) * Freq(B))
    
    # Get Total Orders Count
    res_total = await db.execute(select(func.count(models.Order.id)))
    total_orders = res_total.scalar() or 1
    
    # Get Frequency of all individual products involved in the top pairs
    product_ids = set()
    for p in pairs:
        product_ids.add(p.product_a_id)
        product_ids.add(p.product_b_id)
        
    if not product_ids:
        return []
        
    stmt_singles = (
        select(models.Product.id, func.count().label("freq"))
        .select_from(models.OrderItem)
        .where(models.OrderItem.product_id.in_(product_ids))
        .group_by(models.Product.id)
    )
    
    res_singles = await db.execute(stmt_singles)
    product_freq = {row.id: row.freq for row in res_singles.all()}
    
    # 3. Compute Metrics
    affinity_data = []
    
    for p in pairs:
        freq_a = product_freq.get(p.product_a_id, 0)
        freq_b = product_freq.get(p.product_b_id, 0)
        
        if freq_a == 0 or freq_b == 0:
            continue
            
        # Lift = (Frequency(A,B) * Total Orders) / (Frequency(A) * Frequency(B))
        lift = (p.pair_frequency * total_orders) / (freq_a * freq_b)
        
        # Confidence A->B = Freq(A,B) / Freq(A)
        # We pick the direction with higher confidence usually, or just report one?
        # Let's report the "Connection Strength" (Lift) primarily.
        
        confidence = p.pair_frequency / freq_a # Percentage of times B is bought when A is bought
        
        affinity_data.append({
            "product_a": p.product_a,
            "product_b": p.product_b,
            "frequency": p.pair_frequency,
            "confidence": round(confidence * 100, 1), # %
            "lift": round(lift, 2),
            "strength": "High" if lift > 2.0 else "Medium" if lift > 1.2 else "Low"
        })
        
    # Sort by Lift (Most interesting connection) instead of raw frequency
    affinity_data.sort(key=lambda x: x['lift'], reverse=True)
    
    return affinity_data
