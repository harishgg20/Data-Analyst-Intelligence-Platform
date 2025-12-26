import requests

url = "http://localhost:8000/api/upload/csv"
files = {
    'file': ('test_sales.csv', 'Customer Name,Product,Revenue,Quantity\nJohn Doe,Widget A,$100,1\nJane Smith,Widget B,200,2', 'text/csv')
}

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, files=files)
    print(f"Status Code: {response.status_code}")
    print(f"Response Content: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
