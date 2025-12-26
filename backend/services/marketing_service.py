from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List, Dict, Any
from .. import models
import traceback 

async def get_channel_performance(db: AsyncSession) -> List[Dict[str, Any]]:
    try:
        # 1. Fetch all channels with their Spend
        query_channels = select(models.MarketingChannel)
        res_channels = await db.execute(query_channels)
        channels = res_channels.scalars().all()
        
        performance_data = []
        
        for channel in channels:
            # 2. Calculate Revenue and Conversions for this channel
            # Join Order -> MarketingChannel
            query_stats = (
                select(
                    func.sum(models.Order.total_amount).label("revenue"),
                    func.count(models.Order.id).label("conversions"),
                    func.count(func.distinct(models.Order.customer_id)).label("unique_customers")
                )
                .where(models.Order.marketing_channel_id == channel.id)
            )
            
            res_stats = await db.execute(query_stats)
            stats = res_stats.one()
            
            revenue = float(stats.revenue) if stats.revenue else 0.0
            conversions = int(stats.conversions) if stats.conversions else 0
            unique_customers = int(stats.unique_customers) if stats.unique_customers else 0
            
            spend = float(channel.spend)
            
            # 3. Calculate Metrics
            roas = revenue / spend if spend > 0 else 0.0
            cac = spend / unique_customers if unique_customers > 0 else 0.0
            cpa = spend / conversions if conversions > 0 else 0.0 # Cost per Acquisition/Action
            
            performance_data.append({
                "channel_id": channel.id,
                "channel_name": channel.name,
                "spend": spend,
                "revenue": revenue,
                "roas": round(roas, 2),
                "conversions": conversions,
                "cac": round(cac, 2),
                "cpa": round(cpa, 2)
            })
            
        # Sort by ROAS descending
        performance_data.sort(key=lambda x: x['roas'], reverse=True)
        
        return performance_data

    except Exception as e:
        print(f"Error in get_channel_performance: {e}")
        traceback.print_exc()
        return []
