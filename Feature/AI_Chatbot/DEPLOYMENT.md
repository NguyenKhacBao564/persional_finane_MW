# Deployment Guide - Personal Finance AI Chatbot

## Quick Start (Docker)

```bash
# 1. Configure environment
cp .env_example .env
# Edit .env and add GEMINI_API_KEY

# 2. Build image
docker build -t finance-chatbot .

# 3. Run setup (one-time)
docker-compose --profile setup run setup

# 4. Start chatbot
docker-compose up chatbot

# 5. Run demo
docker-compose --profile demo run demo
```

## Manual Setup

```bash
# 1. Install dependencies
conda activate py310
pip install -r requirement.txt

# 2. Configure API key
cp .env_example .env
# Add GEMINI_API_KEY to .env

# 3. Clean data
python data_cleaner.py

# 4. Setup Gemini stores
python gemini_file_search.py setup

# 5. Test
python test/chatbot_demo.py --quick

# 6. Run chatbot
python chatbot.py --user-id USER_ID
```

## Files Generated

- `cleaned_data/` - Processed data (13 files)
- `store_mapping.json` - Gemini store IDs
- `*.log` - Operation logs
- `test_search_results.json` - Test results

## Available Commands

```bash
# Data management
python data_cleaner.py              # Clean database.json
python gemini_file_search.py setup  # Create stores & upload
python gemini_file_search.py list   # List stores
python gemini_file_search.py cleanup # Delete all stores

# Chatbot
python chatbot.py --list-users
python chatbot.py --user-id USER_ID --query "Your question"
python chatbot.py --user-id USER_ID  # Interactive

# Testing
python test_data_cleaner.py
python test_gemini_search.py
python test/chatbot_demo.py --quick
python test/chatbot_demo.py --scenario 1
```

## Environment Variables

Required:
- `GEMINI_API_KEY` - Google Gemini API key


## Troubleshooting

**"Store mapping not found"**
```bash
python gemini_file_search.py setup
```

**"API quota exceeded"**
- Wait 60 seconds (free tier: 15 req/min)
- Or upgrade to paid tier

**"ModuleNotFoundError"**
```bash
pip install -r requirement.txt
```
