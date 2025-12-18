import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || '');

const MODELS_TO_TRY = [
  'models/gemini-flash-latest',
  'models/gemini-2.0-flash',
  'models/gemini-2.5-flash',
];

async function generateWithFallback(prompt: string): Promise<string> {
  let lastError: Error | null = null;

  for (const modelName of MODELS_TO_TRY) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error(`Model ${modelName} failed:`, error instanceof Error ? error.message : error);
      lastError = error as Error;
      continue;
    }
  }

  throw lastError || new Error('All models failed');
}

export const geminiClient = {
  async chat(message: string, conversationHistory?: Array<{ role: string; content: string }>) {
    try {
      let prompt = message;
      if (conversationHistory && conversationHistory.length > 0) {
        const historyText = conversationHistory
          .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
          .join('\n');
        prompt = `${historyText}\nUser: ${message}`;
      }

      const text = await generateWithFallback(prompt);

      return {
        success: true,
        message: text,
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      return {
        success: false,
        message: 'Sorry, I encountered an error processing your request.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async chatWithContext(message: string, userContext?: { name?: string; recentTransactions?: any[] }) {
    try {
      let contextPrompt = 'You are a helpful personal finance assistant. ';
      
      if (userContext?.name) {
        contextPrompt += `The user's name is ${userContext.name}. `;
      }

      if (userContext?.recentTransactions && userContext.recentTransactions.length > 0) {
        contextPrompt += 'Here are some of their recent transactions:\n';
        userContext.recentTransactions.slice(0, 5).forEach((t: any) => {
          contextPrompt += `- ${t.type}: $${t.amount} for ${t.category?.name || 'Unknown'} on ${new Date(t.occurredAt).toLocaleDateString()}\n`;
        });
      }

      contextPrompt += `\nUser question: ${message}`;

      const text = await generateWithFallback(contextPrompt);

      return {
        success: true,
        message: text,
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      return {
        success: false,
        message: 'Sorry, I encountered an error processing your request.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
