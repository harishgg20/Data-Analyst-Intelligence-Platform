import requests
import csv
import io
import random
import time

# Generate 5000 rows (simulating the user's volume)
rows = []
rows.append(["Customer Name", "Product", "Revenue", "Quantity"])
for i in range(5000):
    rows.append([
        f"Customer {i}",
        f"Product {random.choice(['A', 'B', 'C', 'D', 'E'])}",
        f"{random.uniform(10, 500):.2f}",
        f"{random.randint(1, 10)}"
    ])

output = io.StringIO()
writer = csv.writer(output)
writer.writerows(rows)
csv_content = output.getvalue()

url = "http://localhost:8000/api/upload/csv"
files = {
    'file': ('heavy_test_5k.csv', csv_content, 'text/csv')
}

try:
    print(f"Sending 5000 rows to {url}...")
    start_time = time.time()
    response = requests.post(url, files=files, timeout=300) 
    end_time = time.time()
    
    print(f"Status Code: {response.status_code}")
    print(f"Time Taken: {end_time - start_time:.2f} seconds")
    print(f"Response: {response.text[:200]}")
except Exception as e:
    print(f"Request failed: {e}")
