import requests
import csv
import io

# URL of the running backend
URL = "http://localhost:8000/api/upload/csv"

# Test Data
csv_content = """Date,Category,Product,Revenue,Quantity
2023-01-01,Electronics,Laptop,9991,1
2023-01-02,Clothing,T-Shirt,9992,1
2023-01-03,Electronics,Mouse,9993,2
"""

# Create a virtual file
files = {'file': ('test_data.csv', csv_content, 'text/csv')}

try:
    print(f"Uploading test CSV to {URL}...")
    response = requests.post(URL, files=files, timeout=5)
    
    if response.status_code == 200:
        print("Upload Successful!")
        print(response.json())
    else:
        print(f"Upload Failed: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"Test Failed: {e}")
