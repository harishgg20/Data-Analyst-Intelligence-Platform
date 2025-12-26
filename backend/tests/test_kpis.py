import pytest
from backend import models
from backend.services import kpi_service
from datetime import datetime

@pytest.mark.asyncio
async def test_kpi_calculations(test_db):
    # 1. Seed Data
    # Customer
    customer = models.Customer(name="Test User", email="test@test.com", region="North America")
    test_db.add(customer)
    await test_db.commit()
    await test_db.refresh(customer)
    
    # Marketing Channel
    channel = models.MarketingChannel(name="Direct", spend=0)
    test_db.add(channel)
    await test_db.commit()
    
    # Orders (Low Value & High Value)
    order1 = models.Order(
        customer_id=customer.id, 
        total_amount=50.0, 
        status="completed",
        marketing_channel_id=channel.id,
        created_at=datetime.now()
    )
    order2 = models.Order(
        customer_id=customer.id, 
        total_amount=200.0, 
        status="completed",
        marketing_channel_id=channel.id,
        created_at=datetime.now()
    )
    test_db.add(order1)
    test_db.add(order2)
    await test_db.commit()
    
    # 2. Test Total Revenue (No Filter)
    rev = await kpi_service.calculate_total_revenue(test_db)
    assert rev == 250.0
    
    # 3. Test Count Orders
    count = await kpi_service.count_orders(test_db)
    assert count == 2
    
    # 4. Test High Value Filter (min_order_value=100)
    high_val_rev = await kpi_service.calculate_total_revenue(test_db, min_order_value=100.0)
    assert high_val_rev == 200.0
    
    high_val_count = await kpi_service.count_orders(test_db, min_order_value=100.0)
    assert high_val_count == 1
    
    # 5. Test Region Filtering
    na_rev = await kpi_service.calculate_total_revenue(test_db, region="North America")
    assert na_rev == 250.0
    
    eu_rev = await kpi_service.calculate_total_revenue(test_db, region="Europe")
    assert eu_rev == 0.0
