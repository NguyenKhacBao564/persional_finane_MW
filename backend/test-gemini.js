import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');

if (!apiKey) {
  console.error('GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// Try different model names
const modelsToTry = [
  'models/gemini-2.5-flash',
  'models/gemini-2.5-pro',
  'models/gemini-flash-latest',
  'models/gemini-pro-latest',
  'gemini-2.5-flash',
  'gemini-flash-latest',
];

async function testModel(modelName) {
  try {
    console.log(`\nTesting model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Say hello');
    const response = await result.response;
    const text = response.text();
    console.log(`✓ SUCCESS with ${modelName}`);
    console.log(`Response: ${text.substring(0, 50)}...`);
    return true;
  } catch (error) {
    console.log(`✗ FAILED with ${modelName}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n=== Testing Gemini API ===\n');
  
  for (const modelName of modelsToTry) {
    const success = await testModel(modelName);
    if (success) {
      console.log(`\n✓✓✓ Working model found: ${modelName} ✓✓✓`);
      console.log(`Update geminiClient.ts to use: '${modelName}'`);
      break;
    }
  }
  
  console.log('\n=== Test Complete ===\n');
}

main();
