import OpenAI from 'openai';
import { env } from '../config/env.js';

// Centralized OpenAI client so rate limiting + prompt templates can be shared.
const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export const openaiClient = {
  async mockInsight() {
    return {
      status: 'pending-integration',
      nextSteps: 'Replace with actual OpenAI call once prompts are defined.'
    };
  },
  raw: client,
};
