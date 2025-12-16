## Personal Finance AI Chatbot

AI-powered chatbot for personal finance management using Google Gemini File Search and specialized agents.

## 🌟 Features

- **Transaction Analysis**: Analyze spending by category, date, and patterns
- **Budget Tracking**: Monitor budget utilization and burn rate
- **Goal Management**: Track progress toward financial goals with recommendations
- **Spending Insights**: Identify trends and anomalies in spending habits
- **Natural Language Queries**: Ask questions in plain English/Vietnamese
- **Multi-User Support**: Isolated data stores per user for privacy

## 🏗️ Architecture

### Data Pipeline
```
database.json → Data Cleaner → Per-User Files (CSV, JSON, MD)
                                ↓
                         Gemini File Search Stores
```

### Agent System
```
User Query → RouterAgent → [TransactionAnalyst | BudgetAdvisor | 
                            SpendingInsights | GoalTracker]
                            ↓
                     Gemini File Search
                            ↓
                      AI Response
```

## 📂 Project Structure

```
AI_Chatbot/
├── agents/                    # Specialized AI agents
│   ├── shared/               # Shared utilities
│   │   ├── file_search_client.py
│   │   ├── types.py
│   │   └── formatters.py
│   ├── router_agent.py       # Query routing orchestrator
│   ├── transaction_analyst.py
│   ├── budget_advisor.py
│   ├── spending_insights.py
│   └── goal_tracker.py
├── database/                 # Raw data
│   └── database.json
├── cleaned_data/            # Processed data for Gemini
│   ├── store_knowledge/     # Global knowledge base
│   └── store_user_*/        # Per-user stores
├── test/                    # Testing and demos
│   ├── chatbot_demo.py     # Full chatbot demo
│   └── respone_test.py
├── data_cleaner.py         # Data preprocessing pipeline
├── gemini_file_search.py   # Gemini API wrapper
├── chatbot.py              # Main chatbot interface
└── .env                    # Environment variables
```

## 🚀 Quick Start

### 1. Prerequisites

```bash
conda activate py310  # Python 3.10+
```

### 2. Install Dependencies

```bash
pip install -r requirement.txt
```

### 3. Configure API Keys

```bash
cp .env_example .env
# Edit .env and add your GEMINI_API_KEY
```

### 4. Prepare Data

```bash
# Clean and export data
python data_cleaner.py

# Setup Gemini File Search stores and upload files
python gemini_file_search.py setup
```

### 5. Run Demo

```bash
# Quick demo (3 queries)
python test/chatbot_demo.py --quick

# Full demo (all scenarios)
python test/chatbot_demo.py

# Interactive session
python chatbot.py --user-id 44dfe804-3a46-4206-91a9-2685f7d5e003
```

## 💬 Usage Examples

### Command Line

```bash
# List available users
python chatbot.py --list-users

# Single query
python chatbot.py --user-id USER_ID --query "How much did I spend on Food?"

# Interactive session
python chatbot.py --user-id USER_ID
```

### Python API

```python
from chatbot import PersonalFinanceChatbot

# Initialize chatbot
chatbot = PersonalFinanceChatbot()

# Get response
result = chatbot.chat(
    user_id="44dfe804-3a46-4206-91a9-2685f7d5e003",
    query="What is my total spending this month?"
)

print(result['response'])
```

## 🤖 Available Agents

### 1. TransactionAnalyst
- Analyzes individual transactions
- Provides category breakdowns
- Identifies patterns and notable expenses
- **Triggers**: Specific amount queries, transaction lists, category spending

### 2. BudgetAdvisor
- Tracks budget utilization
- Calculates burn rate
- Projects month-end spending
- Provides budget recommendations
- **Triggers**: "budget", "over", "under", "left", "remaining"

### 3. SpendingInsights
- Identifies spending trends
- Compares month-over-month patterns
- Detects anomalies
- Suggests optimization opportunities
- **Triggers**: "trend", "pattern", "compare", "insights", "unusual"

### 4. GoalTracker
- Monitors financial goal progress
- Calculates required monthly contributions
- Provides achievement timelines
- Offers motivational guidance
- **Triggers**: "goal", "save", "target", "emergency fund", "on track"

## 📊 Data Flow

### 1. Data Cleaning (`data_cleaner.py`)

```
Input: database.json
  ↓
• Normalize transactions (dates, amounts, categories)
• Deduplicate records (transactions, budgets, goals)
• Enrich with calculated fields (signed_amount, month, etc.)
• Export per-user files:
  - transactions_YYYY-MM.csv (monthly partitioned)
  - budgets.json
  - goals.json
  - summary_YYYY-MM.md (natural language)
  - user_profile.json
  ↓
Output: cleaned_data/ directory
```

**Deduplication Results**:
- Transactions: 10 → 7 (3 duplicates removed)
- Budgets: 2 → 1 (1 duplicate removed)
- Goals: 2 → 1 (1 duplicate removed)

### 2. File Search Setup (`gemini_file_search.py`)

```
Input: cleaned_data/
  ↓
• Create FileSearchStore per user
• Create knowledge store (glossary, guidelines, categories)
• Upload files to respective stores
  ↓
Output: store_mapping.json (store IDs)
```

### 3. Query Processing (`chatbot.py`)

