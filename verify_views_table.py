import asyncio
import sys
import os
from sqlalchemy import text

# Add current directory to path
sys.path.append(os.getcwd())

from backend.database import AsyncSessionLocal

async def verify_table():
    print("Verifying saved_views table...")
    try:
        async with AsyncSessionLocal() as db:
            # Check if table exists by selecting
            try:
                await db.execute(text("SELECT COUNT(*) FROM saved_views"))
                print("Table 'saved_views' exists.")
            except Exception as e:
                print(f"Table 'saved_views' DOES NOT EXIST or error: {e}")
                # Try to create it? No, just report.
                return

            # Try to insert a dummy view for a user (need a user id)
            # Find a user first
            res = await db.execute(text("SELECT id FROM users LIMIT 1"))
            user_id = res.scalar()
            
            if not user_id:
                print("No users found to test insertion.")
                return

            print(f"Found User ID: {user_id}")
            
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    asyncio.run(verify_table())
