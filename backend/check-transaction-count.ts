import { prisma } from './src/config/prisma.js';

async function main() {
  const count = await prisma.transaction.count();
  console.log('Total transactions in DB:', count);

  const latest = await prisma.transaction.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      amount: true,
      description: true,
      createdAt: true,
    }
  });

  console.log('\nLatest 5 transactions:');
  latest.forEach((t, i) => {
    console.log(`${i + 1}. ${t.description} - $${t.amount} (${t.createdAt.toISOString()})`);
  });

  await prisma.$disconnect();
}

main();
