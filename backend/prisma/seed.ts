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
  const categories = [
    { name: 'Food & Dining', type: 'EXPENSE' },
    { name: 'Transportation', type: 'EXPENSE' },
    { name: 'Shopping', type: 'EXPENSE' },
    { name: 'Entertainment', type: 'EXPENSE' },
    { name: 'Salary', type: 'INCOME' },
    { name: 'Freelance', type: 'INCOME' },
    { name: 'Transfer', type: 'TRANSFER' },
  ];

  for (const cat of categories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name },
    });

    if (!existing) {
      await prisma.category.create({
        data: cat as any,
      });
    }
  }

  console.log('✓ Categories created');

  // Create sample transactions for user1
  console.log('Creating sample transactions...');
  const foodCategory = await prisma.category.findFirst({
    where: { name: 'Food & Dining' },
  });
  const salaryCategory = await prisma.category.findFirst({
    where: { name: 'Salary' },
  });

  if (foodCategory && salaryCategory) {
    await prisma.transaction.createMany({
      data: [
        {
          userId: user1.id,
          categoryId: foodCategory.id,
          amount: 25.50,
          description: 'Lunch at restaurant',
          occurredAt: new Date('2025-11-01'),
          currency: 'USD',
        },
        {
          userId: user1.id,
          categoryId: foodCategory.id,
          amount: 45.00,
          description: 'Grocery shopping',
          occurredAt: new Date('2025-11-03'),
          currency: 'USD',
        },
        {
          userId: user1.id,
          categoryId: salaryCategory.id,
          amount: 3000.00,
          description: 'Monthly salary',
          occurredAt: new Date('2025-11-01'),
          currency: 'USD',
        },
      ],
    });
  }

  console.log('✓ Sample transactions created');

  // Create sample budget
  console.log('Creating sample budget...');
  if (foodCategory) {
    await prisma.budget.create({
      data: {
        userId: user1.id,
        categoryId: foodCategory.id,
        amount: 500.00,
        period: 'MONTHLY',
      },
    });
  }

  console.log('✓ Sample budget created');

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
