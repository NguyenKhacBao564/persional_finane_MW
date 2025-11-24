# AI Chatbot Agents Documentation

This directory contains AI agent implementations for the personal finance chatbot feature.

## Overview

The agents system provides intelligent filtering and content moderation for the AI chatbot, ensuring that user interactions remain focused on personal finance topics and appropriate use cases.

## Files Structure

```
agents/
├── __init__.py          # Package initialization
├── guard_agent.py       # Main content filtering agent
├── utils.py             # Utility functions for API interactions
├── development_code.py  # Comprehensive testing suite
├── debug_gemini.py      # Debug script for API responses
└── CLAUDE.md           # This documentation file
```

## Core Components

### GuardAgent Class (`guard_agent.py`)

**Purpose**: Filters user messages to determine if they are relevant to personal finance tasks.

**Key Features**:
- **Vietnamese System Prompt**: Specifically tailored for Vietnamese personal finance applications
- **Content Filtering**: Distinguishes between allowed (finance-related) and not allowed (general/irrelevant) queries
- **Robust JSON Parsing**: Handles various response formats from Gemini API
- **Error Handling**: Graceful degradation when API calls fail or return unexpected formats
- **Rate Limit Handling**: Manages Gemini API quota limitations

**Public Methods**:
```python
# Main filtering method
result = guard_agent.filter_message("How do I track my expenses?")
# Returns: {"chain_of_thought": "...", "decision": "allowed", "message": ""}

# Quick boolean check
allowed = guard_agent.is_allowed("What's the weather today?")
# Returns: False

# Get standard rejection message
rejection = guard_agent.get_rejection_message()
# Returns: "Xin lỗi, tôi chỉ có thể hỗ trợ..."
```

### Utils Module (`utils.py`)

**Purpose**: Provides utility functions for interacting with the Gemini API.

**Main Function**:
```python
response = get_chatbot_response_gemini(
    client=gemini_client,
    model_name="gemini-2.5-flash",
    messages=[
        {"role": "system", "content": "System prompt"},
        {"role": "user", "content": "User message"}
    ],
    temperature=0
)
```

## Content Filtering Rules

### Allowed Topics ✅
1. **Transaction Management**: Adding, editing, viewing transactions
2. **Budget Tracking**: Creating and monitoring budgets
3. **Financial Goals**: Setting and tracking savings goals
4. **Expense Analysis**: Category-wise spending, trends, reports
5. **Income Management**: Tracking sources of income
6. **Financial Advice**: Tips for saving, budgeting, investing

### Not Allowed Topics ❌
1. **Weather Information**: Weather forecasts, conditions
2. **General News**: Current events, sports, entertainment
3. **Technical Support**: Programming, coding help, system issues
4. **Illegal Activities**: Tax evasion, fraudulent advice
5. **Personal Information**: Requests for others' private data
6. **Entertainment**: Movies, games, recreational activities

## Development and Testing

### Running Tests

```bash
# Interactive menu
python development_code.py

# Specific test modes
python development_code.py guard        # Test GuardAgent only
python development_code.py gemini       # Test direct Gemini API
python development_code.py quick        # Test convenience methods
python development_code.py interactive  # Interactive testing mode
```

### Debug Tools

**Debug Script** (`debug_gemini.py`):
- Tests Gemini API response formats
- Helps debug JSON parsing issues
- Analyzes raw API responses

**Test Coverage**:
- **Allowed Queries**: 6 finance-related test cases
- **Not Allowed Queries**: 6 general/irrelevant test cases
- **Edge Cases**: Empty input, ambiguous topics, illegal requests
- **Error Conditions**: API failures, rate limits, malformed responses

## Configuration

### Environment Variables

Required in `/Feature/AI_Chatbot/.env`:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

### Model Configuration

- **Primary Model**: `gemini-2.5-flash`
- **Temperature**: 0 (for consistent filtering decisions)
- **Rate Limit**: 10 requests per minute (free tier)

