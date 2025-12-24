from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from datetime import datetime
from typing import List, Dict, Any, Optional
from .. import models

async def calculate_total_revenue(db: AsyncSession, start_date: Optional[datetime], end_date: Optional[datetime]) -> float:
    query = select(func.sum(models.Order.total_amount))
    if start_date:
        query = query.where(models.Order.created_at >= start_date)
    if end_date:
        query = query.where(models.Order.created_at <= end_date)
    
    result = await db.execute(query)
    total = result.scalar()
    return total if total else 0.0

async def calculate_aov(db: AsyncSession, start_date: Optional[datetime], end_date: Optional[datetime]) -> float:
    # Average Order Value = Total Revenue / Total Orders
    revenue_query = select(func.sum(models.Order.total_amount))
    count_query = select(func.count(models.Order.id))
    
    if start_date:
        revenue_query = revenue_query.where(models.Order.created_at >= start_date)
        count_query = count_query.where(models.Order.created_at >= start_date)
    if end_date:
        revenue_query = revenue_query.where(models.Order.created_at <= end_date)
        count_query = count_query.where(models.Order.created_at <= end_date)
        
    total_revenue_res = await db.execute(revenue_query)
    total_revenue = total_revenue_res.scalar() or 0.0
    
    total_count_res = await db.execute(count_query)
    total_count = total_count_res.scalar() or 0
    
    if total_count == 0:
        return 0.0
    
    return total_revenue / total_count

async def calculate_revenue_by_category(db: AsyncSession) -> List[Dict[str, Any]]:
    # Order -> OrderItem -> Product(category)
    query = (
        select(
            models.Product.category,
            func.sum(models.OrderItem.quantity * models.OrderItem.price_at_purchase).label("revenue")
        )
        .join(models.OrderItem, models.Product.id == models.OrderItem.product_id)
        .join(models.Order, models.OrderItem.order_id == models.Order.id)
        .group_by(models.Product.category)
        .order_by(desc("revenue"))
    )
    
    result = await db.execute(query)
    return [{"category": row.category, "revenue": row.revenue} for row in result.all()]

async def calculate_revenue_by_region(db: AsyncSession) -> List[Dict[str, Any]]:
    # Order -> Customer(region)
    query = (
        select(
            models.Customer.region,
            func.sum(models.Order.total_amount).label("revenue")
        )
        .join(models.Customer, models.Order.customer_id == models.Customer.id)
        .group_by(models.Customer.region)
        .order_by(desc("revenue"))
    )
    
    result = await db.execute(query)
    return [{"region": row.region, "revenue": row.revenue} for row in result.all()]
