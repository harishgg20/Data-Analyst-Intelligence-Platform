from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
from .. import database, dependencies
from ..services import alerts_service
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/alerts",
    tags=["Alerts"],
    dependencies=[Depends(dependencies.require_viewer)]
)

class RuleCreate(BaseModel):
    name: str
    metric: str
    condition: str
    threshold: float

@router.get("/rules")
async def get_rules(db: AsyncSession = Depends(database.get_db)):
    return await alerts_service.get_rules(db)

@router.post("/rules")
async def create_rule(rule: RuleCreate, db: AsyncSession = Depends(database.get_db)):
    return await alerts_service.create_rule(db, rule.name, rule.metric, rule.condition, rule.threshold)

@router.post("/rules/{rule_id}/toggle")
async def toggle_rule(rule_id: int, db: AsyncSession = Depends(database.get_db)):
    return await alerts_service.toggle_rule(db, rule_id)

@router.delete("/rules/{rule_id}")
async def delete_rule(rule_id: int, db: AsyncSession = Depends(database.get_db)):
    await alerts_service.delete_rule(db, rule_id)
    return {"status": "deleted"}

@router.get("/notifications")
async def get_notifications(db: AsyncSession = Depends(database.get_db)):
    return await alerts_service.get_notifications(db)

@router.post("/notifications/read")
async def mark_read(db: AsyncSession = Depends(database.get_db)):
    await alerts_service.mark_notifications_read(db)
    return {"status": "marked read"}

@router.post("/run")
async def run_checks(db: AsyncSession = Depends(database.get_db)):
    triggered = await alerts_service.check_alerts(db)
    return {"status": "checked", "triggered": triggered}
