import { syncToJsonFile } from './src/services/databaseSync.js';

async function main() {
  console.log('🔄 Starting initial database sync...');
  await syncToJsonFile();
  console.log('✅ Initial sync completed!');
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Sync failed:', error);
  process.exit(1);
});
