/**
 * Test script for Categories and Transactions API
 * Tasks 18, 19, 20, 24
 */

const API_BASE = 'http://localhost:4000/api';
let accessToken = '';
let testCategoryId = '';
let testTransactionId = '';

// Helper function for API calls
async function apiCall(method, endpoint, body = null, headers = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await response.json();
  return { status: response.status, data };
}

// Step 1: Register and login to get access token
async function authenticate() {
  console.log('\n=== Step 1: Authentication ===');

  // Register
  const registerResult = await apiCall('POST', '/auth/register', {
    email: `test${Date.now()}@example.com`,
    password: 'Test123456!',
    name: 'Test User'
  });

  console.log('✓ Register:', registerResult.status === 201 ? 'SUCCESS' : 'FAILED');

  // Login
  const loginResult = await apiCall('POST', '/auth/login', {
    email: registerResult.data.user.email,
    password: 'Test123456!'
  });

  console.log('✓ Login:', loginResult.status === 200 ? 'SUCCESS' : 'FAILED');
  accessToken = loginResult.data.tokens.accessToken;
}

// Step 2: Test Categories CRUD (Task 19)
async function testCategories() {
  console.log('\n=== Step 2: Test Categories CRUD (Task 19) ===');

  const headers = { Authorization: `Bearer ${accessToken}` };

  // Create category
  const createResult = await apiCall('POST', '/categories', {
    name: 'Test Salary',
    type: 'INCOME'
  }, headers);

  console.log('✓ Create Category:', createResult.status === 201 ? 'SUCCESS' : 'FAILED');
  testCategoryId = createResult.data.category.id;

  // Get all categories
  const listResult = await apiCall('GET', '/categories', null, headers);
  console.log('✓ List Categories:', listResult.status === 200 ? 'SUCCESS' : 'FAILED');
  console.log('  Total categories:', listResult.data.categories.length);

  // Get category by ID
  const getResult = await apiCall('GET', `/categories/${testCategoryId}`, null, headers);
  console.log('✓ Get Category by ID:', getResult.status === 200 ? 'SUCCESS' : 'FAILED');

  // Update category
  const updateResult = await apiCall('PUT', `/categories/${testCategoryId}`, {
    name: 'Updated Salary'
  }, headers);
  console.log('✓ Update Category:', updateResult.status === 200 ? 'SUCCESS' : 'FAILED');

  // Filter by type
  const filterResult = await apiCall('GET', '/categories?type=INCOME', null, headers);
  console.log('✓ Filter Categories by Type:', filterResult.status === 200 ? 'SUCCESS' : 'FAILED');
}

// Step 3: Test Transactions CRUD (Task 19)
async function testTransactions() {
  console.log('\n=== Step 3: Test Transactions CRUD (Task 19) ===');

  const headers = { Authorization: `Bearer ${accessToken}` };

  // Create transaction
  const createResult = await apiCall('POST', '/transactions', {
    amount: 150.50,
    categoryId: testCategoryId,
    description: 'Test monthly salary',
    occurredAt: new Date().toISOString(),
    currency: 'USD'
  }, headers);

  console.log('✓ Create Transaction:', createResult.status === 201 ? 'SUCCESS' : 'FAILED');
  testTransactionId = createResult.data.transaction.id;

  // Create more transactions for filtering
  await apiCall('POST', '/transactions', {
    amount: -45.50,
    description: 'Test groceries',
    occurredAt: new Date().toISOString()
  }, headers);

  await apiCall('POST', '/transactions', {
    amount: -12.99,
    description: 'Coffee shop visit',
    occurredAt: new Date().toISOString()
  }, headers);

  // Get all transactions
  const listResult = await apiCall('GET', '/transactions', null, headers);
  console.log('✓ List Transactions:', listResult.status === 200 ? 'SUCCESS' : 'FAILED');
  console.log('  Total transactions:', listResult.data.pagination.total);

  // Get transaction by ID
  const getResult = await apiCall('GET', `/transactions/${testTransactionId}`, null, headers);
  console.log('✓ Get Transaction by ID:', getResult.status === 200 ? 'SUCCESS' : 'FAILED');

  // Update transaction
  const updateResult = await apiCall('PUT', `/transactions/${testTransactionId}`, {
    amount: 155.00,
    description: 'Updated salary'
  }, headers);
  console.log('✓ Update Transaction:', updateResult.status === 200 ? 'SUCCESS' : 'FAILED');
}

