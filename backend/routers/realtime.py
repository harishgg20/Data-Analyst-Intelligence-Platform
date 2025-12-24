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
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Simulate real-time updates every 30 seconds
            # In a real app, this would listen to a message queue or DB event
            await asyncio.sleep(30)
            
            # Simulated new data
            data = {
                "type": "KPI_UPDATE",
                "payload": {
                    "total_revenue": 45000 + random.randint(-100, 100),
                    "active_orders": 570 + random.randint(-5, 5)
                }
            }
            await websocket.send_text(json.dumps(data))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
