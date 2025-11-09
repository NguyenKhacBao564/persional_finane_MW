// Test PostgreSQL connection and show current data
// Usage: node test-connection.js

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔌 Testing PostgreSQL connection...\n');

    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully!\n');

    // Count records
    console.log('📊 Record counts:');
    console.log('─'.repeat(50));

    const userCount = await prisma.user.count();
    console.log(`Users:        ${userCount}`);

    const transactionCount = await prisma.transaction.count();
    console.log(`Transactions: ${transactionCount}`);

    const categoryCount = await prisma.category.count();
    console.log(`Categories:   ${categoryCount}`);

    const budgetCount = await prisma.budget.count();
    console.log(`Budgets:      ${budgetCount}`);

    const goalCount = await prisma.goal.count();
    console.log(`Goals:        ${goalCount}`);

    console.log('─'.repeat(50));
    console.log('');

    // Show recent users
    console.log('👥 Recent Users:');
    console.log('─'.repeat(50));
    const users = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        email: true,
        name: true,
        createdAt: true,
      },
    });
    users.forEach((user) => {
      console.log(`- ${user.email} (${user.name}) - ${user.createdAt.toISOString().split('T')[0]}`);
    });
    console.log('');

    // Show recent transactions
    console.log('💰 Recent Transactions:');
    console.log('─'.repeat(50));
    const transactions = await prisma.transaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        description: true,
        amount: true,
        currency: true,
        occurredAt: true,
        createdAt: true,
      },
    });
    transactions.forEach((tx) => {
      console.log(`- ${tx.description || 'N/A'} | ${tx.amount} ${tx.currency} | ${tx.occurredAt.toISOString().split('T')[0]}`);
    });
    console.log('');

    // Show categories
    console.log('📁 Categories:');
    console.log('─'.repeat(50));
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: {
        name: true,
        type: true,
      },
    });
    categories.forEach((cat) => {
      console.log(`- ${cat.name} (${cat.type})`);
    });
    console.log('');

    console.log('✅ All data verified!\n');
    console.log('💡 If pgAdmin doesn\'t show this data:');
    console.log('   1. Open pgAdmin 4');
    console.log('   2. Right-click server → Properties');
    console.log('   3. Connection tab → Host = "localhost" (NOT "db")');
    console.log('   4. Save → Disconnect → Connect again');
    console.log('   5. Right-click Tables → Refresh (F5)');
    console.log('   6. Right-click Transaction → View/Edit Data → All Rows\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   - Check if Docker containers are running: docker-compose ps');
    console.error('   - Check DATABASE_URL in .env file');
    console.error('   - Try: docker-compose restart db\n');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
