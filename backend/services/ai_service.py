import google.generativeai as genai
import os
import json
from typing import Dict, Any
from async_lru import alru_cache
from sqlalchemy.ext.asyncio import AsyncSession
from .. import models

# Configure Gemini
def get_api_key():
    key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if key:
        genai.configure(api_key=key)
    return key


@alru_cache(maxsize=32)
async def generate_business_insight_cached(kpi_data_json: str, prompt_override: str = None) -> str:
    kpi_data = json.loads(kpi_data_json)
    if not get_api_key():
        return "Gemini API Key not configured."

    model = genai.GenerativeModel('models/gemini-1.5-flash')
    
    if prompt_override:
        prompt = prompt_override
    else:
        prompt = f"""
        You are a senior business intelligence analyst. Analyze the following KPI data and generate a concise, actionable insight.
        Focus on trends, anomalies, or opportunities for growth.
        
        Data:
        {json.dumps(kpi_data, indent=2)}
        
        Format your response as a JSON object with the following fields:
        - title: A short headline for the insight.
        - type: "TREND" | "ANOMALY" | "PREDICTION"
        - content: A 2-3 sentence explanation.
        - confidence_score: A float between 0.0 and 1.0 representing your confidence.
        """

    try:
        response = model.generate_content(prompt)
        text = response.text.replace('```json', '').replace('```', '').strip()
        return text
    except Exception as e:
        print(f"Error generating insight: {e}")
        return json.dumps({
            "title": "Analysis Unavailable",
            "type": "ANOMALY",
            "content": "Could not generate insight at this time.",
            "confidence_score": 0.0
        })

async def generate_business_insight(kpi_data: Dict[str, Any], prompt_override: str = None) -> str:
    # Wrapper to handle dict -> json string for cacheability
    return await generate_business_insight_cached(json.dumps(kpi_data, sort_keys=True), prompt_override)

async def save_insight(db: AsyncSession, insight_json: str):
    try:
        data = json.loads(insight_json)
        new_insight = models.AIInsight(
            title=data.get("title", "New Insight"),
            type=data.get("type", "TREND"),
            content=data.get("content", ""),
            confidence_score=data.get("confidence_score", 0.8)
        )
        db.add(new_insight)
        await db.commit()
        await db.refresh(new_insight)
        return new_insight
    except json.JSONDecodeError:
        print("Failed to decode AI response")
        return None

async def generate_sql_query(question: str) -> Dict[str, Any]:
    """
    Translates natural language question into SQL query.
    Effectively READ-ONLY safety check.
    """
    if not get_api_key():
        return {"error": "Gemini API Key not configured."}

    model = genai.GenerativeModel('gemini-1.5-flash')
    
    # DATABASE SCHEMA CONTEXT
    schema_context = """
    Tables:
    1. orders (id, customer_id, total_amount, status, created_at)
    2. customers (id, name, email, region, created_at)
    3. products (id, name, category, price, cost)
    4. order_items (id, order_id, product_id, quantity, price_at_purchase)
    
    Relationships:
    - orders.customer_id -> customers.id
    - order_items.order_id -> orders.id
    - order_items.product_id -> products.id
    """

    prompt = f"""
    You are a SQL expert. Convert the following question into a PostgreSQL query based on the schema below.
    
    Schema:
    {schema_context}
    
    Question: "{question}"
    
    Rules:
    1. Return ONLY the JSON object with fields: "sql" and "explanation".
    2. SQL must be valid PostgreSQL.
    3. DO NOT use INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, GRANT, REVOKE.
    4. If the question cannot be answered with the schema, return "sql": null.
    5. Always alias aggregations (e.g., SUM(total_amount) as revenue).
    6. Limit results to 20 rows unless specified otherwise.
    
    Response Format (JSON):
    {{
        "sql": "SELECT ...",
        "explanation": "Query to find..."
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        # Clean response (remove markdown code blocks if any)
        text = response.text.replace('```json', '').replace('```', '').strip()
        result = json.loads(text)
        
        # Additional Safety Check
        sql = result.get("sql", "").upper()
        forbidden = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "GRANT", "REVOKE"]
        if any(word in sql for word in forbidden):
             return {"error": "Generated SQL contained forbidden keywords. Query rejected for safety."}
             
        return result
        
    except Exception as e:
        return {"error": f"Failed to generate SQL: {str(e)}"}

async def summarize_data(question: str, data: list, sql_explanation: str) -> str:
    """
    Summarizes the query results in natural language.
    """
    if not get_api_key():
        return "API Key missing."
        
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    prompt = f"""
    You are a data analyst. Explain the results of the following query to a business user.
    
    User Question: "{question}"
    Query Intent: {sql_explanation}
    
    Data Results:
    {json.dumps(data[:10], default=str)}  # Truncate for prompt limit if huge
    
    Rules:
    1. Be concise (max 3 sentences).
    2. Highlight key numbers.
    3. If data is empty, say "No matching data found."
    """
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return "Could not generate summary."

@alru_cache(maxsize=32)
async def generate_concise_explanation(prompt: str) -> str:
    """
    Generates a direct text explanation from a prompt.
    """
    if not get_api_key():
        return "AI Configuration Missing."
        

    model = genai.GenerativeModel('models/gemini-1.5-flash')
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        error_str = str(e)
        if "429" in error_str:
            return "Usage limit reached. Please wait a moment."
        print(f"Explanation Generation Error: {e}")
        return "Analysis unavailable at the moment."
