import { useState, useRef, useEffect } from 'react';
import { chatbotAPI, getApiErrorMessage } from '../api';
import { FiMessageCircle, FiX, FiSend, FiTrash2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import './ChatBot.css';
import './ChatBotFormatting.css';

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'bot',
            content: 'Hi! I\'m your AI Learning Assistant. Ask me about coding, tech, education, or any topic! 💻📚',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSendMessage = async (e) => {
        e.preventDefault();

        // Input validation
        if (!input || !input.trim()) {
            console.warn('[ChatBot] Empty message prevented from sending');
            return;
        }

        if (isLoading) {
            console.warn('[ChatBot] Request blocked - already processing');
            return;
        }

        const userMessage = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        console.log('[ChatBot] Sending message:', userMessage.content);

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Prepare conversation history for context
            // Skip the initial bot greeting and only include actual conversation
            const conversationHistory = messages
                .slice(1) // Skip initial greeting message
                .filter(msg => msg.role === 'user' || msg.role === 'bot') // Only user/bot messages
                .map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    content: msg.content
                }));

            console.log('[ChatBot] Request payload:', {
                question: userMessage.content,
                historyLength: conversationHistory.length
            });

            // Make API request
            const response = await chatbotAPI.askQuestion(userMessage.content, conversationHistory);

            console.log('[ChatBot] API Response received:', {
                status: response.status,
                hasAnswer: !!response.data?.answer
            });

            // Validate response
            if (!response.data || !response.data.answer) {
                throw new Error('Invalid response format from server');
            }

            const botMessage = {
                role: 'bot',
                content: response.data.answer,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
            console.log('[ChatBot] Bot response added to messages');

        } catch (error) {
            // Detailed error logging
            console.error('==========================================');
            console.error('[ChatBot] ERROR DETAILS:');
            console.error('Error type:', error.name);
            console.error('Error message:', error.message);

            if (error.response) {
                console.error('Backend responded with error:');
                console.error('  Status:', error.response.status);
                console.error('  Status Text:', error.response.statusText);
                console.error('  Error data:', error.response.data);
                console.error('  Headers:', error.response.headers);
            } else if (error.request) {
                console.error('No response received from backend');
                console.error('Request:', error.request);
            } else {
                console.error('Error setting up request:', error.message);
            }
            console.error('Full error object:', error);
            console.error('==========================================');

            // User-friendly error message (handles both { error: string } and { error: { message } } formats)
            const errorText = getApiErrorMessage(error, 'Sorry, I encountered an error. Please try again.');

            const errorMessage = {
                role: 'bot',
                content: errorText,
                timestamp: new Date(),
                isError: true
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearChat = () => {
        setMessages([
            {
                role: 'bot',
                content: 'Chat cleared! What would you like to learn about? 📚',
                timestamp: new Date()
            }
        ]);
    };

    const formatMessageContent = (content) => {
        const elements = [];

        // Split by code blocks
        const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = codeBlockRegex.exec(content)) !== null) {
            if (match.index > lastIndex) {
                parts.push({ type: 'text', content: content.substring(lastIndex, match.index) });
            }
            parts.push({ type: 'code', language: match[1] || 'code', content: match[2].trim() });
            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < content.length) {
            parts.push({ type: 'text', content: content.substring(lastIndex) });
        }

        if (parts.length === 0) {
            parts.push({ type: 'text', content });
        }

        // Render parts
        parts.forEach((part, partIndex) => {
            if (part.type === 'code') {
                elements.push(
                    <div key={`code-${partIndex}`} className="code-block-wrapper">
                        <div className="code-block-header">
                            <span className="code-language">{part.language}</span>
                        </div>
                        <pre className="code-block"><code>{part.content}</code></pre>
                    </div>
                );
            } else {
                const lines = part.content.split('\n');
                lines.forEach((line, lineIndex) => {
                    if (!line.trim()) {
                        if (lineIndex > 0) elements.push(<br key={`br-${partIndex}-${lineIndex}`} />);
                        return;
                    }

                    const bulletMatch = line.match(/^[•\-\*]\s+(.+)/);
                    const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);

                    if (bulletMatch) {
                        elements.push(
                            <div key={`bullet-${partIndex}-${lineIndex}`} className="chat-bullet">
                                • {formatInline(bulletMatch[1])}
                            </div>
                        );
                    } else if (numberedMatch) {
                        elements.push(
                            <div key={`num-${partIndex}-${lineIndex}`} className="chat-numbered">
                                {numberedMatch[1]}. {formatInline(numberedMatch[2])}
                            </div>
                        );
                    } else {
                        elements.push(
                            <div key={`p-${partIndex}-${lineIndex}`} className="chat-paragraph">
                                {formatInline(line)}
                            </div>
                        );
                    }
                });
            }
        });

        return elements;
    };

    const formatInline = (text) => {
        const elements = [];
        let remaining = text;
        let key = 0;

        // Process links, inline code, bold
        const patterns = [
            { regex: /\[([^\]]+)\]\(([^)]+)\)/, type: 'link' },
            { regex: /`([^`]+)`/, type: 'code' },
            { regex: /\*\*([^*]+)\*\*/, type: 'bold' }
        ];

        while (remaining) {
            let earliestMatch = null;
            let earliestIndex = remaining.length;
            let earliestType = null;

            patterns.forEach(({ regex, type }) => {
                const match = remaining.match(regex);
                if (match && match.index < earliestIndex) {
                    earliestMatch = match;
                    earliestIndex = match.index;
                    earliestType = type;
                }
            });

            if (!earliestMatch) {
                elements.push(remaining);
                break;
            }

            if (earliestIndex > 0) {
                elements.push(remaining.substring(0, earliestIndex));
            }

            if (earliestType === 'link') {
                elements.push(
                    <a key={key++} href={earliestMatch[2]} target="_blank" rel="noopener noreferrer" className="chat-link">
                        {earliestMatch[1]}
                    </a>
                );
            } else if (earliestType === 'code') {
                elements.push(<code key={key++} className="inline-code">{earliestMatch[1]}</code>);
            } else if (earliestType === 'bold') {
                elements.push(<strong key={key++}>{earliestMatch[1]}</strong>);
            }

            remaining = remaining.substring(earliestIndex + earliestMatch[0].length);
        }

        return elements;
    };

    return (
        <>
            {/* Floating Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="chatbot-toggle-btn"
                        onClick={() => setIsOpen(true)}
                        title="Ask AI Assistant"
                    >
                        <FiMessageCircle size={24} />
                        <span className="chatbot-badge">AI</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 400 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 400 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="chatbot-panel"
                    >
                        {/* Header */}
                        <div className="chatbot-header">
                            <div className="chatbot-header-title">
                                <div className="chatbot-avatar">
                                    <FiMessageCircle size={20} />
                                </div>
                                <div>
                                    <h3>AI Learning Assistant</h3>
                                    <p>Powered by Gemini 2.5 Flash ⚡</p>
                                </div>
                            </div>
                            <div className="chatbot-header-actions">
                                <button onClick={handleClearChat} title="Clear chat" className="icon-btn-small">
                                    <FiTrash2 size={18} />
                                </button>
                                <button onClick={() => setIsOpen(false)} title="Close" className="icon-btn-small">
                                    <FiX size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="chatbot-messages">
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`chat-message ${msg.role === 'user' ? 'user-message' : 'bot-message'} ${msg.isError ? 'error-message' : ''}`}
                                >
                                    <div className="message-content">
                                        {formatMessageContent(msg.content)}
                                    </div>
                                    <div className="message-time">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="chat-message bot-message">
                                    <div className="message-content typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSendMessage} className="chatbot-input-form">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask a question..."
                                className="chatbot-input"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                className="chatbot-send-btn"
                                disabled={!input.trim() || isLoading}
                            >
                                <FiSend size={20} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ChatBot;
