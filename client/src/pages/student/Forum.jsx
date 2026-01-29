import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { forumAPI } from '../../api';
import { FiArrowLeft, FiSearch, FiBell, FiUser, FiLogOut, FiMessageSquare, FiThumbsUp, FiSend } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import './Dashboard.css';

const Forum = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newQuestion, setNewQuestion] = useState('');
    const [expandedPost, setExpandedPost] = useState(null);
    const [newAnswer, setNewAnswer] = useState('');
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await forumAPI.getPosts();
            setPosts(response.data);
        } catch (error) {
            console.error('Failed to fetch forum posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostQuestion = async () => {
        if (!newQuestion.trim() || posting) return;

        setPosting(true);
        try {
            await forumAPI.createPost({
                title: newQuestion,
                content: newQuestion
            });
            setNewQuestion('');
            fetchPosts();
        } catch (error) {
            console.error('Failed to post question:', error);
        } finally {
            setPosting(false);
        }
    };

    const handlePostAnswer = async (postId) => {
        if (!newAnswer.trim() || posting) return;

        setPosting(true);
        try {
            await forumAPI.createAnswer(postId, newAnswer);
            setNewAnswer('');
            fetchPosts();
        } catch (error) {
            console.error('Failed to post answer:', error);
        } finally {
            setPosting(false);
        }
    };

    const handleUpvote = async (answerId) => {
        try {
            await forumAPI.upvoteAnswer(answerId);
            fetchPosts();
        } catch (error) {
            console.error('Failed to upvote:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours} hours ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return '1 day ago';
        return `${diffDays} days ago`;
    };

    return (
        <div className="dashboard-page">
            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-brand">
                    <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="40" height="40" rx="10" fill="url(#gradient)" />
                        <path d="M10 28V12L20 8L30 12V28L20 32L10 28Z" fill="white" opacity="0.9" />
                        <path d="M15 18L20 16L25 18V24L20 26L15 24V18Z" fill="#4A90E2" />
                        <defs>
                            <linearGradient id="gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#4A90E2" />
                                <stop offset="1" stopColor="#357ABD" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <div className="navbar-actions">
                    <div className="search-box">
                        <FiSearch />
                        <input type="text" placeholder="Search discussions..." />
                    </div>
                    <button className="icon-btn">
                        <FiBell />
                    </button>
                    <button className="icon-btn">
                        <FiUser />
                    </button>
                    <div className="user-menu">
                        <img src={user?.avatar} alt={user?.name} className="avatar" />
                        <button className="icon-btn" onClick={handleLogout}>
                            <FiLogOut />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="dashboard-content">
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/student')}>
                        <FiArrowLeft /> Back to Dashboard
                    </button>
                    <h1>Q&A Discussion Forum</h1>
                </div>

                <motion.div
                    className="glass-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* Ask Question */}
                    <div className="forum-header">
                        <input
                            type="text"
                            className="input"
                            placeholder="Ask a Question..."
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handlePostQuestion()}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handlePostQuestion}
                            disabled={posting || !newQuestion.trim()}
                        >
                            Post
                        </button>
                    </div>

                    {/* Posts List */}
                    <div className="forum-posts">
                        {loading ? (
                            <div style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                                <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                            </div>
                        ) : posts.length === 0 ? (
                            <div style={{ padding: 'var(--spacing-2xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <FiMessageSquare style={{ fontSize: '48px', marginBottom: 'var(--spacing-md)', opacity: 0.5 }} />
                                <p>No discussions yet. Be the first to ask a question!</p>
                            </div>
                        ) : (
                            posts.map((post) => (
                                <motion.div
                                    key={post.id}
                                    className="forum-post"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="post-header">
                                        <img src={post.author?.avatar} alt={post.author?.name} className="avatar avatar-sm" />
                                        <span style={{ fontWeight: '500' }}>{post.author?.name}</span>
                                        <span className="post-meta">
                                            <span>• {formatTimeAgo(post.createdAt)}</span>
                                        </span>
                                        <span className="answers-badge" style={{ marginLeft: 'auto' }}>
                                            {post.answersCount} Answers
                                        </span>
                                    </div>

                                    <h4
                                        className="post-title"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                                    >
                                        {post.title}
                                    </h4>

                                    <AnimatePresence>
                                        {expandedPost === post.id && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                            >
                                                <p className="post-content">{post.content}</p>

                                                {/* Answers */}
                                                <div className="post-answers">
                                                    {post.answers?.map((answer) => (
                                                        <div key={answer.id} className="answer-item">
                                                            <div className="answer-header">
                                                                <img src={answer.author?.avatar} alt={answer.author?.name} className="avatar avatar-sm" />
                                                                <span style={{ fontWeight: '500' }}>{answer.author?.name}</span>
                                                                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                                                                    • {formatTimeAgo(answer.createdAt)}
                                                                </span>
                                                            </div>
                                                            <p className="answer-content">{answer.content}</p>
                                                            <button
                                                                className="upvote-btn"
                                                                onClick={() => handleUpvote(answer.id)}
                                                            >
                                                                <FiThumbsUp /> {answer.upvotes} Upvotes
                                                            </button>
                                                        </div>
                                                    ))}

                                                    {/* Add Answer */}
                                                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                                                        <input
                                                            type="text"
                                                            className="input"
                                                            placeholder="Write your answer..."
                                                            value={newAnswer}
                                                            onChange={(e) => setNewAnswer(e.target.value)}
                                                            style={{ flex: 1 }}
                                                        />
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => handlePostAnswer(post.id)}
                                                            disabled={posting || !newAnswer.trim()}
                                                        >
                                                            <FiSend />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Forum;
