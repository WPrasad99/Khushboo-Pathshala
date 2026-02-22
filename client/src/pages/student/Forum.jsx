import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
    FiArrowDown,
    FiArrowUp,
    FiAward,
    FiCheckCircle,
    FiMessageSquare,
    FiSend,
    FiTag,
    FiUser
} from 'react-icons/fi';
import { forumAPI } from '../../api';
import './Forum.css';

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

const extractTags = (title) => {
    const words = (title || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(' ')
        .filter((word) => word.length >= 4);

    const uniqueWords = [...new Set(words)];
    return uniqueWords.slice(0, 3);
};

const Forum = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newQuestion, setNewQuestion] = useState('');
    const [expandedPostId, setExpandedPostId] = useState(null);
    const [answerDrafts, setAnswerDrafts] = useState({});
    const [postingQuestion, setPostingQuestion] = useState(false);
    const [postingAnswerFor, setPostingAnswerFor] = useState(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                const response = await forumAPI.getPosts();
                setPosts(response.data || []);
            } catch (error) {
                console.error('Failed to fetch forum posts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    const sortedPosts = useMemo(() => {
        return [...posts].sort((a, b) => {
            const aVotes = (a.answers || []).reduce((sum, answer) => sum + (answer.upvotes || 0), 0);
            const bVotes = (b.answers || []).reduce((sum, answer) => sum + (answer.upvotes || 0), 0);
            return bVotes - aVotes || new Date(b.createdAt) - new Date(a.createdAt);
        });
    }, [posts]);

    const refreshPosts = async () => {
        try {
            const response = await forumAPI.getPosts();
            setPosts(response.data || []);
        } catch (error) {
            console.error('Failed to refresh posts:', error);
        }
    };

    const handlePostQuestion = async () => {
        if (!newQuestion.trim() || postingQuestion) return;

        try {
            setPostingQuestion(true);
            await forumAPI.createPost({ title: newQuestion.trim(), content: newQuestion.trim() });
            setNewQuestion('');
            await refreshPosts();
        } catch (error) {
            console.error('Failed to post question:', error);
        } finally {
            setPostingQuestion(false);
        }
    };

    const handleAnswerChange = (postId, value) => {
        setAnswerDrafts((current) => ({ ...current, [postId]: value }));
    };

    const handlePostAnswer = async (postId) => {
        const content = answerDrafts[postId]?.trim();
        if (!content || postingAnswerFor) return;

        try {
            setPostingAnswerFor(postId);
            await forumAPI.createAnswer(postId, content);
            setAnswerDrafts((current) => ({ ...current, [postId]: '' }));
            await refreshPosts();
        } catch (error) {
            console.error('Failed to post answer:', error);
        } finally {
            setPostingAnswerFor(null);
        }
    };

    const handleUpvote = async (answerId) => {
        try {
            await forumAPI.upvoteAnswer(answerId);
            await refreshPosts();
        } catch (error) {
            console.error('Failed to upvote answer:', error);
        }
    };

    return (
        <div className="forum-v2-page">
            <section className="forum-v2-hero card-hero">
                <div>
                    <h1>Community Forum</h1>
                    <p>Ask sharp questions, share practical solutions, and collaborate like a modern dev community.</p>
                </div>
            </section>

            {loading ? (
                <div className="forum-v2-grid">
                    <div className="forum-v2-main">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="forum-v2-post skeleton" style={{ minHeight: 130 }} />
                        ))}
                    </div>
                    <aside className="forum-v2-sidebar">
                        <div className="forum-v2-card skeleton" style={{ minHeight: 240 }} />
                    </aside>
                </div>
            ) : (
                <div className="forum-v2-grid">
                    <section className="forum-v2-main">
                        {sortedPosts.length > 0 ? (
                            sortedPosts.map((post) => {
                                const tags = extractTags(post.title);
                                const totalVotes = (post.answers || []).reduce((sum, answer) => sum + (answer.upvotes || 0), 0);
                                const highestUpvotes = Math.max(...(post.answers || []).map((answer) => answer.upvotes || 0), 0);
                                const acceptedAnswerId = (post.answers || []).find((answer) => (answer.upvotes || 0) === highestUpvotes && highestUpvotes > 0)?.id;
                                const isExpanded = expandedPostId === post.id;

                                return (
                                    <article key={post.id} className="forum-v2-post">
                                        <button
                                            type="button"
                                            className="forum-v2-post-header"
                                            onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                                        >
                                            <div className="forum-v2-vote-rail">
                                                <FiArrowUp />
                                                <strong>{totalVotes}</strong>
                                                <FiArrowDown />
                                            </div>

                                            <div className="forum-v2-post-content">
                                                <div className="forum-v2-title-row">
                                                    <h2>{post.title}</h2>
                                                    <span className="forum-v2-answer-count">
                                                        {post.answersCount || post.answers?.length || 0} answers
                                                    </span>
                                                </div>

                                                <div className="forum-v2-meta-row">
                                                    <span>
                                                        <FiUser /> {post.author?.name || 'Community'}
                                                    </span>
                                                    <span>{formatTimeAgo(post.createdAt)}</span>
                                                    <span>
                                                        <FiMessageSquare /> Threaded discussion
                                                    </span>
                                                </div>

                                                {tags.length > 0 && (
                                                    <div className="forum-v2-tags">
                                                        {tags.map((tag) => (
                                                            <span key={`${post.id}-${tag}`}>
                                                                <FiTag /> {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </button>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <div
                                                    className="forum-v2-thread"
                                                >
                                                    <div className="forum-v2-thread-list">
                                                        {(post.answers || []).length > 0 ? (
                                                            post.answers.map((answer) => (
                                                                <article
                                                                    key={answer.id}
                                                                    className={`forum-v2-answer ${answer.id === acceptedAnswerId ? 'is-accepted' : ''}`}
                                                                >
                                                                    <div className="forum-v2-answer-vote">
                                                                        <button type="button" onClick={() => handleUpvote(answer.id)}>
                                                                            <FiArrowUp />
                                                                        </button>
                                                                        <strong>{answer.upvotes || 0}</strong>
                                                                        <button type="button" disabled>
                                                                            <FiArrowDown />
                                                                        </button>
                                                                    </div>

                                                                    <div className="forum-v2-answer-content">
                                                                        <header>
                                                                            <div className="forum-v2-answer-author">
                                                                                <img
                                                                                    src={answer.author?.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=mentor'}
                                                                                    alt={answer.author?.name || 'User'}
                                                                                />
                                                                                <div>
                                                                                    <strong>{answer.author?.name || 'Community Member'}</strong>
                                                                                    <span>{formatTimeAgo(answer.createdAt)}</span>
                                                                                </div>
                                                                            </div>

                                                                            {answer.id === acceptedAnswerId && (
                                                                                <span className="forum-v2-accepted-pill">
                                                                                    <FiCheckCircle /> Accepted
                                                                                </span>
                                                                            )}
                                                                        </header>

                                                                        <p>{answer.content}</p>
                                                                    </div>
                                                                </article>
                                                            ))
                                                        ) : (
                                                            <div className="forum-v2-empty-thread">
                                                                <FiMessageSquare />
                                                                <p>No answers yet. Be the first to help.</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="forum-v2-reply-box">
                                                        <textarea
                                                            value={answerDrafts[post.id] || ''}
                                                            onChange={(event) => handleAnswerChange(post.id, event.target.value)}
                                                            placeholder="Write a clear, practical answer..."
                                                            rows={3}
                                                        />

                                                        <button
                                                            type="button"
                                                            className="btn btn-primary"
                                                            onClick={() => handlePostAnswer(post.id)}
                                                            disabled={postingAnswerFor === post.id || !(answerDrafts[post.id] || '').trim()}
                                                        >
                                                            <FiSend />
                                                            {postingAnswerFor === post.id ? 'Posting...' : 'Post Answer'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </article>
                                );
                            })
                        ) : (
                            <div className="forum-v2-empty card">
                                <FiAward />
                                <h2>No discussions yet</h2>
                                <p>Ask the first question and shape the conversation for your batch.</p>
                            </div>
                        )}
                    </section>

                    <aside className="forum-v2-sidebar">
                        <div className="forum-v2-card">
                            <h3>Ask a Question</h3>
                            <p>Make it specific and include enough context for fast, useful answers.</p>
                            <textarea
                                value={newQuestion}
                                onChange={(event) => setNewQuestion(event.target.value)}
                                placeholder="What are you blocked on right now?"
                                rows={6}
                            />
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handlePostQuestion}
                                disabled={postingQuestion || !newQuestion.trim()}
                            >
                                {postingQuestion ? 'Posting...' : 'Post to Community'}
                            </button>
                        </div>

                        <div className="forum-v2-card compact">
                            <h4>Posting Checklist</h4>
                            <ul>
                                <li>Share your exact issue, not only the topic.</li>
                                <li>Mention what you already tried.</li>
                                <li>Accept the most helpful answer by upvoting.</li>
                            </ul>
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
};

export default Forum;
