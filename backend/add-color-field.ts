import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addColorField() {
  try {
    console.log('Adding color column to Category table...');

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS color TEXT;
    `);

    console.log('✓ Color column added successfully!');
  } catch (error) {
    console.error('Error adding color column:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addColorField();
