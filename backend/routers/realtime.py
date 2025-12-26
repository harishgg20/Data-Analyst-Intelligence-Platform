from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json
import asyncio
import random

router = APIRouter(
    prefix="/ws",
    tags=["Realtime"]
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("/kpi-stream")
@router.websocket("/kpi-stream")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        from ..database import AsyncSessionLocal
        from ..services import kpi_service
        
        while True:
            # Poll database every 5 seconds for real-time feel
            await asyncio.sleep(5)
            
            async with AsyncSessionLocal() as db:
                total_revenue = await kpi_service.calculate_total_revenue(db, None, None)
                active_orders = await kpi_service.count_orders(db, None, None)
                aov = await kpi_service.calculate_aov(db, None, None)
                active_customers = await kpi_service.count_customers(db)
            
            data = {
                "type": "KPI_UPDATE",
                "payload": {
                    "total_revenue": total_revenue,
                    "active_orders": active_orders,
                    "average_order_value": aov,
                    "active_customers": active_customers
                }
            }
            await websocket.send_text(json.dumps(data))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WS Error: {e}")
        manager.disconnect(websocket)
