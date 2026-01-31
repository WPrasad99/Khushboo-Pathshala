import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { forumAPI } from '../../api';
import { FiArrowLeft, FiSearch, FiBell, FiUser, FiLogOut, FiMessageSquare, FiThumbsUp, FiSend } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import './Dashboard.css';
import './Forum.css';

const Forum = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newQuestion, setNewQuestion] = useState('');
    const [expandedPost, setExpandedPost] = useState(null);
    const [newAnswer, setNewAnswer] = useState('');
    const [posting, setPosting] = useState(false);
    const [showAskBox, setShowAskBox] = useState(false);

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
            setShowAskBox(false);
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

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffSeconds = Math.floor((now - date) / 1000);

        if (diffSeconds < 60) return 'Just now';
        const diffMinutes = Math.floor(diffSeconds / 60);
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    return (
        <div className="forum-page">
            <header className="page-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/student')}>
                        <FiArrowLeft />
                    </button>
                    <h1>Community Forum</h1>
                </div>
                <button
                    className="ask-trigger-btn"
                    onClick={() => setShowAskBox(!showAskBox)}
                >
                    {showAskBox ? 'Cancel' : 'Ask a Question'}
                </button>
            </header>

            <AnimatePresence>
                {showAskBox && (
                    <motion.div
                        className="ask-question-box"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        <textarea
                            placeholder="What's on your mind? Type your question here..."
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                        />
                        <div className="box-actions">
                            <button
                                className="post-btn"
                                onClick={handlePostQuestion}
                                disabled={posting || !newQuestion.trim()}
                            >
                                {posting ? 'Posting...' : 'Post Question'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="forum-content">
                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="empty-forum">
                        <FiMessageSquare size={48} />
                        <h2>No discussions yet</h2>
                        <p>Start the conversation by asking a question!</p>
                    </div>
                ) : (
                    <div className="posts-list">
                        {posts.map((post) => (
                            <motion.article
                                key={post.id}
                                className={`post-card ${expandedPost === post.id ? 'expanded' : ''}`}
                                layout
                            >
                                <div className="post-main" onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}>
                                    <div className="post-header">
                                        <div className="author-info">
                                            <img src={post.author?.avatar} alt={post.author?.name} />
                                            <div className="meta">
                                                <span className="name">{post.author?.name}</span>
                                                <span className="time">{formatTimeAgo(post.createdAt)}</span>
                                            </div>
                                        </div>
                                        <div className="answer-count">
                                            {post.answersCount} {post.answersCount === 1 ? 'answer' : 'answers'}
                                        </div>
                                    </div>
                                    <h2 className="post-title">{post.title}</h2>
                                </div>

                                <AnimatePresence>
                                    {expandedPost === post.id && (
                                        <motion.div
                                            className="post-details"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <div className="answers-section">
                                                <h3>Discussion</h3>
                                                {post.answers?.length === 0 ? (
                                                    <p className="no-answers">No answers yet. Be the first to reply!</p>
                                                ) : (
                                                    <div className="answers-list">
                                                        {post.answers.map((answer) => (
                                                            <div key={answer.id} className="answer-item">
                                                                <div className="answer-header">
                                                                    <img src={answer.author?.avatar} alt={answer.author?.name} />
                                                                    <div className="meta">
                                                                        <span className="name">{answer.author?.name}</span>
                                                                        <span className="time">{formatTimeAgo(answer.createdAt)}</span>
                                                                    </div>
                                                                    <button
                                                                        className="upvote-btn"
                                                                        onClick={() => handleUpvote(answer.id)}
                                                                    >
                                                                        <FiThumbsUp /> {answer.upvotes}
                                                                    </button>
                                                                </div>
                                                                <p className="answer-text">{answer.content}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="reply-box">
                                                    <input
                                                        type="text"
                                                        placeholder="Write a helpful reply..."
                                                        value={newAnswer}
                                                        onChange={(e) => setNewAnswer(e.target.value)}
                                                        onKeyPress={(e) => e.key === 'Enter' && handlePostAnswer(post.id)}
                                                    />
                                                    <button
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
                            </motion.article>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Forum;
