const prisma = require('../config/prisma');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

exports.getHistory = async (req, res, next) => {
    try {
        const roadmaps = await prisma.roadmap.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, data: roadmaps });
    } catch (error) {
        next(error);
    }
};

exports.generateRoadmap = async (req, res, next) => {
    try {
        const { topic, days } = req.body;

        if (!topic || !days || isNaN(days) || days < 1 || days > 100) {
            return res.status(400).json({ success: false, error: 'Valid topic and days (1-100) are required.' });
        }

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                // Enforce JSON format output from Gemini
                responseMimeType: "application/json",
            }
        });

        const prompt = `You are an expert learning mentor. Generate a detailed, day-by-day learning roadmap for the following subject: "${topic}".
The roadmap should span exactly ${days} days.

Your response MUST be valid JSON matching this exact structure:
{
  "title": "A catchy title for this roadmap",
  "description": "A brief 2-3 sentence overview of what the student will learn",
  "days": [
    {
      "day": 1,
      "title": "Day Title",
      "topics": ["sub-topic 1", "sub-topic 2"],
      "description": "Brief description of what to focus on this day"
    }
  ]
}

Return ONLY the raw JSON object. Do not include markdown blocks like \`\`\`json.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        let roadmapContent;
        try {
            // Trim potential leftover markdown if Gemini ignores instructions
            const cleanedText = responseText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
            roadmapContent = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error("Failed to parse Gemini JSON output:", responseText);
            return res.status(500).json({ success: false, error: 'AI failed to generate a valid roadmap. Please try again.' });
        }

        // Save to Database
        const newRoadmap = await prisma.roadmap.create({
            data: {
                userId: req.user.id,
                topic: topic,
                days: parseInt(days),
                content: roadmapContent
            }
        });

        res.json({ success: true, data: newRoadmap });
    } catch (error) {
        console.error("Gemini Roadmap Generation Error:", error);
        next(error);
    }
};

exports.deleteRoadmap = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Ensure user owns this roadmap
        const roadmap = await prisma.roadmap.findUnique({ where: { id } });
        if (!roadmap || roadmap.userId !== req.user.id) {
            return res.status(404).json({ success: false, error: 'Roadmap not found or unauthorized.' });
        }

        await prisma.roadmap.delete({ where: { id } });

        res.json({ success: true, message: 'Roadmap deleted successfully.' });
    } catch (error) {
        next(error);
    }
};
