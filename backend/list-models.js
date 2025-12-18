import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

console.log('API Key:', apiKey ? `${apiKey.substring(0, 15)}...` : 'NOT FOUND');

if (!apiKey) {
  console.error('GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

async function listModels() {
  try {
    // Try v1beta endpoint
    console.log('\n=== Trying v1beta API ===');
    let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✓ v1beta API accessible');
      console.log('Available models:', data.models?.length || 0);
      if (data.models && data.models.length > 0) {
        console.log('\nModels:');
        data.models.forEach(model => {
          console.log(`  - ${model.name}`);
        });
      }
      return;
    }
    
    console.log(`✗ v1beta failed: ${response.status} ${response.statusText}`);
    const error = await response.text();
    console.log('Error:', error.substring(0, 200));
    
    // Try v1 endpoint
    console.log('\n=== Trying v1 API ===');
    response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✓ v1 API accessible');
      console.log('Available models:', data.models?.length || 0);
      if (data.models && data.models.length > 0) {
        console.log('\nModels:');
        data.models.forEach(model => {
          console.log(`  - ${model.name}`);
        });
      }
      return;
    }
    
    console.log(`✗ v1 failed: ${response.status} ${response.statusText}`);
    const error2 = await response.text();
    console.log('Error:', error2.substring(0, 200));
    
  } catch (error) {
    console.error('Error listing models:', error.message);
  }
}

listModels();
