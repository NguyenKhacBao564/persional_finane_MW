import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create demo users
  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      passwordHash: hashedPassword,
      name: 'Demo User',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash: hashedPassword,
      name: 'Test User',
    },
  });

  console.log('✓ Users created');

  // Create categories
  console.log('Creating categories...');
  const categories: Array<{ id: string; name: string; type: 'INCOME' | 'EXPENSE'; color: string }> = [
    { id: 'cat_food', name: 'Food & Dining', type: 'EXPENSE', color: '#F97316' },
    { id: 'cat_transport', name: 'Transport', type: 'EXPENSE', color: '#3B82F6' },
    { id: 'cat_shopping', name: 'Shopping', type: 'EXPENSE', color: '#EC4899' },
    { id: 'cat_bills', name: 'Bills', type: 'EXPENSE', color: '#8B5CF6' },
    { id: 'cat_salary', name: 'Salary', type: 'INCOME', color: '#10B981' },
    { id: 'cat_other', name: 'Other', type: 'EXPENSE', color: '#6B7280' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, color: cat.color },
      create: cat,
    });
  }

  console.log('✓ Categories created');

  // Create accounts
  console.log('Creating accounts...');
  const accounts = [
    { id: 'acc_cash', name: 'Cash', currency: 'VND' },
    { id: 'acc_bank', name: 'Bank Account', currency: 'VND' },
    { id: 'acc_card', name: 'Credit Card', currency: 'VND' },
  ];

  for (const acc of accounts) {
    await prisma.account.upsert({
      where: { id: acc.id },
      update: {},
      create: acc,
    });
  }

  console.log('✓ Accounts created');

  // Create sample transactions for user1
  console.log('Creating sample transactions...');
  await prisma.transaction.createMany({
    data: [
      {
        userId: user1.id,
        accountId: 'acc_cash',
        categoryId: 'cat_food',
        type: 'OUT',
        amount: 25000,
        note: 'Lunch at restaurant',
        occurredAt: new Date('2025-11-01'),
        currency: 'VND',
      },
      {
        userId: user1.id,
        accountId: 'acc_bank',
        categoryId: 'cat_food',
        type: 'OUT',
        amount: 450000,
        note: 'Grocery shopping',
        occurredAt: new Date('2025-11-03'),
        currency: 'VND',
      },
      {
        userId: user1.id,
        accountId: 'acc_bank',
        categoryId: 'cat_salary',
        type: 'IN',
        amount: 30000000,
        note: 'Monthly salary',
        occurredAt: new Date('2025-11-01'),
        currency: 'VND',
      },
    ],
  });

  console.log('✓ Sample transactions created');

  // Create sample budgets
  console.log('Creating sample budgets...');
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  await prisma.budget.createMany({
    data: [
      {
        userId: user1.id,
        categoryId: 'cat_food',
        month: currentMonth,
        limit: 5000000,
      },
      {
        userId: user1.id,
        categoryId: 'cat_transport',
        month: currentMonth,
        limit: 2000000,
      },
    ],
  });

  console.log('✓ Sample budgets created');

  // Create sample goal
  console.log('Creating sample goal...');
  await prisma.goal.create({
    data: {
      userId: user1.id,
      title: 'Emergency Fund',
      targetAmount: 10000.00,
      progress: 2500.00,
      targetDate: new Date('2026-12-31'),
    },
  });

  console.log('✓ Sample goal created');

  console.log('\n✅ Seed completed successfully!');
  console.log('\nDemo credentials:');
  console.log('  Email: demo@example.com');
  console.log('  Password: password123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });