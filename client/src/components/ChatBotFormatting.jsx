// Enhanced markdown formatting utilities for ChatBot
// Add this import at the top of ChatBot.jsx

export const formatMessageContent = (content) => {
    const elements = [];
    let key = 0;

    // Split content by code blocks first (```language\ncode```)
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
        // Add text before code block
        if (match.index > lastIndex) {
            parts.push({ type: 'text', content: content.substring(lastIndex, match.index) });
        }
        // Add code block
        parts.push({ type: 'code', language: match[1] || 'code', content: match[2].trim() });
        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
        parts.push({ type: 'text', content: content.substring(lastIndex) });
    }

    // If no parts, treat entire content as text
    if (parts.length === 0) {
        parts.push({ type: 'text', content });
    }

    // Process each part
    parts.forEach((part, partIndex) => {
        if (part.type === 'code') {
            // Render code block
            elements.push(
                <div key={`code-${partIndex}`} className="code-block-wrapper">
                    <div className="code-block-header">
                        <span className="code-language">{part.language}</span>
                    </div>
                    <pre className="code-block">
                        <code>{part.content}</code>
                    </pre>
                </div>
            );
        } else {
            // Process text content for inline formatting
            const lines = part.content.split('\n');

            lines.forEach((line, lineIndex) => {
                if (!line.trim()) {
                    // Empty line - add spacing
                    if (lineIndex > 0) {
                        elements.push(<br key={`br-${partIndex}-${lineIndex}`} />);
                    }
                    return;
                }

                // Check for different list types
                const bulletMatch = line.match(/^[•\-\*]\s+(.+)/);
                const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);

                if (bulletMatch) {
                    // Bullet point
                    elements.push(
                        <div key={`bullet-${partIndex}-${lineIndex}`} className="chat-bullet">
                            • {formatInlineContent(bulletMatch[1], key++)}
                        </div>
                    );
                } else if (numberedMatch) {
                    // Numbered list
                    elements.push(
                        <div key={`num-${partIndex}-${lineIndex}`} className="chat-numbered">
                            {numberedMatch[1]}. {formatInlineContent(numberedMatch[2], key++)}
                        </div>
                    );
                } else {
                    // Regular paragraph
                    elements.push(
                        <div key={`p-${partIndex}-${lineIndex}`} className="chat-paragraph">
                            {formatInlineContent(line, key++)}
                        </div>
                    );
                }
            });
        }
    });

    return elements.length > 0 ? elements : [content];
};

const formatInlineContent = (text, baseKey) => {
    const elements = [];
    const segments = [];

    // Find all special patterns
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const inlineCodeRegex = /`([^`]+)`/g;
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const italicRegex = /\*([^*]+)\*/g;

    let processedText = text;
    const replacements = [];

    // Find links
    let match;
    while ((match = linkRegex.exec(text)) !== null) {
        replacements.push({
            start: match.index,
            end: match.index + match[0].length,
            type: 'link',
            text: match[1],
            url: match[2]
        });
    }

    // Find inline code
    while ((match = inlineCodeRegex.exec(text)) !== null) {
        if (!isInsideReplacement(match.index, replacements)) {
            replacements.push({
                start: match.index,
                end: match.index + match[0].length,
                type: 'code',
                text: match[1]
            });
        }
    }

    // Find bold
    while ((match = boldRegex.exec(text)) !== null) {
        if (!isInsideReplacement(match.index, replacements)) {
            replacements.push({
                start: match.index,
                end: match.index + match[0].length,
                type: 'bold',
                text: match[1]
            });
        }
    }

    // Sort by position
    replacements.sort((a, b) => a.start - b.start);

    // Build elements
    let lastIndex = 0;
    replacements.forEach((item, idx) => {
        // Add text before replacement
        if (item.start > lastIndex) {
            elements.push(text.substring(lastIndex, item.start));
        }

        // Add formatted element
        if (item.type === 'link') {
            elements.push(
                <a
                    key={`link-${baseKey}-${idx}`}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chat-link"
                >
                    {item.text}
                </a>
            );
        } else if (item.type === 'code') {
            elements.push(<code key={`code-${baseKey}-${idx}`} className="inline-code">{item.text}</code>);
        } else if (item.type === 'bold') {
            elements.push(<strong key={`bold-${baseKey}-${idx}`}>{item.text}</strong>);
        }

        lastIndex = item.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
        elements.push(text.substring(lastIndex));
    }

    return elements.length > 0 ? elements : text;
};

const isInsideReplacement = (index, replacements) => {
    return replacements.some(r => index >= r.start && index < r.end);
};
