from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from datetime import datetime
from typing import List, Dict, Any, Optional
from .. import models
import traceback

def log_error(msg: str):
    try:
        with open("debug_errors.txt", "a") as f:
            f.write(f"{datetime.now()} - {msg}\n")
    except:
        pass

async def calculate_total_revenue(db: AsyncSession, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None, category: str = None, region: str = None, min_order_value: float = None) -> float:
    # If category filter is present, we must sum OrderItem level to be precise
    if category:
        query = (
            select(func.sum(models.OrderItem.quantity * models.OrderItem.price_at_purchase))
            .join(models.Product, models.OrderItem.product_id == models.Product.id)
            .join(models.Order, models.OrderItem.order_id == models.Order.id) # Need Order for date/region
        )
        query = query.where(models.Product.category == category)
    else:
        query = select(func.sum(models.Order.total_amount))
        # If region is used, we need to join Customer
        if region:
             query = query.join(models.Customer, models.Order.customer_id == models.Customer.id)

    if region:
        # If we didn't join above (i.e. category case), we need join now. 
        # But wait, category case already joined Order.
        if category:
             query = query.join(models.Customer, models.Order.customer_id == models.Customer.id)
        query = query.where(models.Customer.region == region)

    if min_order_value is not None:
        query = query.where(models.Order.total_amount >= min_order_value)

    if start_date:
        query = query.where(models.Order.created_at >= start_date)
    if end_date:
        query = query.where(models.Order.created_at <= end_date)
    
    result = await db.execute(query)
    total = result.scalar()
    return float(total) if total else 0.0

