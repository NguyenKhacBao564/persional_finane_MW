import { geminiClient } from '../../services/geminiClient.js';
import { prisma } from '../../config/prisma.js';
import type { ChatMessageInput } from './validation.js';

export async function sendMessage(userId: string, input: ChatMessageInput) {
  let response;

  if (input.includeContext) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        category: true,
        account: true,
      },
      orderBy: { occurredAt: 'desc' },
      take: 5,
    });

    response = await geminiClient.chatWithContext(input.message, {
      name: user?.name || user?.email,
      recentTransactions,
    });
  } else {
    response = await geminiClient.chat(input.message, input.conversationHistory);
  }

  return response;
}

export async function getFinancialAdvice(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const transactions = await prisma.transaction.findMany({
    where: { userId },
    include: {
      category: true,
    },
    orderBy: { occurredAt: 'desc' },
    take: 20,
  });

  const budgets = await prisma.budget.findMany({
    where: { userId },
    include: {
      category: true,
    },
  });

  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  let prompt = `You are a financial advisor. Analyze this user's financial data and provide personalized advice:\n\n`;
  
  if (user?.name) {
    prompt += `User: ${user.name}\n\n`;
  }

  prompt += `Recent Transactions (${transactions.length}):\n`;
  transactions.forEach((t) => {
    prompt += `- ${t.type}: $${t.amount} for ${t.category?.name || 'Unknown'} on ${new Date(t.occurredAt).toLocaleDateString()}\n`;
  });

  if (budgets.length > 0) {
    prompt += `\nBudgets:\n`;
    budgets.forEach((b) => {
      prompt += `- ${b.category.name}: $${b.limit} per month\n`;
    });
  }

  if (goals.length > 0) {
    prompt += `\nFinancial Goals:\n`;
    goals.forEach((g) => {
      prompt += `- ${g.title}: Target $${g.targetAmount}, Current Progress: $${g.progress}\n`;
    });
  }

  prompt += `\nProvide 3-5 actionable financial tips based on this data.`;

  const response = await geminiClient.chat(prompt);
  return response;
}
