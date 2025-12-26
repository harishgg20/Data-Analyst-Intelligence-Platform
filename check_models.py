import google.generativeai as genai
import os

# Load env manually to avoid dependency
def load_env():
    try:
        with open('backend/.env', 'r') as f:
            for line in f:
                if line.startswith('GEMINI_API_KEY='):
                    return line.strip().split('=')[1]
    except:
        pass
    return os.getenv("GEMINI_API_KEY")

key = load_env()
if not key:
    print("No API Key found")
    exit(1)

genai.configure(api_key=key)

print("Listing models...")
try:
    with open("models_list.txt", "w") as f:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                f.write(f"{m.name}\n")
    print("Models written to models_list.txt")
except Exception as e:
    print(f"Error listing models: {e}")
