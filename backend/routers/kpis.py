from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any

from .. import database, dependencies
from ..services import kpi_service

router = APIRouter(
    prefix="/api/kpis",
    tags=["KPIs"],
    dependencies=[Depends(dependencies.require_viewer)]
)

@router.get("/overview")
async def get_kpi_overview(db: AsyncSession = Depends(database.get_db)):
    # In a real app, we might accept date range query params here
    total_revenue = await kpi_service.calculate_total_revenue(db, None, None)
    aov = await kpi_service.calculate_aov(db, None, None)
    
    return {
        "total_revenue": total_revenue,
        "average_order_value": aov,
        # Placeholders for future metrics
        "conversion_rate": 0.0, 
        "cart_abandonment_rate": 0.0
    }

@router.get("/revenue/category")
async def get_revenue_by_category(db: AsyncSession = Depends(database.get_db)) -> List[Dict[str, Any]]:
    return await kpi_service.calculate_revenue_by_category(db)

@router.get("/revenue/region")
async def get_revenue_by_region(db: AsyncSession = Depends(database.get_db)) -> List[Dict[str, Any]]:
    return await kpi_service.calculate_revenue_by_region(db)
