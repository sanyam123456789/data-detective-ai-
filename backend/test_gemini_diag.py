import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings

def main():
    print("=== GEMINI DIAGNOSTIC SMOKE TEST ===")
    print(f"GEMINI_MODEL from settings: {settings.GEMINI_MODEL}")
    key = settings.GEMINI_API_KEY
    if not key:
        print("ERROR: GEMINI_API_KEY is not set or empty in settings!")
        return
    print(f"GEMINI_API_KEY is set (length: {len(key)})")

    try:
        from google import genai
        print("Successfully imported `google.genai`")
    except ImportError as e:
        print(f"ImportError: {e}")
        return

    try:
        client = genai.Client(api_key=key.strip())
        print("Successfully instantiated genai.Client")
    except Exception as e:
        print(f"Error instantiating genai.Client: {type(e).__name__}: {e}")
        return

    model_to_test = settings.GEMINI_MODEL or "gemini-3.6-flash"
    print(f"Testing model: '{model_to_test}'...")

    try:
        response = client.models.generate_content(
            model=model_to_test,
            contents="Reply with exactly: Gemini connection successful"
        )
        print(f"SUCCESS! Response received:")
        print(f"Response text: {response.text}")
    except Exception as e:
        print(f"FAILURE calling client.models.generate_content:")
        print(f"Exception Type: {type(e).__name__}")
        print(f"Exception Message: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
