from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from .. import models
from . import kpi_service
from datetime import datetime, timedelta, date

async def get_rules(db: AsyncSession):
    result = await db.execute(select(models.AlertRule))
    return result.scalars().all()

async def create_rule(db: AsyncSession, name: str, metric: str, condition: str, threshold: float):
    rule = models.AlertRule(name=name, metric=metric, condition=condition, threshold=threshold)
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule

async def toggle_rule(db: AsyncSession, rule_id: int):
    result = await db.execute(select(models.AlertRule).where(models.AlertRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if rule:
        rule.is_active = not rule.is_active
        await db.commit()
        await db.refresh(rule)
    return rule

async def delete_rule(db: AsyncSession, rule_id: int):
    await db.execute(delete(models.AlertRule).where(models.AlertRule.id == rule_id))
    await db.commit()

async def get_notifications(db: AsyncSession, unread_only: bool = False):
    query = select(models.AlertNotification).order_by(models.AlertNotification.created_at.desc())
    if unread_only:
        query = query.where(models.AlertNotification.is_read == False)
    result = await db.execute(query)
    return result.scalars().all()

async def mark_notifications_read(db: AsyncSession):
    await db.execute(update(models.AlertNotification).values(is_read=True))
    await db.commit()

async def check_alerts(db: AsyncSession):
    """
    Core Logic: Evaluate all active rules against current metrics.
    Trigger if condition met + cooldown (e.g., once per day per rule).
    """
    # 1. Fetch Active Rules
    result = await db.execute(select(models.AlertRule).where(models.AlertRule.is_active == True))
    rules = result.scalars().all()
    
    if not rules:
        return

    # 2. Get Current Metrics (Today's Stats)
    # We need a quick way to get today's Total Revenue and Orders
    # reusing kpi_service logic roughly, or just raw query for speed/isolation
    
    today = datetime.now().date()
    # Query: Sum of orders created today
    # Note: SQLite/Postgres date functions differ slightly, using sqlalchemy generic func if possible
    
    # Simple range for today
    start_of_day = datetime.combine(today, datetime.min.time())
    
    q_stats = select(
        func.sum(models.Order.total_amount).label("revenue"),
        func.count(models.Order.id).label("orders")
    ).where(models.Order.created_at >= start_of_day)
    
    res_stats = await db.execute(q_stats)
    stats = res_stats.one()
    
    current_revenue = stats.revenue or 0.0
    current_orders = stats.orders or 0
    current_aov = current_revenue / current_orders if current_orders > 0 else 0.0

    # 3. Evaluate Rules
    triggered_rules = []
    
    for rule in rules:
        # Check Cooldown (e.g., don't trigger if triggered today already)
        if rule.last_triggered_at:
            last_date = rule.last_triggered_at.date()
            if last_date == today:
                continue # Already triggered today
        
        should_trigger = False
        current_val = 0.0
        
        if rule.metric == "REVENUE":
            current_val = current_revenue
        elif rule.metric == "ORDERS":
            current_val = float(current_orders)
        elif rule.metric == "AOV":
            current_val = current_aov
            
        if rule.condition == "GT" and current_val > rule.threshold:
            should_trigger = True
        elif rule.condition == "LT" and current_val < rule.threshold:
            should_trigger = True
            
        if should_trigger:
            # Create Notification
            msg = f"Alert: {rule.name} triggered! {rule.metric} is {current_val:.2f} ({rule.condition} {rule.threshold})"
            notif = models.AlertNotification(rule_id=rule.id, message=msg)
            db.add(notif)
            
            # Update Last Triggered
            rule.last_triggered_at = datetime.now()
            triggered_rules.append(rule.name)
            
    if triggered_rules:
        await db.commit()
    
    return triggered_rules
