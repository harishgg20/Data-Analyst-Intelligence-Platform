import google.generativeai as genai
import os

# Load env from .env file manually since we don't have dotenv installed globally maybe?
# Actually backend has it in dependencies.
from backend.services.ai_service import get_api_key

api_key = get_api_key()
if not api_key:
    # Try hardcoded or os env
    api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("No API Key found")
    exit(1)

genai.configure(api_key=api_key)

print("Listing Models:")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name} ({m.display_name})")
except Exception as e:
    print(f"Error listing models: {e}")
