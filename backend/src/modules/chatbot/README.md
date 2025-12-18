# Chatbot Module

This module provides an AI-powered chatbot using Google Gemini API for financial advice and assistance.

## Features

- **Interactive Chat**: Send messages and receive AI-generated responses
- **Context-Aware**: Can include user's financial data (transactions, budgets, goals) in responses
- **Financial Advice**: Get personalized financial tips based on your data
- **Conversation History**: Maintains conversation context for better responses

## API Endpoints

### POST `/api/chatbot/message`

Send a message to the chatbot.

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "message": "How can I save more money?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant",
      "content": "Previous response"
    }
  ],
  "includeContext": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "AI-generated response"
  }
}
```

### GET `/api/chatbot/advice`

Get personalized financial advice based on your financial data.

**Authentication**: Required (Bearer token)

**Response**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Personalized financial advice with 3-5 actionable tips"
  }
}
```

## Environment Variables

Add to `.env` file:

```
GEMINI_API_KEY=your-gemini-api-key-here
```

Get your API key from: https://makersuite.google.com/app/apikey

## Usage

The chatbot is integrated into the frontend as a floating button in the bottom-right corner. Users can:

1. Click the chatbot button to open the chat window
2. Type messages to ask questions about their finances
3. Click "Get Financial Advice" to receive personalized tips
4. View conversation history in the chat window

## Implementation Details

- **Service Layer**: `service.ts` - Handles business logic and data fetching
- **Validation Layer**: `validation.ts` - Validates input using Zod schemas
- **Router Layer**: `index.ts` - Defines API endpoints and error handling
- **Gemini Client**: `../../services/geminiClient.ts` - Wrapper for Google Gemini API

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```
