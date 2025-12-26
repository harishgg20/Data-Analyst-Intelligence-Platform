import sys
import os
sys.path.append(os.getcwd())

from fastapi.testclient import TestClient
from backend.main import app
from backend import dependencies

# Override auth to bypass login requirement for testing
async def mock_require_viewer():
    return {"id": 1, "role": "viewer"}

app.dependency_overrides[dependencies.require_viewer] = mock_require_viewer

client = TestClient(app)

def test_filters():
    print("Testing /api/kpis/filters...")
    try:
        response = client.get("/api/kpis/filters")
        print(f"Status Code: {response.status_code}")
        print(f"Response JSON: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_filters()
