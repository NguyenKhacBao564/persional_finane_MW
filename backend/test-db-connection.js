// Test database connection with new Docker PostgreSQL
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  console.log('\n=== Testing Database Connection ===\n');

  try {
    // Test 1: Basic connection
    console.log('[1/3] Testing basic connection...');
    await prisma.$connect();
    console.log('  ✓ Connection successful!\n');

    // Test 2: Query database
    console.log('[2/3] Testing database query...');
    const userCount = await prisma.user.count();
    console.log(`  ✓ Found ${userCount} users in database\n`);

    // Test 3: Try to create a test user
    console.log('[3/3] Testing user creation...');
    const testUser = await prisma.user.create({
      data: {
        email: `test${Date.now()}@example.com`,
        passwordHash: 'test_hash',
        name: 'Test User',
      },
    });
    console.log(`  ✓ Test user created with ID: ${testUser.id}\n`);

    // Cleanup: delete test user
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('  ✓ Test user cleaned up\n');

    console.log('=== ALL TESTS PASSED ===\n');
    console.log('Database is ready! You can now:');
    console.log('  1. Run: npm run dev (start backend)');
    console.log('  2. Test registration from frontend');
    console.log('  3. Or run: npx prisma studio (view database)\n');

  } catch (error) {
    console.error('❌ Database connection failed!\n');
    console.error('Error:', error.message);
    console.error('\nPlease check:');
    console.error('  1. Docker database is running: docker-compose ps');
    console.error('  2. DATABASE_URL in .env is correct');
    console.error('  3. Prisma client is generated: npx prisma generate\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
