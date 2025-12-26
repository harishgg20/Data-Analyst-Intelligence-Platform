import requests

url = "http://localhost:8000/api/upload/analyze"
files = {'file': ('test.csv', 'col1,col2\nval1,val2\nval3,val4', 'text/csv')}

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, files=files)
    print(f"Status Code: {response.status_code}")
    print(f"Response Content: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
