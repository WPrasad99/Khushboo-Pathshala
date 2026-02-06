// Test Gemini 2.5 Flash
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModel() {
    console.log('\n🧪 Testing Gemini 2.5 Flash...\n');

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent("What is 2+2? Answer in 5 words or less.");
        const response = await result.response;
        const text = response.text();

        console.log('✅ ✅ ✅ SUCCESS! ✅ ✅ ✅\n');
        console.log('Response:', text);
        console.log('\n🎉 CHATBOT IS WORKING!\n');
        console.log('👉 Now test it in your browser at http://localhost:5173\n');

    } catch (error) {
        console.error('❌ Error:', error.message.substring(0, 200));
        if (error.status === 429) {
            console.log('\n⚠️  API Quota exceeded. You need to wait or use a different API key.\n');
        }
    }
}

testModel();
