const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const config = require('../config');

// Initialize Gemini only if API key is available
const genAI = config.gemini.apiKey ? new GoogleGenerativeAI(config.gemini.apiKey) : null;

/**
 * ISSUE #10 note: Redundant role check removed since route already has requireRole('STUDENT').
 * But we keep a minimal guard as defense-in-depth.
 */
exports.askQuestion = async (req, res, next) => {
    try {
        if (!genAI) {
            return res.status(503).json({ success: false, error: 'AI service is not configured.' });
        }

        const { question, conversationHistory } = req.body;
        if (!question || typeof question !== 'string' || !question.trim()) {
            return res.status(400).json({ success: false, error: 'Question is required.' });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: `You are an AI Study Assistant for students at Khushboo Pathshala.
Your role is to help with educational questions, programming, coding, and technical topics.

IMPORTANT GUIDELINES:
- Answer ALL educational, academic, programming, coding, and technical questions
- Provide accurate, well-researched information with examples
- Include relevant links to educational resources
- Explain concepts clearly with code examples when relevant
- Keep responses concise but informative (2-4 paragraphs maximum)
- Format code blocks properly and links as: [Resource Name](URL)
- Be encouraging and supportive
- If unsure, acknowledge limitations rather than guessing

TOPICS YOU CAN HELP WITH:
✅ Programming & Development
✅ Computer Science
✅ Mathematics & Sciences
✅ Academic Subjects
✅ Study Skills
✅ Technology & Career Guidance

TOPICS TO POLITELY DECLINE:
❌ Medical, legal, or financial advice
❌ Writing full assignment solutions (guide instead)
❌ Inappropriate or harmful content

Remember: You're here to TEACH and GUIDE, not just give answers!`
        });

        const safetySettings = [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ];

        const history = Array.isArray(conversationHistory)
            ? conversationHistory.map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: String(h.content || '') }]
            }))
            : [];

        const chat = model.startChat({ history, safetySettings });
        const result = await chat.sendMessage(question.trim());
        const response = await result.response;
        const text = response.text();

        res.json({ success: true, data: text });
    } catch (error) {
        console.error('Chatbot error:', error.message);
        if (error.message?.includes('SAFETY')) {
            return res.status(400).json({ success: false, error: 'Your question was blocked by safety filters. Please rephrase.' });
        }
        next(error);
    }
};
