from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from .. import database, dependencies
from ..services import integration_service
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/integrations",
    tags=["Integrations"],
)

class ConnectRequest(BaseModel):
    provider: str
    api_key: str
    shop_url: str = None

@router.post("/connect")
async def connect_integration(payload: ConnectRequest):
    # Mock connection validation
    if not payload.api_key:
         raise HTTPException(status_code=400, detail="API Key required")
    
    return {"status": "connected", "provider": payload.provider}

@router.post("/sync/{provider}")
async def sync_data(provider: str, db: AsyncSession = Depends(database.get_db)):
    if provider not in ['shopify', 'stripe', 'woocommerce']:
        raise HTTPException(status_code=400, detail="Unsupported provider")
        
    result = await integration_service.sync_provider(provider, db)
    return result