```
User Query
  ↓
RouterAgent (classify intent)
  ↓
Specialist Agent (enhance query)
  ↓
FileSearchClient (Gemini API)
  ↓
Gemini File Search (semantic retrieval)
  ↓
AgentResponse (formatted answer)
```

## 🔧 Configuration

### Environment Variables

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional (for other features)
HF_TOKEN=your_huggingface_token
SAGEMAKER_EXECUTION_ROLE_ARN=your_sagemaker_role
```

### Model Settings

Default model: `gemini-2.5-flash`

To change model:
```python
from agents.shared import QueryOptions

options = QueryOptions(model="gemini-2.0-flash-exp")
result = chatbot.chat(user_id, query, options)
```

## 📈 Performance

### Test Results (Phase 2)

All 5 test queries passed with accurate responses:

1. **Food spending**: ✅ $70.50 (14.1% of budget)
2. **Budget status**: ✅ Correct percentage calculation
3. **Goal tracking**: ✅ $10,000 target, $576.92/month required
4. **Income vs expenses**: ✅ $3,000 income, $70.50 expenses
5. **Recent transactions**: ✅ Correctly listed lunch and grocery

### Query Response Times
- Average: 4-6 seconds per query
- Includes Gemini API latency and file search

## 🧪 Testing

```bash
# Data cleaner tests
python test_data_cleaner.py

# File search tests
python test_gemini_search.py

# Chatbot demo
python test/chatbot_demo.py --quick        # Quick (3 queries)
python test/chatbot_demo.py                # Full demo
python test/chatbot_demo.py --scenario 1   # Budget tracking
python test/chatbot_demo.py --scenario 2   # Goal tracking
python test/chatbot_demo.py --scenario 3   # Transaction analysis
python test/chatbot_demo.py --scenario 4   # Spending insights
```

## 🔐 Security & Privacy

- **Per-User Isolation**: Each user has a separate FileSearchStore
- **No PII Leakage**: User data never mixed across stores
- **API Key Protection**: Keys stored in .env (not committed)
- **Data Retention**: Gemini stores files until manually deleted

## 📝 Logs

All operations are logged to:
- `data_cleaner.log` - Data preprocessing
- `gemini_file_search.log` - File upload and search operations
- Console output for chatbot interactions

## 🐛 Troubleshooting

### "Store mapping not found"
```bash
python gemini_file_search.py setup
```

### "User not found"
```bash
python chatbot.py --list-users
```

### "API quota exceeded"
Wait 60 seconds or upgrade to paid tier. Free tier limits:
- 15 requests per minute
- 1 million tokens per day

### "File upload failed"
Check file size (max 100MB) and format (JSON, CSV, MD supported)

## 🚀 Deployment

### Docker (Recommended)

```bash
# Build image
docker build -t finance-chatbot .

# Run container
docker run -it --env-file .env finance-chatbot
```

### Manual Deployment

```bash
# Install dependencies
pip install -r requirement.txt

# Setup data
python data_cleaner.py
python gemini_file_search.py setup

# Run chatbot
python chatbot.py --user-id USER_ID
```

## 📚 API Reference

### PersonalFinanceChatbot

```python
class PersonalFinanceChatbot:
    def __init__(self, store_mapping_path: str = 'store_mapping.json')
    
    def chat(self, user_id: str, query: str, options: QueryOptions = None) -> Dict
    
    def list_users(self) -> Dict[str, str]
    
    def interactive_session(self, user_id: str)
```

### Response Format

```python
{
    "success": True,
    "agent": "TransactionAnalyst",
    "response": "Your total spending on Food & Dining is $70.50...",
    "confidence": 0.9,
    "metadata": {
        "query_type": "transaction_analysis",
        "stores_queried": ["fileSearchStores/..."]
    },
    "user": "Demo User",
    "timestamp": "2025-11-24T17:52:11"
}
```

## 🛠️ Development

### Adding a New Agent

1. Create agent file in `agents/`:
```python
from .shared import UserContext, QueryOptions, AgentResponse, FileSearchClient

class MyNewAgent:
    def __init__(self, file_search_client: FileSearchClient):
        self.client = file_search_client
        self.name = "MyAgent"
    
    def analyze(self, user_context, query, options=None):
        # Implementation
        return AgentResponse(...)
```

2. Register in `router_agent.py`:
```python
self.my_agent = MyNewAgent(file_search_client)
```

3. Add routing logic:
```python
if 'keyword' in query_lower:
    return self.my_agent
```

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

- GitHub Issues: [Report bugs](https://github.com/your-repo/issues)
- Documentation: See AGENTS.md for detailed agent specs
- Email: support@example.com

## 🎯 Roadmap

- [ ] Multi-language support (Vietnamese, English)
- [ ] Real-time budget alerts
- [ ] Advanced anomaly detection
- [ ] Spending prediction models
- [ ] Mobile app integration
- [ ] Export reports (PDF, Excel)
- [ ] Recurring transaction detection
- [ ] Bill payment reminders

## 📊 Stats

- **Languages**: Python 3.10+
- **AI Model**: Google Gemini 2.5 Flash
- **Data Processing**: 10→7 transactions (30% dedup rate)
- **Agents**: 4 specialized + 1 router
- **Test Coverage**: 5/5 queries passed
- **Response Accuracy**: 100% on test suite