async def calculate_aov(db: AsyncSession, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> float:
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

async def count_orders(db: AsyncSession, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None, category: str = None, region: str = None, min_order_value: float = None) -> int:
    query = select(func.count(models.Order.id))
    
    if category:
        # Orders containing at least one item of category
        query = query.join(models.OrderItem, models.OrderItem.order_id == models.Order.id)\
                     .join(models.Product, models.OrderItem.product_id == models.Product.id)\
                     .where(models.Product.category == category)
    
    if region:
        query = query.join(models.Customer, models.Order.customer_id == models.Customer.id)\
                     .where(models.Customer.region == region)

    if start_date:
        query = query.where(models.Order.created_at >= start_date)
    if end_date:
        query = query.where(models.Order.created_at <= end_date)
    if min_order_value is not None:
        query = query.where(models.Order.total_amount >= min_order_value)
    
    # Distinct if joined multiple items?
    # select count(distinct order.id) would be safer if category join duplicates rows
    if category:
        query = select(func.count(func.distinct(models.Order.id)))
        query = query.join(models.OrderItem, models.OrderItem.order_id == models.Order.id)\
                     .join(models.Product, models.OrderItem.product_id == models.Product.id)\
                     .where(models.Product.category == category)
        if region:
             query = query.join(models.Customer, models.Order.customer_id == models.Customer.id)\
                          .where(models.Customer.region == region)
        if start_date: query = query.where(models.Order.created_at >= start_date)
        if end_date: query = query.where(models.Order.created_at <= end_date)
        if min_order_value is not None: query = query.where(models.Order.total_amount >= min_order_value)

    result = await db.execute(query)
    return result.scalar() or 0

async def count_customers(db: AsyncSession) -> int:
    # Just return total customers for now
    query = select(func.count(models.Customer.id))
    result = await db.execute(query)
    return result.scalar() or 0

async def calculate_revenue_by_category(db: AsyncSession, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None, region: str = None, min_order_value: float = None) -> List[Dict[str, Any]]:
    try:
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
        
        if region:
            query = query.join(models.Customer, models.Order.customer_id == models.Customer.id)\
                         .where(models.Customer.region == region)
        
        if min_order_value is not None:
            query = query.where(models.Order.total_amount >= min_order_value)
        
        result = await db.execute(query)
        data = []
        for row in result.all():
            cat = row.category or "Uncategorized"
            rev = float(row.revenue) if row.revenue else 0.0
            data.append({"category": cat, "revenue": rev})
        return data
    except Exception as e:
        log_error(f"Error in calculate_revenue_by_category: {e}\n{traceback.format_exc()}")
        return []

async def calculate_revenue_by_region(db: AsyncSession, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None, category: str = None, min_order_value: float = None) -> List[Dict[str, Any]]:
    try:
        # Order -> Customer(region)
        query = (
            select(
                models.Customer.region,
                # If category filter, we must join OrderItems. If not, Order total is better.
                # To be consistent with "filtering", let's use OrderItems if category provided.
                func.sum(models.OrderItem.quantity * models.OrderItem.price_at_purchase).label("revenue") 
                if category else func.sum(models.Order.total_amount).label("revenue")
            )
            .join(models.Customer, models.Order.customer_id == models.Customer.id)
        )

        if category:
            query = (
                query.join(models.Order, models.Customer.id == models.Order.customer_id) # Explicit join if starting from customer? No query starts from select fields.
                # Actually wait, query structure above:
                # select(Customer.region, sum...) from Customer join Order ...
            )
            # Re-write query construction for clarity
            query = select(
                models.Customer.region,
                func.sum(models.OrderItem.quantity * models.OrderItem.price_at_purchase).label("revenue")
            ).select_from(models.Customer)\
             .join(models.Order, models.Customer.id == models.Order.customer_id)\
             .join(models.OrderItem, models.Order.id == models.OrderItem.order_id)\
             .join(models.Product, models.OrderItem.product_id == models.Product.id)\
             .where(models.Product.category == category)

        # else case used to have redundant join, removed.

        query = query.group_by(models.Customer.region).order_by(desc("revenue"))

        if min_order_value is not None:
            # Need to apply filter before grouping, might need to adjust where clause position if construction was complex
            # The query variable construction above was branched. 
            # If category used: it has chained where(). If not: chained join().
            # So appending where() now works for both (SQLAlchemy appends AND).
            query = query.where(models.Order.total_amount >= min_order_value)
            
        if start_date:
            query = query.where(models.Order.created_at >= start_date)
        if end_date:
            query = query.where(models.Order.created_at <= end_date)
        
        result = await db.execute(query)
        data = []
        for row in result.all():
            reg = row.region or "Unknown"
            rev = float(row.revenue) if row.revenue else 0.0
            data.append({"region": reg, "revenue": rev})
        return data
    except Exception as e:
        log_error(f"Error in calculate_revenue_by_region: {e}\n{traceback.format_exc()}")
        return []

async def calculate_revenue_trend(db: AsyncSession, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None, category: str = None, region: str = None, min_order_value: float = None) -> List[Dict[str, Any]]:
    try:
        # Group by Date
        if category:
            # Sum OrderItem values
            query = (
                select(
                    func.date(models.Order.created_at).label("date"),
                    func.sum(models.OrderItem.quantity * models.OrderItem.price_at_purchase).label("revenue")
                )
                .join(models.OrderItem, models.OrderItem.order_id == models.Order.id)
                .join(models.Product, models.OrderItem.product_id == models.Product.id)
                .where(models.Product.category == category)
            )
        else:
            query = (
                select(
                    func.date(models.Order.created_at).label("date"),
                    func.sum(models.Order.total_amount).label("revenue")
                )
            )

        if region:
            query = query.join(models.Customer, models.Order.customer_id == models.Customer.id)\
                         .where(models.Customer.region == region)

        if min_order_value is not None:
            query = query.where(models.Order.total_amount >= min_order_value)

        query = query.group_by(func.date(models.Order.created_at)).order_by(func.date(models.Order.created_at))
        
        result = await db.execute(query)
        data = []
        for row in result.all():
            date_str = str(row.date) if row.date else "Unknown"
            rev = float(row.revenue) if row.revenue else 0.0
            data.append({"date": date_str, "revenue": rev})
        return data
    except Exception as e:
        log_error(f"Error in calculate_revenue_trend: {e}\n{traceback.format_exc()}")
        return []

async def get_filter_options(db: AsyncSession) -> Dict[str, List[str]]:
    try:
        # Get unique categories
        cat_result = await db.execute(select(models.Product.category).distinct().order_by(models.Product.category))
        categories = [row.category for row in cat_result.all() if row.category]
        print(f"DEBUG: Found {len(categories)} categories")

        # Get unique regions
        reg_result = await db.execute(select(models.Customer.region).distinct().order_by(models.Customer.region))
        regions = [row.region for row in reg_result.all() if row.region]
        print(f"DEBUG: Found {len(regions)} regions")
        
        # Helper to read labels
        import json
        import os
        labels = {"category": "Category", "region": "Region"}
        try:
            if os.path.exists("dataset_config.json"):
                with open("dataset_config.json") as f:
                    config = json.load(f)
                    labels["category"] = config.get("category_label", "Category")
                    labels["region"] = config.get("region_label", "Region")
        except:
            pass

        return {
            "categories": categories,
            "regions": regions,
            "labels": labels
        }
    except Exception as e:
        log_error(f"Error fetching filter options: {e}")
        return {"categories": [], "regions": []}
