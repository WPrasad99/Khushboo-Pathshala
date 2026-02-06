// List available models using https
require('dotenv').config();
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;

function listModels() {
    console.log('Fetching available models...\n');

    const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

    https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            const json = JSON.parse(data);

            if (json.models) {
                console.log('✅ AVAILABLE MODELS FOR GENERATECONTENT:\n');
                json.models.forEach(model => {
                    if (model.supportedGenerationMethods?.includes('generateContent')) {
                        const modelName = model.name.replace('models/', '');
                        console.log(`  📦 ${modelName}`);
                    }
                });
                console.log('\n🎯 Use one of these models in your code!');
            } else {
                console.log('❌ Error:', json);
            }
        });
    }).on('error', (error) => {
        console.error('❌ Error:', error.message);
    });
}

listModels();
