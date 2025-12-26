import requests
import json
from datetime import datetime

BACKEND_URL = "http://localhost:8000"

def signup():
    try:
        requests.post(f"{BACKEND_URL}/api/auth/signup", json={"email": "test_forecast@example.com", "password": "password123"})
    except:
        pass

def login():
    signup()
    try:
        res = requests.post(f"{BACKEND_URL}/api/auth/login", data={"username": "test_forecast@example.com", "password": "password123"})
        if res.status_code == 200:
            return res.json()["access_token"]
        print(f"Login Failed: {res.status_code} {res.text}")
        return None
    except Exception as e:
        print(f"Login Exception: {e}")
        return None

def test_forecast():
    print("--- Testing KPI Forecasting ---")
    
    token = login()
    if not token:
        return
        
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Fetching Forecast for 30 days...")
    res = requests.get(f"{BACKEND_URL}/api/kpis/revenue/forecast?days=30", headers=headers)
    
    if res.status_code != 200:
        print(f"[FAIL] Status {res.status_code}: {res.text}")
        return
        
    data = res.json()
    print(f"Received {len(data)} data points for forecast.")
    
    if len(data) == 0:
        print("[WARN] No forecast returned (Possibly not enough historical data).")
        return
        
    first = data[0]
    last = data[-1]
    
    print(f"First Point: Date={first['date']}, Revenue={first['revenue']}")
    print(f"Last Point:  Date={last['date']}, Revenue={last['revenue']}")
    
    if first.get("is_forecast") and last.get("is_forecast"):
         print("[PASS] is_forecast flag present.")
    else:
         print("[FAIL] is_forecast flag missing.")

if __name__ == "__main__":
    test_forecast()
