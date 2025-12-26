import requests
import os
import sys

# Change to backend directory to import modules if needed, though we primarily test endpoints
BACKEND_URL = "http://localhost:8000"

def test_replace_workflow():
    print("--- Testing CSV Upload with Replacement Workflow ---")
    
    # 1. Clear Data explicitly (simulating what the frontend does)
    print("1. Clearing existing data...")
    res = requests.delete(f"{BACKEND_URL}/api/upload/clear")
    if res.status_code == 200:
        print("   Success: Data cleared.")
    else:
        print(f"   Failed to clear data: {res.status_code} - {res.text}")
        return

    # 2. Upload a small test CSV
    # Create dummy csv content
    csv_content = """Date,Category,Product Name,Quantity,Revenue,Region
2023-01-01,Electronics,Test Widget A,10,1000.0,North
2023-01-02,Clothing,Test Shirt B,5,500.0,South
"""
    files = {'file': ('test_replace.csv', csv_content, 'text/csv')}
    
    print("2. Uploading new test dataset...")
    res = requests.post(f"{BACKEND_URL}/api/upload/csv", files=files)
    
    if res.status_code == 200:
        data = res.json()
        print(f"   Success: Uploaded {data.get('total_orders')} orders.")
    else:
        print(f"   Failed to upload: {res.status_code} - {res.text}")
        return

    # 3. Verify KPIs immediately reflect ONLY this new data
    # We expect Total Revenue = 1500, Orders = 2
    print("3. Verifying KPIs...")
    kpi_res = requests.get(f"{BACKEND_URL}/api/kpi/total_revenue")
    if kpi_res.status_code == 200:
        rev_data = kpi_res.json()
        total_rev = rev_data.get('total_revenue', 0)
        print(f"   Total Revenue: {total_rev}")
        if total_rev == 1500.0:
            print("   [PASS] Revenue matches expected value (1500.0).")
        else:
            print(f"   [FAIL] Revenue {total_rev} != 1500.0. Old data might Persist!")
    
    # 4. Upload AGAIN with APPEND (simulated by NOT clearing)
    print("\n--- Testing Append Workflow ---")
    csv_content_2 = """Date,Category,Product Name,Quantity,Revenue,Region
2023-02-01,Electronics,Test Widget C,1,100.0,East
"""
    files2 = {'file': ('test_append.csv', csv_content_2, 'text/csv')}
    
    print("4. Uploading additional data (Append)...")
    res = requests.post(f"{BACKEND_URL}/api/upload/csv", files=files2)
    
    # 5. Verify KPIs reflect SUM (1500 + 100 = 1600)
    print("5. Verifying KPIs after append...")
    kpi_res = requests.get(f"{BACKEND_URL}/api/kpi/total_revenue")
    if kpi_res.status_code == 200:
        rev_data = kpi_res.json()
        total_rev = rev_data.get('total_revenue', 0)
        print(f"   Total Revenue: {total_rev}")
        if total_rev == 1600.0:
            print("   [PASS] Revenue matches expected value (1600.0).")
        else:
            print(f"   [FAIL] Revenue {total_rev} != 1600.0.")

if __name__ == "__main__":
    try:
        test_replace_workflow()
    except Exception as e:
        print(f"An error occurred: {e}")
