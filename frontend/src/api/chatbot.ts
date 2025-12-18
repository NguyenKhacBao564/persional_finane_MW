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

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  try {
    const response = await axiosClient.post('/chatbot/message', request);

    if (response.data?.success === false) {
      throw new Error(response.data?.error?.message || 'Failed to send message');
    }

    return response.data.data as ChatResponse;
  } catch (error: any) {
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
    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }
    throw new Error(error.message || 'Failed to get advice');
  }
}
