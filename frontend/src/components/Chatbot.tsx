import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/ui/button';
import { sendChatMessage, getFinancialAdvice, type ChatMessage } from '@/api/chatbot';
import { cn } from '@/lib/utils';

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage({
        message: userMessage.content,
        conversationHistory: messages,
        includeContext: true,
      });

      if (response.success) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.message,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetAdvice = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await getFinancialAdvice();

      if (response.success) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.message,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error getting advice. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
          aria-label="Open chatbot"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white dark:bg-slate-900 rounded-lg shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <h3 className="font-semibold">Financial Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded-full p-1 transition-colors"
              aria-label="Close chatbot"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-slate-500 dark:text-slate-400 mt-8">
                <Sparkles className="h-12 w-12 mx-auto mb-3 text-blue-500" />
                <p className="text-sm mb-4">Hi! I'm your financial assistant.</p>
                <Button
                  onClick={handleGetAdvice}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Get Financial Advice
                </Button>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-4 py-2',
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-600 dark:text-slate-400" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 dark:border-slate-800 p-4">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about your finances..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-50"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
