import { axiosClient } from './axiosClient';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  includeContext?: boolean;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface ChatStatusResponse {
  available: boolean;
  message: string;
}

/**
 * Check if the AI chatbot is available/configured
 */
export async function getChatbotStatus(): Promise<ChatStatusResponse> {
  try {
    const response = await axiosClient.get('/chatbot/status');
    return response.data.data as ChatStatusResponse;
  } catch (error: any) {
    return {
      available: false,
      message: 'Unable to check AI status',
    };
  }
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  try {
    const response = await axiosClient.post('/chatbot/message', request);

    if (response.data?.success === false) {
      throw new Error(response.data?.error?.message || 'Failed to send message');
    }

    return response.data.data as ChatResponse;
  } catch (error: any) {
    // Check for 503 (AI not configured)
    if (error.response?.status === 503) {
      const message = error.response?.data?.error?.message || 
        'AI chatbot is not configured. Please contact the administrator.';
      return {
        success: false,
        message,
        error: 'AI_NOT_CONFIGURED',
      };
    }
    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }
    throw new Error(error.message || 'Failed to send message');
  }
}

export async function getFinancialAdvice(): Promise<ChatResponse> {
  try {
    const response = await axiosClient.get('/chatbot/advice');

    if (response.data?.success === false) {
      throw new Error(response.data?.error?.message || 'Failed to get advice');
    }

    return response.data.data as ChatResponse;
  } catch (error: any) {
    // Check for 503 (AI not configured)
    if (error.response?.status === 503) {
      const message = error.response?.data?.error?.message || 
        'AI chatbot is not configured. Please contact the administrator.';
      return {
        success: false,
        message,
        error: 'AI_NOT_CONFIGURED',
      };
    }
    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }
    throw new Error(error.message || 'Failed to get advice');
  }
}
