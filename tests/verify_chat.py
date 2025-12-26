import requests
import json

BACKEND_URL = "http://localhost:8000"

def test_chat():
    print("--- Testing AI Chat Endpoint ---")
    
    question = "What is the total revenue?"
    print(f"1. Sending Question: '{question}'")
    
    try:
        res = requests.post(
            f"{BACKEND_URL}/api/chat/message",
            json={"message": question},
            timeout=30 # AI can be slow
        )
        
        if res.status_code == 200:
            data = res.json()
            print("   [SUCCESS] Received Response")
            print(f"   Role: {data.get('role')}")
            print(f"   Content: {data.get('content')}")
            
            sql = data.get('sql')
            if sql:
                print(f"   Generated SQL: {sql}")
                if "SELECT" in sql.upper() and ("revenue" in sql.lower() or "total_amount" in sql.lower()):
                    print("   [PASS] SQL looks valid.")
                else:
                    print(f"   [WARN] SQL might be irrelevant: {sql}")
            else:
                print("   [FAIL] No SQL generated (might be summarized directly or error)")

            # Check Data
            rows = data.get('data')
            if rows is not None:
                print(f"   Data Rows: {len(rows)}")
                if len(rows) > 0:
                    print(f"   Sample: {rows[0]}")
            else:
                 print("   [INFO] No data rows returned (maybe just summary)")

        else:
            print(f"   [FAIL] Status {res.status_code}: {res.text}")

    except Exception as e:
        print(f"   [ERROR] Exception: {e}")

if __name__ == "__main__":
    test_chat()
