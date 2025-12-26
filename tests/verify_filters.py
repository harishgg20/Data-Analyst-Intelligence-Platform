import requests
import json

BACKEND_URL = "http://localhost:8000"

def signup():
    try:
        requests.post(f"{BACKEND_URL}/api/auth/signup", json={"email": "test_filter@example.com", "password": "password123"})
    except:
        pass

def login():
    signup() # Ensure user exists
    try:
        res = requests.post(f"{BACKEND_URL}/api/auth/login", data={"username": "test_filter@example.com", "password": "password123"})
        if res.status_code == 200:
            return res.json()["access_token"]
        print(f"Login Failed: {res.status_code} {res.text}")
        return None
    except Exception as e:
        print(f"Login Exception: {e}")
        return None

def test_filters():
    print("--- Testing KPI Filtering ---")
    
    token = login()
    if not token:
        print("[FAIL] Login failed. Cannot proceed.")
        return
        
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Baseline
    print("1. Fetching Baseline Overview...")
    resp = requests.get(f"{BACKEND_URL}/api/kpis/overview", headers=headers)
    if resp.status_code != 200:
        print(f"   [FAIL] Status {resp.status_code}: {resp.text}")
        return
    base = resp.json()
    base_rev = base['total_revenue']
    print(f"   Baseline Revenue: ${base_rev:,.2f}")

    # 2. Category Filter
    cats = requests.get(f"{BACKEND_URL}/api/kpis/revenue/category", headers=headers).json()
    if not cats:
        print("   [SKIP] No categories found to test.")
        return

    test_cat = cats[0]['category']
    print(f"2. Testing Filter: Category='{test_cat}'")
    
    filtered = requests.get(f"{BACKEND_URL}/api/kpis/overview?category={test_cat}", headers=headers).json()
    filt_rev = filtered['total_revenue']
    print(f"   Filtered Revenue: ${filt_rev:,.2f}")
    
    if filt_rev <= base_rev:
        print("   [PASS] Filtered revenue is <= Baseline.")
    else:
        print(f"   [FAIL] Filtered revenue ({filt_rev}) > Baseline ({base_rev})!")

    # 3. Region Filter
    regs = requests.get(f"{BACKEND_URL}/api/kpis/revenue/region", headers=headers).json()
    if not regs:
        print("   [SKIP] No regions found.")
    else:
        test_reg = regs[0]['region']
        print(f"3. Testing Filter: Region='{test_reg}'")
        f_reg = requests.get(f"{BACKEND_URL}/api/kpis/overview?region={test_reg}", headers=headers).json()
        print(f"   Region Revenue: ${f_reg['total_revenue']:,.2f}")

    # 4. Cross Filter (Category + Region)
    if regs and cats:
        print(f"4. Testing Cross Filter: Cat='{test_cat}' + Reg='{test_reg}'")
        cross = requests.get(f"{BACKEND_URL}/api/kpis/overview?category={test_cat}&region={test_reg}", headers=headers).json()
        cross_rev = cross['total_revenue']
        print(f"   Cross Revenue: ${cross_rev:,.2f}")
        
        if cross_rev <= filt_rev:
             print("   [PASS] Cross filter is subset of Category filter.")
        else:
             print("   [FAIL] Cross filter > Category filter!")

if __name__ == "__main__":
    test_filters()
