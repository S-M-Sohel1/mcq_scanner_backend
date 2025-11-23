require('dotenv').config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY not found in .env file');
    return;
  }

  console.log('API Key loaded:', apiKey.substring(0, 10) + '...');
  console.log('\nFetching available models...\n');

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('Available models that support generateContent:\n');
    console.log('='.repeat(80));
    
    for (const model of data.models) {
      if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent')) {
        console.log(`\n✅ Model: ${model.name}`);
        console.log(`   Display Name: ${model.displayName}`);
        console.log(`   Description: ${model.description}`);
        console.log(`   Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
        console.log('-'.repeat(80));
      }
    }
    
  } catch (error) {
    console.error('Error listing models:', error.message);
    console.error('Full error:', error);
  }
}

listModels();
