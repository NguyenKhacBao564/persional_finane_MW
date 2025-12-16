from google.genai import types
import time
import os
from dotenv import load_dotenv
from google import genai

# Load .env
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# 1. Create file search store
file_search_store = client.file_search_stores.create(
    config={'display_name': 'your-fileSearchStore-name'}
)
print("Store created:", file_search_store.name)

# 2. Upload JSON (NEW correct syntax)
file_path = os.path.abspath("../database/database.json")

print(os.path.exists(file_path))
print(file_path)

operation = client.file_search_stores.upload_to_file_search_store(
    file=open(file_path, "rb"),
    file_search_store_name=file_search_store.name,
    config=types.UploadToFileSearchStoreConfig(
        display_name="display-file-name"
    )
)

# Wait until indexing completes
while not operation.done:
    print("Indexing...")
    time.sleep(2)
    operation = client.operations.get(operation.name)

print("Indexing complete!")

# 3. Query the file
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Tóm tắt lại nội dung file JSON.",
    config=types.GenerateContentConfig(
        tools=[
            types.Tool(
                file_search=types.FileSearch(
                    file_search_store_names=[file_search_store.name]
                )
            )
        ]
    )
)

print("\n--- RESPONSE ---\n")
print(response.text)

