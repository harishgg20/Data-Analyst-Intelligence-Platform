from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from typing import List, Dict, Any
from .. import models
import traceback
from datetime import datetime

async def get_cohort_analysis(db: AsyncSession) -> List[Dict[str, Any]]:
    try:
        # SQL Approach:
        # 1. CTE: Get first_order_date for each customer
        # 2. Main Query: Join Orders with CTE to calculate date_diff (in months)
        
        # Note: SQLAlchemy async session execution of raw SQL or complex CTEs
        # Let's try to construct it via ORM or Text if simpler. 
        # Given complexity, raw SQL is often cleaner for Cohorts.
        
        sql = text("""
            WITH first_orders AS (
                SELECT 
                    customer_id, 
                    DATE_TRUNC('month', MIN(created_at)) as cohort_month
                FROM orders
                GROUP BY customer_id
            ),
            cohort_activities AS (
                SELECT 
                    fo.cohort_month,
                    DATE_TRUNC('month', o.created_at) as activity_month,
                    COUNT(DISTINCT o.customer_id) as active_customers
                FROM orders o
                JOIN first_orders fo ON o.customer_id = fo.customer_id
                GROUP BY 1, 2
            ),
            cohort_sizes AS (
                SELECT 
                    cohort_month, 
                    COUNT(DISTINCT customer_id) as size
                FROM first_orders
                GROUP BY 1
            )
            SELECT 
                to_char(ca.cohort_month, 'YYYY-MM') as cohort,
                cs.size as cohort_size,
                ROUND(
                    EXTRACT(EPOCH FROM (ca.activity_month - ca.cohort_month))/2592000
                ) as month_number,
                ca.active_customers
            FROM cohort_activities ca
            JOIN cohort_sizes cs ON ca.cohort_month = cs.cohort_month
            ORDER BY ca.cohort_month, month_number
        """)
        
        # Note: 2592000 is approx seconds in 30 days. Postgres date diff is tricky.
        # Alternatively use: (year(activity) - year(cohort)) * 12 + (month(activity) - month(cohort))
        
        # Improved Month Diff Logic for Postgres:
        sql_improved = text("""
             WITH first_orders AS (
                SELECT 
                    customer_id, 
                    DATE_TRUNC('month', MIN(created_at)) as cohort_month
                FROM orders
                GROUP BY customer_id
            ),
            cohort_sizes AS (
                SELECT 
                    cohort_month, 
                    COUNT(DISTINCT customer_id) as size
                FROM first_orders
                GROUP BY 1
            )
            SELECT 
                to_char(fo.cohort_month, 'YYYY-MM') as cohort,
                cs.size as cohort_size,
                (EXTRACT(YEAR FROM o.created_at) - EXTRACT(YEAR FROM fo.cohort_month)) * 12 +
                (EXTRACT(MONTH FROM o.created_at) - EXTRACT(MONTH FROM fo.cohort_month)) as month_number,
                COUNT(DISTINCT o.customer_id) as active_customers
            FROM orders o
            JOIN first_orders fo ON o.customer_id = fo.customer_id
            JOIN cohort_sizes cs ON fo.cohort_month = cs.cohort_month
            GROUP BY 1, 2, 3
            ORDER BY 1, 3
        """)

        result = await db.execute(sql_improved)
        rows = result.all()
        
        # Transform into structured JSON
        # { "cohort": "2023-01", "size": 100, "retention": [{"month": 0, "value": 100, "percent": 100}, ...] }
        
        cohorts_map = {}
        
        for row in rows:
            cohort_name = row.cohort
            size = row.cohort_size
            month_idx = int(row.month_number)
            active = row.active_customers
            
            if cohort_name not in cohorts_map:
                cohorts_map[cohort_name] = {
                    "cohort": cohort_name,
                    "size": size,
                    "retention": []
                }
            
            percent = round((active / size) * 100, 1)
            
            cohorts_map[cohort_name]["retention"].append({
                "month_index": month_idx,
                "active_customers": active,
                "percentage": percent
            })
            
        return list(cohorts_map.values())

    except Exception as e:
        print(f"Error in get_cohort_analysis: {e}")
        traceback.print_exc()
        return []
