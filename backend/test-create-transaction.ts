import { prisma } from './src/config/prisma.js';
import fs from 'fs/promises';
import path from 'path';

const DATABASE_JSON_PATH = path.resolve(
  process.cwd(),
  '../Feature/AI_Chatbot/database/database.json'
);

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('🧪 Testing auto-sync on transaction create\n');

  // Read JSON before
  const before = JSON.parse(await fs.readFile(DATABASE_JSON_PATH, 'utf-8'));
  console.log(`📊 Transactions in JSON before: ${before.transactions.length}`);

  // Create transaction
  console.log('➕ Creating new transaction...');
  const transaction = await prisma.transaction.create({
    data: {
      amount: 12345,
      description: 'Auto-sync test transaction',
      occurredAt: new Date(),
      userId: before.users[0].id, // Use first user
      categoryId: before.categories[0].id, // Use first category
      currency: 'USD',
    },
  });
  console.log(`✓ Created transaction ID: ${transaction.id}\n`);

  // Wait for auto-sync
  console.log('⏳ Waiting 3 seconds for auto-sync...');
  await sleep(3000);

  // Read JSON after
  const after = JSON.parse(await fs.readFile(DATABASE_JSON_PATH, 'utf-8'));
  console.log(`📊 Transactions in JSON after: ${after.transactions.length}`);
  console.log(`⏰ Last updated: ${after.lastUpdated}\n`);

  // Verify
  const found = after.transactions.find((t: any) => t.id === transaction.id);
  if (found) {
    console.log('✅ SUCCESS! Transaction found in JSON:');
    console.log(`   Description: ${found.description}`);
    console.log(`   Amount: $${found.amount}`);
  } else {
    console.log('❌ FAILED! Transaction NOT found in JSON');
  }

  // Cleanup
  console.log('\n🧹 Cleaning up...');
  await prisma.transaction.delete({ where: { id: transaction.id } });
  console.log('✓ Test transaction deleted\n');

  await prisma.$disconnect();
}

main();
