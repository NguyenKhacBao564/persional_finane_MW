
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')
client = genai.Client(api_key=api_key)

uri = "https://generativelanguage.googleapis.com/v1beta/files/s02kaqyh6yo3"

try:
    print(f"Checking {uri}...")
    f_obj = client.files.get(name=uri)
    print(f"State: {f_obj.state}")
    print(f"Mime: {f_obj.mime_type}")
    print(f"Size: {f_obj.size_bytes}")
except Exception as e:
    print(f"Error: {e}")
