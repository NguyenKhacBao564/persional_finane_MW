/**
 * Simple test for categories endpoint
 */

async function test() {
  // 1. Register and login
  const registerRes = await fetch('http://localhost:4000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `test${Date.now()}@example.com`,
      password: 'Test123456!',
      name: 'Test User'
    })
  });

  const registerData = await registerRes.json();
  console.log('Register status:', registerRes.status);
  console.log('Register data:', registerData);

  const loginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: registerData.user.email,
      password: 'Test123456!'
    })
  });

  const loginData = await loginRes.json();
  console.log('\nLogin status:', loginRes.status);
  console.log('Login data:', JSON.stringify(loginData, null, 2));
  console.log('Access token:', loginData.tokens?.accessToken ? 'Received' : 'Missing');

  // 2. Create category
  const createRes = await fetch('http://localhost:4000/api/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${loginData.tokens.accessToken}`
    },
    body: JSON.stringify({
      name: 'Test Category',
      type: 'INCOME'
    })
  });

  const createData = await createRes.json();
  console.log('\nCreate category status:', createRes.status);
  console.log('Create category data:', JSON.stringify(createData, null, 2));

  if (createRes.status === 201) {
    console.log('\n✓ SUCCESS: Category created!');
  } else {
    console.log('\n✗ FAILED: Could not create category');
  }
}

test().catch(console.error);
