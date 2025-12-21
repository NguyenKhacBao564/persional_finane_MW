import { PrismaClient } from '@prisma/client';
import logger from '../lib/logger.js';

const prisma = new PrismaClient();

/**
 * Default categories with stable IDs for production
 * These are global categories (no userId) shared by all users
 */
const DEFAULT_CATEGORIES = [
  { id: 'cat_food', name: 'Food & Dining', type: 'EXPENSE' as const, color: '#F97316' },
  { id: 'cat_transport', name: 'Transport', type: 'EXPENSE' as const, color: '#3B82F6' },
  { id: 'cat_shopping', name: 'Shopping', type: 'EXPENSE' as const, color: '#EC4899' },
  { id: 'cat_bills', name: 'Bills', type: 'EXPENSE' as const, color: '#8B5CF6' },
  { id: 'cat_entertainment', name: 'Entertainment', type: 'EXPENSE' as const, color: '#06B6D4' },
  { id: 'cat_healthcare', name: 'Healthcare', type: 'EXPENSE' as const, color: '#14B8A6' },
  { id: 'cat_salary', name: 'Salary', type: 'INCOME' as const, color: '#10B981' },
  { id: 'cat_investment', name: 'Investment', type: 'INCOME' as const, color: '#22C55E' },
  { id: 'cat_other', name: 'Other', type: 'EXPENSE' as const, color: '#6B7280' },
];

/**
 * Default accounts with stable IDs for production
 * These are global accounts (no userId) shared by all users
 */
const DEFAULT_ACCOUNTS = [
  { id: 'acc_cash', name: 'Cash', currency: 'VND' },
  { id: 'acc_bank', name: 'Bank Account', currency: 'VND' },
  { id: 'acc_card', name: 'Credit Card', currency: 'VND' },
];

/**
 * Bootstrap the database with required baseline data
 * This function is idempotent - it only creates data if it doesn't exist
 */
export async function bootstrapDatabase(): Promise<void> {
  logger.info('Checking database for required baseline data...');

  try {
    // Check if categories exist
    const categoryCount = await prisma.category.count();
    
    if (categoryCount === 0) {
      logger.info('No categories found, seeding default categories...');
      
      for (const category of DEFAULT_CATEGORIES) {
        await prisma.category.upsert({
          where: { id: category.id },
          update: { name: category.name, color: category.color },
          create: category,
        });
      }
      
      logger.info(`✓ Created ${DEFAULT_CATEGORIES.length} default categories`);
    } else {
      logger.info(`Found ${categoryCount} existing categories, skipping seed`);
      
      // Ensure all default categories exist (in case some were deleted)
      for (const category of DEFAULT_CATEGORIES) {
        await prisma.category.upsert({
          where: { id: category.id },
          update: {},
          create: category,
        });
      }
    }

    // Check if accounts exist
    const accountCount = await prisma.account.count();
    
    if (accountCount === 0) {
      logger.info('No accounts found, seeding default accounts...');
      
      for (const account of DEFAULT_ACCOUNTS) {
        await prisma.account.upsert({
          where: { id: account.id },
          update: {},
          create: account,
        });
      }
      
      logger.info(`✓ Created ${DEFAULT_ACCOUNTS.length} default accounts`);
    } else {
      logger.info(`Found ${accountCount} existing accounts, skipping seed`);
      
      // Ensure all default accounts exist
      for (const account of DEFAULT_ACCOUNTS) {
        await prisma.account.upsert({
          where: { id: account.id },
          update: {},
          create: account,
        });
      }
    }

    logger.info('✅ Database bootstrap completed successfully');
  } catch (error) {
    logger.error({ error }, 'Database bootstrap failed');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export { DEFAULT_CATEGORIES, DEFAULT_ACCOUNTS };