## Error Handling Strategies

### 1. API Failures
```python
# Graceful fallback to "not allowed"
{
    "chain_of_thought": "API call failed: [error details]",
    "decision": "not allowed",
    "message": "Xin lỗi, tôi chỉ có thể hỗ trợ..."
}
```

### 2. JSON Parsing Errors
```python
# Extract JSON from mixed responses using regex
json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
```

### 3. Rate Limiting
- Automatic retry with exponential backoff
- Safe fallback responses during quota exhaustion

## Integration Examples

### Basic Usage
```python
from guard_agent import GuardAgent

# Initialize agent
agent = GuardAgent()

# Filter user message
result = agent.filter_message("Làm sao để tiết kiệm tiền hàng tháng?")

if result["decision"] == "allowed":
    # Process the finance query
    process_finance_query(user_message)
else:
    # Return rejection message
    return result["message"]
```

### FastAPI Integration
```python
@app.post("/chat")
async def chat_endpoint(message: ChatMessage):
    agent = GuardAgent()

    # Check if message is allowed
    if not agent.is_allowed(message.content):
        return {"response": agent.get_rejection_message()}

    # Process finance query
    finance_response = await process_finance_query(message.content)
    return {"response": finance_response}
```

## Performance Considerations

### 1. Rate Limiting
- **Free Tier**: 10 requests per minute
- **Production**: Consider upgrading to paid tier for higher limits
- **Caching**: Cache frequently asked questions to reduce API calls

### 2. Response Time
- **Average**: 1-3 seconds per API call
- **Timeout**: Set appropriate timeouts for production use
- **Retry Logic**: Implement exponential backoff for failed requests

### 3. Cost Management
- Monitor API usage through Google Cloud Console
- Implement usage quotas in application layer
- Consider response caching for common queries

## Security and Safety

### 1. API Key Management
- Store API keys in environment variables
- Never commit API keys to version control
- Rotate keys regularly

### 2. Content Safety
- Guardian agent prevents inappropriate content
- Fails safely (rejects content if unsure)
- Logs filtering decisions for audit trails

### 3. User Privacy
- No personal data stored in filtering process
- Messages processed in real-time only
- No conversation history retained

## Monitoring and Analytics

### Key Metrics to Track
- **Filter Accuracy**: False positive/negative rates
- **API Usage**: Request volume, success rates
- **Response Times**: Average processing time
- **Error Rates**: API failures, parsing errors

### Logging Strategy
```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Log filtering decisions
logger.info(f"Filter decision: {result['decision']} for: {user_input[:50]}...")
```

## Future Enhancements

### Planned Features
1. **Multi-language Support**: Extend beyond Vietnamese
2. **Contextual Filtering**: Consider conversation history
3. **Custom Rules**: Business-specific filtering logic
4. **Performance Optimization**: Response caching, batch processing
5. **Advanced Analytics**: Detailed usage patterns and insights

### Integration Opportunities
1. **Backend Integration**: Connect to main application routing
2. **Frontend Integration**: Real-time content validation
3. **Admin Dashboard**: Monitoring and configuration interface
4. **A/B Testing**: Compare different filtering strategies

## Troubleshooting

### Common Issues

**1. Rate Limit Errors**
- Wait 60 seconds for quota reset
- Consider upgrading to paid tier
- Implement request batching

**2. JSON Parsing Failures**
- Check Gemini response format changes
- Verify system prompt instructions
- Use debug script to analyze responses

**3. Import Errors**
- Ensure relative imports are correct
- Check Python path configuration
- Verify all dependencies are installed

### Getting Help
- Check debug output in `development_code.py`
- Review `debug_gemini.py` for API analysis
- Examine error logs for detailed failure information
- Test with minimal examples to isolate issues

---

**Last Updated**: 2025-11-08
**Version**: 1.0.0
**Dependencies**: `google-genai`, `python-dotenv`, `typing`