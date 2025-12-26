from typing import List, Dict, Any
from datetime import datetime, timedelta
import math
from sqlalchemy.ext.asyncio import AsyncSession
from . import kpi_service

def calculate_linear_regression(x: List[float], y: List[float]):
    n = len(x)
    if n == 0:
        return 0, 0
    
    sum_x = sum(x)
    sum_y = sum(y)
    sum_xy = sum(xi * yi for xi, yi in zip(x, y))
    sum_xx = sum(xi * xi for xi in x)
    
    numerator_m = (n * sum_xy) - (sum_x * sum_y)
    denominator_m = (n * sum_xx) - (sum_x ** 2)
    
    if denominator_m == 0:
        slope = 0
    else:
        slope = numerator_m / denominator_m
        
    intercept = (sum_y - (slope * sum_x)) / n
    
    return slope, intercept

async def generate_forecast(db: AsyncSession, days: int = 30, category: str = None, region: str = None, min_order_value: float = None) -> List[Dict[str, Any]]:
    # 1. Get historical data
    # We can reuse the revenue trend endpoint logic
    # Assume kpi_service is available and has calculate_revenue_trend
    history = await kpi_service.calculate_revenue_trend(db, category, region, min_order_value)
    
    if len(history) < 1:
        return [] # No data at all
        
    # 2. Prepare data for regression
    x_values = []
    y_values = []
    start_date = None
    last_date = None
    
    try:
        # Sort just in case
        history.sort(key=lambda item: item['date'])
        
        # Helper: if only 1 point, assume flat or slight growth (mocking a 2nd point)
        # to allow regression to run flat.
        if len(history) == 1:
            point = history[0]
            # Add the real point
            x_values.append(0)
            y_values.append(float(point['revenue']))
            
            # Mock a past point (yesterday) with same revenue to create a flat trend
            x_values.insert(0, -1)
            y_values.insert(0, float(point['revenue']))
            
            last_index = 0
            last_date = datetime.strptime(point['date'], "%Y-%m-%d")
            
        else:
            # Normal multi-point logic
            for i, point in enumerate(history):
                x_values.append(i)
                y_values.append(float(point['revenue']))
                
            last_index = x_values[-1]
            last_date = datetime.strptime(history[-1]['date'], "%Y-%m-%d")
        
    except Exception as e:
        print(f"Forecast parsing error: {e}")
        return []

    # 3. Calculate Regression
    slope, intercept = calculate_linear_regression(x_values, y_values)
    
    # 4. Generate Future Points
    forecast = []
    for i in range(1, days + 1):
        future_index = last_index + i
        predicted_revenue = (slope * future_index) + intercept
        
        # Ensure non-negative revenue
        predicted_revenue = max(0, predicted_revenue)
        
        future_date = last_date + timedelta(days=i)
        
        forecast.append({
            "date": future_date.strftime("%Y-%m-%d"),
            "revenue": round(predicted_revenue, 2),
            "is_forecast": True
        })
        
    return forecast
