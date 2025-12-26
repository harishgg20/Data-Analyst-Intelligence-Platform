from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from ..database import get_db
from ..services import ai_service
from pydantic import BaseModel
import logging

router = APIRouter(
    prefix="/api/chat",
    tags=["AI Chat"],
)

class ChatMessage(BaseModel):
    message: str

@router.post("/message")
async def chat_message(payload: ChatMessage, db: AsyncSession = Depends(get_db)):
    """
    Process natural language query -> SQL -> Result -> Summary
    """
    try:
        # 1. Generate SQL
        ai_response = await ai_service.generate_sql_query(payload.message)
        
        if not ai_response or "error" in ai_response:
            return {
                "role": "bot",
                "content": ai_response.get("error", "I couldn't understand that request. Please try asking about sales, products, or customers.") if ai_response else "AI Service Error"
            }
            
        sql_query = ai_response.get("sql")
        explanation = ai_response.get("explanation")
        
        if not sql_query:
            return {
                "role": "bot",
                "content": "I couldn't find a way to answer that with the available data. Try asking about revenue, orders, or regions."
            }

        # 2. Execute SQL
        # Safety: We rely on ai_service keyword check, but SQLAlchemy text() is powerful.
        # Future: Use a read-only DB user here.
        result = await db.execute(text(sql_query))
        rows = result.mappings().all()
        data = [dict(row) for row in rows]
        
        # 3. Summarize Logic
        summary = await ai_service.summarize_data(payload.message, data, explanation)
        
        return {
            "role": "bot",
            "content": summary,
            "data": data,
            "sql": sql_query # valid for debugging/transparency
        }

    except Exception as e:
        logging.error(f"Chat Error: {e}")
        return {
            "role": "bot",
            "content": "I encountered an error processing your request. Please try again."
        }
