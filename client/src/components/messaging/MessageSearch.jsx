import React, { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import './MessageSearch.css';

const MessageSearch = ({ groupId, onSelectMessage, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const response = await fetch(
                `http://localhost:5001/api/chat/groups/${groupId}/messages/search?q=${encodeURIComponent(query)}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const highlightText = (text, query) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <mark key={i}>{part}</mark>
            ) : (
                part
            )
        );
    };

    return (
        <div className="message-search-panel">
            <div className="search-header">
                <h3>Search Messages</h3>
                <button onClick={onClose} className="close-search-btn">
                    <FiX />
                </button>
            </div>

            <form onSubmit={handleSearch} className="search-input-form">
                <FiSearch />
                <input
                    type="text"
                    placeholder="Search in conversation..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                />
            </form>

            <div className="search-results">
                {loading ? (
                    <p className="search-status">Searching...</p>
                ) : results.length > 0 ? (
                    <>
                        <p className="search-status">{results.length} result{results.length !== 1 ? 's' : ''}</p>
                        {results.map((msg) => (
                            <div
                                key={msg.id}
                                className="search-result-item"
                                onClick={() => onSelectMessage(msg)}
                            >
                                <div className="result-sender">{msg.sender.name}</div>
                                <div className="result-content">
                                    {highlightText(msg.content, query)}
                                </div>
                                <div className="result-time">
                                    {new Date(msg.createdAt).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </>
                ) : query && !loading ? (
                    <p className="search-status">No messages found</p>
                ) : null}
            </div>
        </div>
    );
};

export default MessageSearch;
