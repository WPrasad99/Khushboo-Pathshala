import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiSearch, FiMoreVertical, FiUsers, FiMessageCircle, FiCheck, FiCheckCircle, FiPlus, FiDownload, FiFile, FiImage } from 'react-icons/fi';
import { chatAPI } from '../api';
import { socket } from '../api/socket';
import CreateGroupModal from '../components/messaging/CreateGroupModal';
import FileUpload from '../components/messaging/FileUpload';
import GroupInfoPanel from '../components/messaging/GroupInfoPanel';
import './MessagingPage.css';

const MessagingPage = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [usersTyping, setUsersTyping] = useState([]);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;
    const currentUserName = JSON.parse(localStorage.getItem('user'))?.name;

    // Fetch conversations
    useEffect(() => {
        fetchConversations();

        // Socket listeners
        socket.on('message:new', handleNewMessage);
        socket.on('group:created', handleGroupCreated);

        return () => {
            socket.off('message:new', handleNewMessage);
            socket.off('group:created', handleGroupCreated);
        };
    }, []);

    // Fetch messages when conversation changes
    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.id);
        }
    }, [selectedConversation]);

    // Auto-scroll to bottom
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const response = await chatAPI.getGroups();
            setConversations(response.data);
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (groupId) => {
        try {
            const response = await chatAPI.getMessages(groupId);
            setMessages(response.data);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const handleNewMessage = (data) => {
        if (selectedConversation && data.groupId === selectedConversation.id) {
            setMessages(prev => [...prev, data]);
        }

        // Update conversation list
        fetchConversations();
    };

    const handleGroupCreated = (data) => {
        fetchConversations();
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && selectedFiles.length === 0) || !selectedConversation) return;

        try {
            setUploading(true);
            let attachments = null;

            // Upload files if any selected
            if (selectedFiles.length > 0) {
                const formData = new FormData();
                selectedFiles.forEach(file => {
                    formData.append('files', file);
                });

                const uploadResponse = await chatAPI.uploadFiles(formData);
                attachments = uploadResponse.data.files;
            }

            // Send message with attachments
            const response = await chatAPI.sendMessage(
                selectedConversation.id,
                newMessage.trim(),
                attachments
            );

            setMessages(prev => [...prev, response.data]);
            setNewMessage('');
            setSelectedFiles([]);

            // Emit via socket for real-time delivery
            socket.emit('message:send', {
                groupId: selectedConversation.id,
                message: response.data
            });
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString();
    };

    const getOtherUser = (conversation) => {
        if (conversation.groupType === 'direct') {
            return conversation.members.find(m => m.userId !== currentUserId)?.user;
        }
        return null;
    };

    const filteredConversations = conversations.filter(conv =>
        conv.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="messaging-page">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="messaging-page">
            {/* Left Sidebar - Conversations */}
            <div className="conversations-sidebar">
                <div className="search-box">
                    <FiSearch />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="conversations-list">
                    <AnimatePresence>
                        {filteredConversations.map(conv => {
                            const otherUser = getOtherUser(conv);
                            const lastMessage = conv.messages?.[0];

                            return (
                                <motion.div
                                    key={conv.id}
                                    className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                                    onClick={() => setSelectedConversation(conv)}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <div className="conversation-avatar">
                                        {conv.groupType === 'direct' ? (
                                            <div className="avatar">
                                                {otherUser?.avatar ? (
                                                    <img src={otherUser.avatar} alt={otherUser.name} />
                                                ) : (
                                                    otherUser?.name?.charAt(0)?.toUpperCase()
                                                )}
                                            </div>
                                        ) : (
                                            <div className="avatar group-avatar">
                                                <FiUsers />
                                            </div>
                                        )}
                                    </div>

                                    <div className="conversation-info">
                                        <div className="conversation-top">
                                            <h4>{conv.groupType === 'direct' ? otherUser?.name : conv.name}</h4>
                                            {lastMessage && (
                                                <span className="conversation-time">
                                                    {formatTime(lastMessage.createdAt)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="conversation-bottom">
                                            <p className="last-message">
                                                {lastMessage?.content || 'No messages yet'}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* Center - Messages View */}
            <div className="messages-view">
                {selectedConversation ? (
                    <>
                        <div className="messages-header">
                            <div
                                className="header-info"
                                onClick={() => setShowGroupInfo(true)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="conversation-avatar">
                                    {selectedConversation.groupType === 'direct' ? (
                                        <div className="avatar">
                                            {getOtherUser(selectedConversation)?.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                    ) : (
                                        <div className="avatar group-avatar">
                                            <FiUsers />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3>
                                        {selectedConversation.groupType === 'direct'
                                            ? getOtherUser(selectedConversation)?.name
                                            : selectedConversation.name}
                                    </h3>
                                    {selectedConversation.groupType !== 'direct' && (
                                        <p className="members-count">
                                            {selectedConversation.members.length} members
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button className="more-btn" onClick={() => setShowGroupInfo(true)}>
                                <FiMoreVertical />
                            </button>
                        </div>

                        <div className="messages-container">
                            {messages.map((msg, index) => {
                                const isOwn = msg.senderId === currentUserId;

                                return (
                                    <React.Fragment key={msg.id}>
                                        <motion.div
                                            className={`message ${isOwn ? 'own' : 'other'}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            {!isOwn && selectedConversation.groupType !== 'direct' && (
                                                <span className="message-sender">{msg.sender.name}</span>
                                            )}
                                            <div className="message-bubble">
                                                {msg.content && <p>{msg.content}</p>}

                                                {/* Render file attachments */}
                                                {msg.attachments && msg.attachments.length > 0 && (
                                                    <div className="message-attachments">
                                                        {msg.attachments.map((file, idx) => (
                                                            <div key={idx} className="attachment-wrapper">
                                                                {file.type === 'image' ? (
                                                                    <img
                                                                        src={`http://localhost:5000${file.url}`}
                                                                        alt={file.name}
                                                                        className="attachment-image"
                                                                        onClick={() => window.open(`http://localhost:5000${file.url}`, '_blank')}
                                                                    />
                                                                ) : (
                                                                    <a
                                                                        href={`http://localhost:5000${file.url}`}
                                                                        download={file.name}
                                                                        className="attachment-document"
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                    >
                                                                        <FiFile />
                                                                        <span>{file.name}</span>
                                                                        <FiDownload />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="message-meta">
                                                    <span className="message-time">{formatTime(msg.createdAt)}</span>
                                                    {isOwn && <FiCheck className="message-status" />}
                                                </div>
                                            </div>
                                        </motion.div>
                                    </React.Fragment>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form className="message-input-container" onSubmit={sendMessage}>
                            <FileUpload
                                onFilesSelected={setSelectedFiles}
                                disabled={uploading}
                            />
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                disabled={uploading}
                            />
                            <button
                                type="submit"
                                disabled={uploading || (!newMessage.trim() && selectedFiles.length === 0)}
                            >
                                <FiSend />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="no-conversation-selected">
                        <FiMessageCircle />
                        <h3>Select a conversation</h3>
                        <p>Choose from your existing conversations or start a new one</p>
                    </div>
                )}
            </div>

            {/* Create Group Modal */}
            {showCreateModal && (
                <CreateGroupModal
                    onClose={() => setShowCreateModal(false)}
                    onGroupCreated={(group) => {
                        fetchConversations();
                        setShowCreateModal(false);
                    }}
                />
            )}

            {/* Group Info Panel */}
            <AnimatePresence>
                {showGroupInfo && selectedConversation && (
                    <GroupInfoPanel
                        group={selectedConversation}
                        onClose={() => setShowGroupInfo(false)}
                        currentUserId={currentUserId}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default MessagingPage;
