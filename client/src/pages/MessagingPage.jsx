import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiSearch, FiMoreVertical, FiUsers, FiMessageCircle, FiCheck, FiCheckCircle, FiPlus, FiDownload, FiFile, FiImage } from 'react-icons/fi';
import { chatAPI } from '../api';
import { socket } from '../api/socket';
import { useAuth } from '../context/AuthContext';
import CreateGroupModal from '../components/messaging/CreateGroupModal';
import FileUpload from '../components/messaging/FileUpload';
import GroupInfoPanel from '../components/messaging/GroupInfoPanel';
import UserInfoPanel from '../components/messaging/UserInfoPanel';
import './MessagingPage.css';

const MessagingPage = () => {
    const { user: currentUser } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [showUserInfo, setShowUserInfo] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [usersTyping, setUsersTyping] = useState([]);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const currentUserId = currentUser?.id;
    const currentUserName = currentUser?.name;

    // Fetch conversations and contacts
    useEffect(() => {
        fetchData();

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
        if (selectedConversation && !selectedConversation.isPlaceholder) {
            fetchMessages(selectedConversation.id);
        } else {
            setMessages([]);
        }
    }, [selectedConversation]);

    // Auto-scroll to bottom
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [groupsRes, contactsRes] = await Promise.all([
                chatAPI.getGroups().catch(err => ({ data: [] })),
                chatAPI.getContacts().catch(err => ({ data: [] }))
            ]);
            setConversations(Array.isArray(groupsRes?.data) ? groupsRes.data : []);
            setContacts(Array.isArray(contactsRes?.data) ? contactsRes.data : []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            setConversations([]);
            setContacts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchConversations = async () => {
        try {
            const response = await chatAPI.getGroups();
            if (Array.isArray(response?.data)) {
                setConversations(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
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
        fetchConversations();
    };

    const handleGroupCreated = (data) => {
        fetchConversations();
    };



    // ... (logic)

    const handleConversationClick = async (conv) => {
        // GROUPS ONLY: No placeholder or DM logic needed
        setShowGroupInfo(false);
        setShowUserInfo(false);
        setSelectedConversation(conv);
        fetchMessages(conv.id);
    };

    // ... sendMessage ... (keep existing)

    const sendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && selectedFiles.length === 0) || !selectedConversation) return;

        try {
            setUploading(true);
            let attachments = null;

            // ... upload logic ... (keep existing)
            if (selectedFiles.length > 0) {
                const formData = new FormData();
                selectedFiles.forEach(file => {
                    formData.append('files', file);
                });
                const uploadResponse = await chatAPI.uploadFiles(formData);
                attachments = uploadResponse.data.files;
            }

            const response = await chatAPI.sendMessage(
                selectedConversation.id,
                newMessage.trim(),
                attachments
            );

            setMessages(prev => [...prev, response.data]);
            setNewMessage('');
            setSelectedFiles([]);

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

    // ... helpers ...

    const getOtherUser = (conversation) => {
        if (!conversation?.members || !Array.isArray(conversation.members)) return null;

        if (conversation.isPlaceholder) {
            return conversation.members[0]?.user;
        }
        if (conversation.groupType === 'direct') {
            // Use loose comparison for ID mismatch safety
            const other = conversation.members.find(m => m.userId != currentUserId);
            return other?.user;
        }
        return null;
    };

    // Merge conversations and contacts
    const getDisplayList = () => {
        if (!Array.isArray(conversations)) return [];

        // GROUPS ONLY: Filter out all direct messages
        const validConversations = conversations.filter(c => c.groupType !== 'direct');



        const displayList = [...validConversations];

        // GROUPS ONLY: No contact processing needed

        // Filter by search
        // Search only within group names
        if (searchQuery) {
            return displayList.filter(c =>
                c.name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return displayList;
    };

    const handleLeaveGroup = (groupId) => {
        setConversations(prev => prev.filter(c => c.id !== groupId));
        setSelectedConversation(null);
        setShowGroupInfo(false);
    };

    const filteredConversations = getDisplayList();

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
                <div className="sidebar-header">
                    <h2>Messages</h2>
                    <button
                        className="create-group-btn"
                        onClick={() => setShowCreateModal(true)}
                        title="Create New Group"
                    >
                        <FiPlus /> Create Group
                    </button>
                </div>

                <div className="search-box">
                    <FiSearch />
                    <input
                        type="text"
                        placeholder="Search groups..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="conversations-list">
                    <AnimatePresence>
                        {filteredConversations.map(conv => {
                            const lastMessage = conv.messages?.[0];

                            return (
                                <motion.div
                                    key={conv.id}
                                    className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                                    onClick={() => handleConversationClick(conv)}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <div className="conversation-avatar">
                                        <div className="avatar group-avatar">
                                            <FiUsers />
                                        </div>
                                    </div>

                                    <div className="conversation-info">
                                        <div className="conversation-top">
                                            <h4>{conv.name}</h4>
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
                                    <div className="avatar group-avatar">
                                        <FiUsers />
                                    </div>
                                </div>
                                <div>
                                    <h3>{selectedConversation.name}</h3>
                                    <p className="members-count">
                                        {selectedConversation.members.length} members
                                    </p>
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

                                                {/* Render file attachments WhatsApp Style */}
                                                {msg.attachments && msg.attachments.length > 0 && (
                                                    <div className="message-attachments">
                                                        {msg.attachments.map((file, idx) => (
                                                            <div key={idx} className="attachment-card">
                                                                {file.type === 'image' || (file.url && file.url.match(/\.(jpeg|jpg|gif|png)$/) != null) ? (
                                                                    <div
                                                                        className="attachment-image-container"
                                                                        onClick={() => window.open(`http://localhost:5000${file.url}`, '_blank')}
                                                                    >
                                                                        <img
                                                                            src={`http://localhost:5000${file.url}`}
                                                                            alt={file.name}
                                                                            className="attachment-image-preview"
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <a
                                                                        href={`http://localhost:5000${file.url}`}
                                                                        download={file.name}
                                                                        className="attachment-file-card"
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                    >
                                                                        <div className="file-icon-wrapper">
                                                                            <FiFile className="file-icon" />
                                                                        </div>
                                                                        <div className="file-info">
                                                                            <span className="file-name">{file.name}</span>
                                                                            <span className="file-type">{file.name ? file.name.split('.').pop().toUpperCase() : 'FILE'}</span>
                                                                        </div>
                                                                        <FiDownload className="download-icon" />
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
            {/* Right Side Panels */}
            <AnimatePresence>
                {showGroupInfo && selectedConversation && (
                    <GroupInfoPanel
                        group={selectedConversation}
                        onClose={() => setShowGroupInfo(false)}
                        currentUserId={currentUserId}
                        currentUser={currentUser}
                        onLeave={handleLeaveGroup}
                    />
                )}
                {showUserInfo && selectedConversation && selectedConversation.groupType === 'direct' && (
                    <UserInfoPanel
                        user={getOtherUser(selectedConversation)}
                        onClose={() => setShowUserInfo(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default MessagingPage;
