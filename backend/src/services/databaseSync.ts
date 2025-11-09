import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@config/prisma.js';

const DATABASE_JSON_PATH = path.resolve(
  process.cwd(),
  '../Feature/AI_Chatbot/database/database.json'
);

export interface DatabaseSnapshot {
  users: any[];
  transactions: any[];
  categories: any[];
  budgets: any[];
  goals: any[];
  aiInsights: any[];
  lastUpdated: string;
}

/**
 * Fetch all data from database and return as snapshot
 */
export async function fetchDatabaseSnapshot(): Promise<DatabaseSnapshot> {
  const [users, transactions, categories, budgets, goals, aiInsights] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        // Exclude passwordHash for security
      },
    }),
    prisma.transaction.findMany({
      include: {
        category: true,
      },
    }),
    prisma.category.findMany(),
    prisma.budget.findMany({
      include: {
        category: true,
      },
    }),
    prisma.goal.findMany(),
    prisma.aIInsight.findMany({
      include: {
        sourceTransaction: true,
      },
    }),
  ]);

  return {
    users,
    transactions,
    categories,
    budgets,
    goals,
    aiInsights,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Write database snapshot to database.json file
 */
export async function syncToJsonFile(): Promise<void> {
  try {
    const snapshot = await fetchDatabaseSnapshot();

    // Ensure directory exists
    const dir = path.dirname(DATABASE_JSON_PATH);
    await fs.mkdir(dir, { recursive: true });

    // Write to file with pretty formatting
    await fs.writeFile(
      DATABASE_JSON_PATH,
      JSON.stringify(snapshot, null, 2),
      'utf-8'
    );

    console.log(`✓ Database synced to ${DATABASE_JSON_PATH}`);
  } catch (error) {
    console.error('Error syncing database to JSON:', error);
    throw error;
  }
}

/**
 * Read current database.json content
 */
export async function readJsonFile(): Promise<DatabaseSnapshot | null> {
  try {
    const content = await fs.readFile(DATABASE_JSON_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // File doesn't exist or is invalid
    return null;
  }
}