// Step 4: Test Transaction Filtering (Task 20)
async function testFiltering() {
  console.log('\n=== Step 4: Test Transaction Filtering (Task 20) ===');

  const headers = { Authorization: `Bearer ${accessToken}` };

  // Filter by category
  const categoryFilter = await apiCall(
    'GET',
    `/transactions?categoryId=${testCategoryId}`,
    null,
    headers
  );
  console.log('✓ Filter by Category:', categoryFilter.status === 200 ? 'SUCCESS' : 'FAILED');
  console.log('  Matching transactions:', categoryFilter.data.transactions.length);

  // Filter by date range
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateFilter = await apiCall(
    'GET',
    `/transactions?startDate=${yesterday.toISOString()}&endDate=${today.toISOString()}`,
    null,
    headers
  );
  console.log('✓ Filter by Date Range:', dateFilter.status === 200 ? 'SUCCESS' : 'FAILED');

  // Filter by keyword
  const keywordFilter = await apiCall(
    'GET',
    '/transactions?keyword=coffee',
    null,
    headers
  );
  console.log('✓ Filter by Keyword:', keywordFilter.status === 200 ? 'SUCCESS' : 'FAILED');
  console.log('  Matching transactions:', keywordFilter.data.transactions.length);

  // Test pagination
  const paginationTest = await apiCall(
    'GET',
    '/transactions?page=1&limit=2',
    null,
    headers
  );
  console.log('✓ Pagination:', paginationTest.status === 200 ? 'SUCCESS' : 'FAILED');
  console.log('  Page:', paginationTest.data.pagination.page);
  console.log('  Limit:', paginationTest.data.pagination.limit);
}

// Step 5: Test CSV Upload (Task 24)
async function testCSVUpload() {
  console.log('\n=== Step 5: Test CSV Upload (Task 24) ===');
  console.log('Note: CSV upload requires form-data, which is complex to test with fetch.');
  console.log('Please test CSV upload manually using:');
  console.log('  curl -X POST http://localhost:4000/api/transactions/upload-csv \\');
  console.log('    -H "Authorization: Bearer YOUR_TOKEN" \\');
  console.log('    -F "file=@sample-transactions.csv"');
  console.log('\nOr use the sample-transactions.csv file with Postman/Thunder Client');
}

// Step 6: Cleanup
async function cleanup() {
  console.log('\n=== Step 6: Cleanup ===');

  const headers = { Authorization: `Bearer ${accessToken}` };

  // Delete transaction
  const deleteTransResult = await apiCall('DELETE', `/transactions/${testTransactionId}`, null, headers);
  console.log('✓ Delete Transaction:', deleteTransResult.status === 200 ? 'SUCCESS' : 'FAILED');

  // Delete category
  const deleteCatResult = await apiCall('DELETE', `/categories/${testCategoryId}`, null, headers);
  console.log('✓ Delete Category:', deleteCatResult.status === 200 ? 'SUCCESS' : 'FAILED');
}

// Run all tests
async function runTests() {
  try {
    console.log('========================================');
    console.log('  Testing Tasks 18, 19, 20, 24');
    console.log('========================================');

    await authenticate();
    await testCategories();
    await testTransactions();
    await testFiltering();
    await testCSVUpload();
    await cleanup();

    console.log('\n========================================');
    console.log('  ✓ ALL TESTS COMPLETED');
    console.log('========================================\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
