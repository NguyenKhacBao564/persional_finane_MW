import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Update existing categories with color codes
 */
async function updateCategoryColors() {
  const categoryColors: Record<string, string> = {
    // INCOME categories - green shades
    'Salary': '#10b981',
    'Freelance': '#34d399',
    'Investment': '#6ee7b7',
    'Gift': '#a7f3d0',
    'Other Income': '#d1fae5',

    // EXPENSE categories - various colors
    'Food & Dining': '#f97316',
    'Groceries': '#fb923c',
    'Transportation': '#3b82f6',
    'Utilities': '#8b5cf6',
    'Entertainment': '#ec4899',
    'Shopping': '#f43f5e',
    'Healthcare': '#ef4444',
    'Fitness': '#06b6d4',
    'Education': '#14b8a6',
    'Other Expense': '#6b7280',

    // TRANSFER category - blue
    'Transfer': '#0ea5e9',
  };

  console.log('Updating categories with colors...');

  for (const [name, color] of Object.entries(categoryColors)) {
    try {
      const updated = await prisma.category.updateMany({
        where: { name },
        data: { color },
      });

      if (updated.count > 0) {
        console.log(`✓ Updated "${name}" with color ${color}`);
      } else {
        console.log(`⚠ Category "${name}" not found`);
      }
    } catch (error) {
      console.error(`✗ Failed to update "${name}":`, error);
    }
  }

  console.log('\nDone! Categories updated with colors.');
}

updateCategoryColors()
  .catch((error) => {
    console.error('Error updating categories:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
