const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");
const config = require("../config");

// ===============================
// Configuration Constants
// ===============================
const MAX_QUESTION_LENGTH = 2000;
const MAX_HISTORY_ENTRIES = 10;
const MAX_HISTORY_MESSAGE_LENGTH = 1000;
const REQUEST_TIMEOUT_MS = 15000;

// ===============================
// Initialize Gemini
// ===============================
const genAI = config?.gemini?.apiKey
    ? new GoogleGenerativeAI(config.gemini.apiKey)
    : null;

// ===============================
// Utility: Standard API Response
// ===============================
const sendSuccess = (res, message) => {
    return res.status(200).json({
        success: true,
        data: {
            message, // ✅ FIXED STRUCTURE
        },
        error: null,
    });
};

const sendError = (res, statusCode, code, message) => {
    return res.status(statusCode).json({
        success: false,
        data: null,
        error: {
            code,
            message,
        },
    });
};

// ===============================
// Utility: Timeout Wrapper
// ===============================
const withTimeout = (promise, timeoutMs) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("REQUEST_TIMEOUT")), timeoutMs)
        ),
    ]);
};

// ===============================
// Validate Conversation History
// ===============================
const sanitizeHistory = (history) => {
    if (!Array.isArray(history)) return [];

    return history
        .slice(-MAX_HISTORY_ENTRIES)
        .map((item) => {
            const role =
                item?.role === "user"
                    ? "user"
                    : item?.role === "assistant"
                        ? "model"
                        : null;

            if (!role) return null;

            const content = String(item?.content || "")
                .trim()
                .slice(0, MAX_HISTORY_MESSAGE_LENGTH);

            if (!content) return null;

            return {
                role,
                parts: [{ text: content }],
            };
        })
        .filter(Boolean);
};

// ===============================
// Controller
// ===============================
exports.askQuestion = async (req, res) => {
    try {
        // ---------------------------------
        // Role Check
        // ---------------------------------
        if (!req.user || req.user.role !== "STUDENT") {
            return sendError(res, 403, "FORBIDDEN", "Access denied.");
        }

        // ---------------------------------
        // AI Config Check
        // ---------------------------------
        if (!genAI) {
            return sendError(
                res,
                503,
                "AI_NOT_CONFIGURED",
                "AI service is not configured."
            );
        }

        const { question, conversationHistory } = req.body;

        // ---------------------------------
        // Validate Question
        // ---------------------------------
        if (!question || typeof question !== "string" || !question.trim()) {
            return sendError(
                res,
                400,
                "VALIDATION_ERROR",
                "Question is required."
            );
        }

        const trimmedQuestion = question.trim();

        if (trimmedQuestion.length > MAX_QUESTION_LENGTH) {
            return sendError(
                res,
                400,
                "QUESTION_TOO_LONG",
                `Question must not exceed ${MAX_QUESTION_LENGTH} characters.`
            );
        }

        // ---------------------------------
        // Sanitize History
        // ---------------------------------
        const history = sanitizeHistory(conversationHistory);

        // ---------------------------------
        // Initialize Model
        // ---------------------------------
        const model = genAI.getGenerativeModel({
            model: config?.gemini?.model || "gemini-2.5-flash",
            systemInstruction: `
You are an AI Study Assistant for students at Khushboo Pathshala.

- Answer educational and programming questions
- Keep responses concise (2–4 paragraphs)
- Format code blocks properly
- Be supportive and encouraging
- If unsure, acknowledge limitations
      `,
        });

        const safetySettings = [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
        ];

        // ---------------------------------
        // Start Chat
        // ---------------------------------
        const chat = model.startChat({
            history,
            safetySettings,
        });

        const aiResult = await withTimeout(
            chat.sendMessage(trimmedQuestion),
            REQUEST_TIMEOUT_MS
        );

        const response = await aiResult.response;

        if (!response || typeof response.text !== "function") {
            return sendError(
                res,
                500,
                "AI_RESPONSE_ERROR",
                "Invalid response from AI service."
            );
        }

        const text = response.text();

        if (!text || !text.trim()) {
            return sendError(
                res,
                500,
                "EMPTY_AI_RESPONSE",
                "AI returned an empty response."
            );
        }

        // ✅ FINAL STRUCTURED RESPONSE (FRONTEND SAFE)
        return sendSuccess(res, text.trim());

    } catch (error) {
        console.error("Chatbot Error:", {
            message: error.message,
            userId: req.user?.id,
        });

        if (error.message === "REQUEST_TIMEOUT") {
            return sendError(
                res,
                504,
                "AI_TIMEOUT",
                "AI service took too long to respond."
            );
        }

        return sendError(
            res,
            500,
            "INTERNAL_SERVER_ERROR",
            "Something went wrong. Please try again later."
        );
    }
};