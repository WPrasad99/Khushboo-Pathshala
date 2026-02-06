const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = 'AIzaSyCfZcYX7a5GueoFecQvsU0BVm3VrPRcm04';
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const models = await genAI.listModels();
        console.log('\n=== Available Gemini Models ===\n');

        for await (const model of models) {
            console.log(`Model: ${model.name}`);
            console.log(`  Display Name: ${model.displayName}`);
            console.log(`  Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
            console.log('---');
        }
    } catch (error) {
        console.error('Error listing models:', error.message);
    }
}

listModels();
