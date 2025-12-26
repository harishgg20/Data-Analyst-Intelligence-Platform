from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any

from sqlalchemy import select
from .. import database, dependencies, models
from ..services import kpi_service, forecast_service
from ..services.cache_service import cache

router = APIRouter(
    prefix="/api/kpis",
    tags=["KPIs"],
)

@router.get("/filters")
@cache(ttl=300, key_prefix="filter_options")
async def get_filters(db: AsyncSession = Depends(database.get_db)):
    return await kpi_service.get_filter_options(db)

@router.get("/overview")
@cache(ttl=60, key_prefix="kpi_overview")
async def get_kpi_overview(
    category: str = None, 
    region: str = None, 
    min_order_value: float = None,
    days: int = 30, # Default to 30 days
    db: AsyncSession = Depends(database.get_db),
    user: models.User = Depends(dependencies.require_viewer)
):
    from datetime import datetime, timedelta
    start_date = datetime.now() - timedelta(days=days) if days > 0 else None
    
    total_revenue = await kpi_service.calculate_total_revenue(db, start_date, None, category, region, min_order_value)
    # AOV and Orders should also respect time
    aov = await kpi_service.calculate_aov(db, start_date, None) 
    orders_count = await kpi_service.count_orders(db, start_date, None, category, region, min_order_value)
    customers_count = await kpi_service.count_customers(db) # Cust count might need filtering too, but skip for now
    
    # Fetch latest generic analysis if exists
    # Fetch latest generic analysis if exists
    latest_analysis = None
    # Always try to fetch latest analysis
    if True:
        result = await db.execute(
            select(models.AIInsight)
            .where(models.AIInsight.type == "DATASET_ANALYSIS")
            .order_by(models.AIInsight.created_at.desc())
            .limit(1)
        )
        insight = result.scalar_one_or_none()
        if insight:
            import json
            try:
                latest_analysis = json.loads(insight.content)
            except:
                latest_analysis = {"error": "Failed to parse analysis"}

    return {
        "total_revenue": total_revenue,
        "average_order_value": aov,
        "active_orders": orders_count,
        "active_customers": customers_count,
        "latest_analysis": latest_analysis,
        # Placeholders for future metrics
        "conversion_rate": 0.0, 
        "cart_abandonment_rate": 0.0
    }

@router.get("/revenue/category")
async def get_revenue_by_category(
    days: int = 30,
    region: str = None,
    min_order_value: float = None,
    db: AsyncSession = Depends(database.get_db)
) -> List[Dict[str, Any]]:
    from datetime import datetime, timedelta
    start_date = datetime.now() - timedelta(days=days) if days > 0 else None
    return await kpi_service.calculate_revenue_by_category(db, start_date, None, region, min_order_value)

@router.get("/revenue/region")
async def get_revenue_by_region(
    days: int = 30,
    category: str = None,
    min_order_value: float = None,
    db: AsyncSession = Depends(database.get_db)
) -> List[Dict[str, Any]]:
    from datetime import datetime, timedelta
    start_date = datetime.now() - timedelta(days=days) if days > 0 else None
    return await kpi_service.calculate_revenue_by_region(db, start_date, None, category, min_order_value)

@router.get("/revenue/trend")
@cache(ttl=300, key_prefix="rev_trend")
async def get_revenue_trend(
    days: int = 30,
    category: str = None, 
    region: str = None,
    min_order_value: float = None,
    db: AsyncSession = Depends(database.get_db)
) -> List[Dict[str, Any]]:
    from datetime import datetime, timedelta
    start_date = datetime.now() - timedelta(days=days) if days > 0 else None
    return await kpi_service.calculate_revenue_trend(db, start_date, None, category, region, min_order_value)

@router.get("/revenue/forecast")
async def get_revenue_forecast(
    days: int = 30,
    category: str = None,
    region: str = None,
    min_order_value: float = None,
    db: AsyncSession = Depends(database.get_db)
) -> List[Dict[str, Any]]:
    return await forecast_service.generate_forecast(db, days, category, region, min_order_value)
