const fetch = require('node-fetch');

const apiKey = 'AIzaSyCfZcYX7a5GueoFecQvsU0BVm3VrPRcm04';

async function listAvailableModels() {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );

        const data = await response.json();

        console.log('\n=== AVAILABLE GEMINI MODELS ===\n');

        if (data.models) {
            data.models.forEach(model => {
                if (model.supportedGenerationMethods?.includes('generateContent')) {
                    console.log(`✅ ${model.name}`);
                    console.log(`   Display: ${model.displayName || 'N/A'}`);
                    console.log(`   Methods: ${model.supportedGenerationMethods.join(', ')}`);
                    console.log('---');
                }
            });
        } else {
            console.log('Error:', data);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

listAvailableModels();
