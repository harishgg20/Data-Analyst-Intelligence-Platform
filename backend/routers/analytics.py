from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
from .. import database, dependencies
from ..services import marketing_service, cohort_service, product_intelligence_service

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"],
    dependencies=[Depends(dependencies.require_viewer)]
)

@router.get("/marketing")
async def get_marketing_analytics(
    db: AsyncSession = Depends(database.get_db)
) -> List[Dict[str, Any]]:
    """
    Get performance metrics for all marketing channels (ROAS, CAC, etc.)
    """
    return await marketing_service.get_channel_performance(db)

@router.get("/retention")
async def get_retention_cohorts(
    db: AsyncSession = Depends(database.get_db)
) -> List[Dict[str, Any]]:
    """
    Get Monthly Cohort Retention Analysis
    """
    return await cohort_service.get_cohort_analysis(db)

@router.get("/affinity")
async def get_affinity_analysis(
    db: AsyncSession = Depends(database.get_db)
) -> List[Dict[str, Any]]: # Assuming a similar return type for affinity analysis
    """
    Get product affinity analysis (e.g., "customers who bought X also bought Y").
    """
    return await product_intelligence_service.calculate_affinity(db)
