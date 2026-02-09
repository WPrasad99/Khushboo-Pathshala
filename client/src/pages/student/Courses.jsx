import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resourceAPI } from '../../api';
import { FiPlay, FiClock, FiBook, FiCheckCircle, FiSearch, FiDownload, FiVideo, FiFileText } from 'react-icons/fi';
import { motion } from 'framer-motion';
import './Courses.css';

const Courses = () => {
    const navigate = useNavigate();
    const [content, setContent] = useState([]);
    const [activeTab, setActiveTab] = useState('all'); // all, sessions, resources, courses
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const tabs = [
        { id: 'all', name: 'All Content', icon: <FiBook /> },
        { id: 'sessions', name: 'Sessions', icon: <FiVideo /> },
        { id: 'resources', name: 'Resources', icon: <FiFileText /> },
        { id: 'courses', name: 'Courses', icon: <FiPlay /> }
    ];

    const categories = [
        { id: 'all', name: 'All Categories', icon: <FiBook /> },
        { id: 'TECHNICAL_SKILLS', name: 'Technical', icon: <FiPlay /> },
        { id: 'SOFT_SKILLS', name: 'Soft Skills', icon: <FiCheckCircle /> },
        { id: 'CAREER_GUIDANCE', name: 'Career', icon: <FiClock /> }
    ];

    useEffect(() => {
        fetchContent();
    }, [activeTab, activeCategory]);

    const fetchContent = async () => {
        try {
            setLoading(true);
            const params = {};

            // Add category filter
            if (activeCategory !== 'all') {
                params.category = activeCategory;
            }

            // Add type filter based on tab
            if (activeTab === 'sessions') {
                params.type = 'SESSION';
            } else if (activeTab === 'resources') {
                params.type = 'RESOURCE';
            } else if (activeTab === 'courses') {
                params.type = 'COURSE';
            }

            const response = await resourceAPI.getAll(params);
            setContent(response.data);
        } catch (error) {
            console.error('Failed to fetch content:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredContent = content.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getProgressColor = (progress) => {
        if (progress >= 80) return '#10B981';
        if (progress >= 40) return '#F59E0B';
        return '#6366F1';
    };

    const handleViewSession = (sessionId) => {
        navigate(`/student/courses/${sessionId}`);
    };

    const handleDownloadResource = (resourceUrl) => {
        const url = resourceUrl?.startsWith('http')
            ? resourceUrl
            : `http://localhost:5000${resourceUrl}`;
        window.open(url, '_blank');
    };

    const renderCard = (item, i) => {
        const isSession = item.type === 'SESSION';
        const isResource = item.type === 'RESOURCE';
        const isCourse = item.type === 'COURSE' || !item.type;

        return (
            <motion.div
                key={item.id}
                className={`content-card ${item.type?.toLowerCase() || 'course'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
            >
                <div className="content-thumbnail">
                    <img
                        src={item.thumbnailUrl || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop`}
                        alt={item.title}
                        onError={(e) => {
                            e.target.src = `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop`;
                        }}
                    />
                    <div className="content-type-badge">
                        {isSession && <><FiVideo /> Session</>}
                        {isResource && <><FiFileText /> Resource</>}
                        {isCourse && <><FiPlay /> Course</>}
                    </div>
                    {item.duration > 0 && (
                        <div className="content-duration">
                            <FiClock />
                            <span>{item.duration} min</span>
                        </div>
                    )}
                    {item.userProgress?.completionPercentage >= 100 && (
                        <div className="content-completed-badge">
                            <FiCheckCircle />
                            Completed
                        </div>
                    )}
                </div>

                <div className="content-body">
                    <div className="content-header">
                        <span className="content-category-tag">
                            {item.category?.replace('_', ' ') || 'General'}
                        </span>
                        {item.batch?.name && (
                            <span className="content-batch-tag">
                                {item.batch.name}
                            </span>
                        )}
                    </div>

                    <h3 className="content-title">{item.title}</h3>
                    <p className="content-description">
                        {item.description || 'Expand your knowledge with this content.'}
                    </p>

                    {item.uploadedBy?.name && (
                        <div className="content-mentor">
                            <img
                                src={item.uploadedBy.avatar || '/default-avatar.png'}
                                alt={item.uploadedBy.name}
                                className="mentor-avatar"
                            />
                            <span>by {item.uploadedBy.name}</span>
                        </div>
                    )}

                    {!isResource && item.userProgress && (
                        <div className="content-progress">
                            <div className="progress-header">
                                <span>Progress</span>
                                <span>{Math.round(item.userProgress?.completionPercentage || 0)}%</span>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${item.userProgress?.completionPercentage || 0}%`,
                                        background: getProgressColor(item.userProgress?.completionPercentage || 0)
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {isSession && (
                        <button
                            className="content-btn session-btn"
                            onClick={() => handleViewSession(item.id)}
                        >
                            <FiVideo />
                            {item.userProgress?.completionPercentage > 0 ? 'Continue Session' : 'Watch Session'}
                        </button>
                    )}

                    {isResource && (
                        <button
                            className="content-btn resource-btn"
                            onClick={() => handleDownloadResource(item.videoUrl)}
                        >
                            <FiDownload />
                            Download Resource
                        </button>
                    )}

                    {isCourse && (
                        <button
                            className="content-btn course-btn"
                            onClick={() => handleViewSession(item.id)}
                        >
                            <FiPlay />
                            {item.userProgress?.completionPercentage > 0 ? 'Continue Course' : 'Start Course'}
                        </button>
                    )}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="courses-page">
            {/* Header */}
            <div className="courses-header">
                <div className="courses-header-text">
                    <h1>Learning Center</h1>
                    <p>Explore sessions, resources, and courses</p>
                </div>
                <div className="courses-search">
                    <FiSearch />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Type Tabs */}
            <div className="content-type-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`type-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon}
                        <span>{tab.name}</span>
                    </button>
                ))}
            </div>

            {/* Category Tabs */}
            <div className="category-tabs">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat.id)}
                    >
                        {cat.icon}
                        <span>{cat.name}</span>
                    </button>
                ))}
            </div>

            {/* Content Grid */}
            <div className="content-grid">
                {loading ? (
                    <div className="content-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading content...</p>
                    </div>
                ) : filteredContent.length === 0 ? (
                    <div className="no-content">
                        <FiBook size={48} />
                        <h3>No content found</h3>
                        <p>Try a different category or search term</p>
                    </div>
                ) : (
                    filteredContent.map((item, i) => renderCard(item, i))
                )}
            </div>
        </div>
    );
};

export default Courses;
