import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMap, FiClock, FiPlus, FiList, FiTrash2, FiTarget, FiChevronDown, FiChevronUp, FiBookOpen } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { roadmapAPI, getApiErrorMessage } from '../../api';
import './Roadmap.css';

const Roadmap = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('current'); // 'current' or 'history'

    // Generation State
    const [topic, setTopic] = useState('');
    const [days, setDays] = useState(7);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);

    // Data State
    const [currentRoadmap, setCurrentRoadmap] = useState(null);
    const [historyList, setHistoryList] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Timeline state
    const [expandedDays, setExpandedDays] = useState({});

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const res = await roadmapAPI.getHistory();
            if (res.success) setHistoryList(res.data);
        } catch (err) {
            console.error('Failed to load history', err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setIsGenerating(true);
        setError(null);

        try {
            const res = await roadmapAPI.generate(topic, days);
            if (res.success && res.data) {
                setCurrentRoadmap(res.data);
                // Expand the first day by default
                setExpandedDays({ 0: true });
            }
        } catch (err) {
            setError(getApiErrorMessage(err, 'Failed to generate roadmap. Please try again.'));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleNewRoadmap = () => {
        setCurrentRoadmap(null);
        setTopic('');
        setDays(7);
        setActiveTab('current');
        setExpandedDays({});
    };

    const handleViewHistoryItem = (item) => {
        setCurrentRoadmap(item);
        setActiveTab('current');
        setExpandedDays({ 0: true });
    };

    const handleDeleteHistory = async (e, id) => {
        e.stopPropagation();
        try {
            await roadmapAPI.delete(id);
            setHistoryList(historyList.filter(item => item.id !== id));
            if (currentRoadmap?.id === id) {
                setCurrentRoadmap(null);
            }
        } catch (err) {
            console.error('Failed to delete roadmap', err);
        }
    };

    const toggleDay = (index) => {
        setExpandedDays(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    return (
        <div className="roadmap-container">
            <header className="roadmap-header">
                <div>
                    <h1>AI Learning Roadmap</h1>
                    <p>Enter a topic and let Gemini map out your daily learning journey.</p>
                </div>
                <div className="roadmap-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'current' ? 'active' : ''}`}
                        onClick={() => setActiveTab('current')}
                    >
                        <FiTarget /> Current Roadmap
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <FiList /> History
                    </button>
                </div>
            </header>

            <main className="roadmap-content">
                <AnimatePresence mode="wait">
                    {/* CURRENT TAB */}
                    {activeTab === 'current' && (
                        <motion.div
                            key="current"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="tab-content"
                        >
                            {!currentRoadmap ? (
                                /* INPUT FORM */
                                <div className="generate-card">
                                    <div className="form-header">
                                        <div className="icon-wrapper">
                                            <FiMap size={24} />
                                        </div>
                                        <h2>What do you want to learn?</h2>
                                        <p>Our AI will structure a perfectly paced day-by-day plan for you.</p>
                                    </div>

                                    {error && <div className="error-banner">{error}</div>}

                                    <form onSubmit={handleGenerate} className="generate-form">
                                        <div className="form-group">
                                            <label>Topic / Skill</label>
                                            <input
                                                type="text"
                                                value={topic}
                                                onChange={(e) => setTopic(e.target.value)}
                                                placeholder="e.g. Full Stack Web Development with React"
                                                required
                                                disabled={isGenerating}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Duration (Days)</label>
                                            <div className="range-selector">
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="30"
                                                    value={days}
                                                    onChange={(e) => setDays(Number(e.target.value))}
                                                    disabled={isGenerating}
                                                />
                                                <span className="days-badge">{days} Days</span>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            className="generate-btn"
                                            disabled={isGenerating || !topic.trim()}
                                        >
                                            {isGenerating ? (
                                                <div className="loader-container">
                                                    <div className="spinner"></div>
                                                    <span>Generating...</span>
                                                </div>
                                            ) : (
                                                <>Generate Roadmap <FiTarget /></>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                /* ROADMAP DISPLAY */
                                <div className="active-roadmap-view">
                                    <div className="roadmap-display-header">
                                        <div className="title-section">
                                            <h2>{currentRoadmap.content?.title || currentRoadmap.topic}</h2>
                                            <p>{currentRoadmap.content?.description || `A ${currentRoadmap.days}-day plan to learn ${currentRoadmap.topic}.`}</p>
                                        </div>
                                        <button className="new-roadmap-btn" onClick={handleNewRoadmap}>
                                            <FiPlus /> New Roadmap
                                        </button>
                                    </div>

                                    <div className="timeline-container">
                                        {currentRoadmap.content?.days?.map((dayNode, index) => (
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                key={index}
                                                className={`timeline-item ${expandedDays[index] ? 'is-expanded' : ''}`}
                                            >
                                                <div className="timeline-marker">
                                                    <div className="marker-dot"></div>
                                                    {index !== currentRoadmap.content.days.length - 1 && <div className="marker-line"></div>}
                                                </div>

                                                <div className="timeline-content" onClick={() => toggleDay(index)}>
                                                    <div className="day-header">
                                                        <div className="day-badge">Day {dayNode.day}</div>
                                                        <h3>{dayNode.title}</h3>
                                                        <div className="expand-icon">
                                                            {expandedDays[index] ? <FiChevronUp /> : <FiChevronDown />}
                                                        </div>
                                                    </div>

                                                    <AnimatePresence>
                                                        {expandedDays[index] && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="day-details"
                                                            >
                                                                <p className="day-description">{dayNode.description}</p>

                                                                {dayNode.topics && dayNode.topics.length > 0 && (
                                                                    <div className="topics-list">
                                                                        <h4><FiBookOpen /> Topics to Cover:</h4>
                                                                        <ul>
                                                                            {dayNode.topics.map((t, idx) => (
                                                                                <li key={idx}>{t}</li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* HISTORY TAB */}
                    {activeTab === 'history' && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="tab-content"
                        >
                            {isLoadingHistory ? (
                                <div className="loading-state">
                                    <div className="spinner"></div>
                                    <p>Loading History...</p>
                                </div>
                            ) : historyList.length === 0 ? (
                                <div className="empty-state">
                                    <FiClock size={48} />
                                    <h3>No History Found</h3>
                                    <p>You haven't generated any roadmaps yet.</p>
                                    <button className="primary-btn" onClick={handleNewRoadmap}>Create One</button>
                                </div>
                            ) : (
                                <div className="history-grid">
                                    {historyList.map(item => (
                                        <motion.div
                                            key={item.id}
                                            className="history-card"
                                            onClick={() => handleViewHistoryItem(item)}
                                            whileHover={{ y: -4 }}
                                        >
                                            <div className="card-header">
                                                <div className="duration-badge">{item.days} Days</div>
                                                <button
                                                    className="delete-btn"
                                                    onClick={(e) => handleDeleteHistory(e, item.id)}
                                                    title="Delete"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                            <h3>{item.topic}</h3>
                                            <p className="date">Generated {new Date(item.createdAt).toLocaleDateString()}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Roadmap;
