/**
 * Demo script to show auto-sync in action
 *
 * This script will:
 * 1. Create a new category
 * 2. Wait for auto-sync to trigger
 * 3. Read the JSON file to verify sync
 * 4. Delete the test category
 */

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

async function readJsonFile() {
  try {
    const data = await fs.readFile(DATABASE_JSON_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

async function main() {
  console.log('🎬 Starting auto-sync demo...\n');

  // 1. Check initial state
  console.log('📊 Step 1: Reading initial JSON file...');
  const before = await readJsonFile();
  const categoriesCountBefore = before?.categories?.length || 0;
  console.log(`   ✓ Current categories count: ${categoriesCountBefore}\n`);

  // 2. Create a test category
  console.log('➕ Step 2: Creating test category...');
  const testCategory = await prisma.category.create({
    data: {
      name: 'Auto-Sync Test Category',
      type: 'EXPENSE',
      color: '#FF5733',
    },
  });
  console.log(`   ✓ Created category: ${testCategory.name} (ID: ${testCategory.id})\n`);

  // 3. Wait for auto-sync (it runs in background)
  console.log('⏳ Step 3: Waiting for auto-sync to complete (3 seconds)...');
  await sleep(3000);
  console.log('   ✓ Wait complete\n');

  // 4. Verify sync
  console.log('🔍 Step 4: Verifying sync...');
  const after = await readJsonFile();
  const categoriesCountAfter = after?.categories?.length || 0;
  const lastUpdated = after?.lastUpdated;

  console.log(`   ✓ Categories count after: ${categoriesCountAfter}`);
  console.log(`   ✓ Last updated: ${lastUpdated}`);

  if (categoriesCountAfter > categoriesCountBefore) {
    console.log('   ✅ Auto-sync SUCCESSFUL! New category detected in JSON file\n');
  } else {
    console.log('   ⚠️  Auto-sync may not have completed yet\n');
  }

  // 5. Verify the category exists in JSON
  const foundInJson = after?.categories?.find(
    (c: any) => c.id === testCategory.id
  );
  if (foundInJson) {
    console.log('✅ Step 5: Test category found in JSON file:');
    console.log(`   Name: ${foundInJson.name}`);
    console.log(`   Type: ${foundInJson.type}`);
    console.log(`   Color: ${foundInJson.color}\n`);
  }

  // 6. Cleanup - delete test category
  console.log('🧹 Step 6: Cleaning up test category...');
  await prisma.category.delete({
    where: { id: testCategory.id },
  });
  console.log('   ✓ Test category deleted from database\n');

  // 7. Wait for auto-sync again
  console.log('⏳ Step 7: Waiting for deletion sync...');
  await sleep(3000);

  const afterDelete = await readJsonFile();
  const categoriesCountFinal = afterDelete?.categories?.length || 0;
  console.log(`   ✓ Final categories count: ${categoriesCountFinal}`);

  if (categoriesCountFinal === categoriesCountBefore) {
    console.log('   ✅ Deletion sync SUCCESSFUL!\n');
  }

  console.log('🎉 Demo completed!\n');
  console.log('Summary:');
  console.log(`   - Initial count: ${categoriesCountBefore}`);
  console.log(`   - After create: ${categoriesCountAfter}`);
  console.log(`   - After delete: ${categoriesCountFinal}`);
  console.log(`   - Auto-sync is ${categoriesCountAfter > categoriesCountBefore && categoriesCountFinal === categoriesCountBefore ? 'WORKING ✅' : 'NEEDS CHECK ⚠️'}`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Demo failed:', error);
  process.exit(1);
});
