import OpenAI from 'openai';
import { env } from '../config/env.js';

const API_KEY = env.OPENAI_API_KEY || '';
const isConfigured = API_KEY.length > 0;

// Centralized OpenAI client so rate limiting + prompt templates can be shared.
const client = isConfigured ? new OpenAI({ apiKey: API_KEY }) : null;

/**
 * Check if OpenAI is configured
 */
export function isOpenAIConfigured(): boolean {
  return isConfigured;
}

export const openaiClient = {
  async mockInsight() {
    if (!isConfigured) {
      return {
        status: 'not-configured',
        message: 'OpenAI is not configured. Please set OPENAI_API_KEY environment variable.',
      };
    }
    return {
      status: 'pending-integration',
      nextSteps: 'Replace with actual OpenAI call once prompts are defined.'
    };
  },
  get raw() {
    if (!client) {
      throw new Error('OpenAI is not configured. Please set OPENAI_API_KEY environment variable.');
    }
    return client;
  },
  isConfigured,
};
