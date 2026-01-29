import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { resourceAPI } from '../../api';
import { FiArrowLeft, FiSearch, FiBell, FiUser, FiLogOut, FiPlay, FiClock } from 'react-icons/fi';
import { motion } from 'framer-motion';
import './Dashboard.css';

const LearningResources = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [resources, setResources] = useState([]);
    const [selectedResource, setSelectedResource] = useState(null);
    const [activeCategory, setActiveCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [watchProgress, setWatchProgress] = useState(0);
    const progressInterval = useRef(null);

    const categories = [
        { id: 'all', name: 'All' },
        { id: 'TECHNICAL_SKILLS', name: 'Technical Skills' },
        { id: 'SOFT_SKILLS', name: 'Soft Skills' },
        { id: 'CAREER_GUIDANCE', name: 'Career Guidance' }
    ];

    useEffect(() => {
        fetchResources();
    }, [activeCategory]);

    useEffect(() => {
        // Cleanup interval on unmount
        return () => {
            if (progressInterval.current) {
                clearInterval(progressInterval.current);
            }
        };
    }, []);

    const fetchResources = async () => {
        try {
            setLoading(true);
            const response = await resourceAPI.getAll(activeCategory === 'all' ? undefined : activeCategory);
            setResources(response.data);
            if (response.data.length > 0 && !selectedResource) {
                setSelectedResource(response.data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch resources:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResourceSelect = (resource) => {
        setSelectedResource(resource);
        setWatchProgress(resource.userProgress?.completionPercentage || 0);

        // Clear existing interval
        if (progressInterval.current) {
            clearInterval(progressInterval.current);
        }
    };

    const handleVideoPlay = () => {
        // Simulate video progress tracking
        const totalDuration = selectedResource.duration * 60; // Convert to seconds
        const startProgress = selectedResource.userProgress?.watchDuration || 0;
        let currentProgress = startProgress;

        progressInterval.current = setInterval(async () => {
            currentProgress += 5; // Add 5 seconds every 5 seconds (simulated)
            const completionPercentage = Math.min((currentProgress / totalDuration) * 100, 100);
            setWatchProgress(completionPercentage);

            // Track progress to backend
            try {
                const result = await resourceAPI.trackProgress(selectedResource.id, {
                    watchDuration: currentProgress,
                    totalDuration: totalDuration,
                    dropOffPoint: currentProgress
                });

                if (result.data.attendanceMarked) {
                    console.log('Attendance marked automatically!');
                }
            } catch (error) {
                console.error('Failed to track progress:', error);
            }

            if (completionPercentage >= 100) {
                clearInterval(progressInterval.current);
            }
        }, 5000);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
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
                        <input type="text" placeholder="Search..." />
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
                    <h1>Learning Resources</h1>
                </div>

                <motion.div
                    className="glass-card resources-content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* Category Filters */}
                    <div className="filters-sidebar">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                className={`filter-btn ${activeCategory === cat.id ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat.id)}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Video Player */}
                    <div className="video-section">
                        {selectedResource && (
                            <>
                                <div className="video-player">
                                    <iframe
                                        src={selectedResource.videoUrl}
                                        title={selectedResource.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        onLoad={handleVideoPlay}
                                    />
                                </div>
                                <div className="video-info glass-card-static">
                                    <h3>{selectedResource.title}</h3>
                                    <p>{selectedResource.description}</p>

                                    <div className="video-stats">
                                        <div className="video-stat">
                                            <span className="video-stat-label">Watch Duration</span>
                                            <span className="video-stat-value">
                                                {Math.round(watchProgress * selectedResource.duration / 100)} min / {selectedResource.duration} min
                                            </span>
                                        </div>
                                        <div className="video-stat">
                                            <span className="video-stat-label">Completion</span>
                                            <span className="video-stat-value">{Math.round(watchProgress)}%</span>
                                        </div>
                                        <div className="video-stat">
                                            <span className="video-stat-label">Attendance</span>
                                            <span className="video-stat-value" style={{ color: watchProgress >= 80 ? 'var(--green)' : 'var(--orange)' }}>
                                                {watchProgress >= 80 ? 'Marked ✓' : 'Pending (80% required)'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="progress-bar" style={{ marginTop: 'var(--spacing-md)' }}>
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${watchProgress}%`, background: watchProgress >= 80 ? 'var(--green)' : undefined }}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Course List */}
                    <div className="courses-sidebar">
                        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Courses</h3>
                        <div className="courses-list">
                            {loading ? (
                                <div className="loading-spinner" style={{ margin: '20px auto' }}></div>
                            ) : (
                                resources.map((resource) => (
                                    <div
                                        key={resource.id}
                                        className={`course-card ${selectedResource?.id === resource.id ? 'active' : ''}`}
                                        onClick={() => handleResourceSelect(resource)}
                                    >
                                        <img
                                            src={resource.thumbnailUrl || `https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg`}
                                            alt={resource.title}
                                            className="course-thumbnail"
                                        />
                                        <div className="course-info">
                                            <div className="course-title">
                                                {resource.title}
                                                {resource.isHot && <span className="badge badge-hot">HOT</span>}
                                            </div>
                                            <div className="course-meta">
                                                <FiPlay /> {resource.lessonsCount} Lessons •
                                                <FiClock /> {resource.duration} min
                                            </div>
                                            {resource.userProgress && (
                                                <div className="progress-bar" style={{ marginTop: 'var(--spacing-xs)', height: '4px' }}>
                                                    <div
                                                        className="progress-fill"
                                                        style={{ width: `${resource.userProgress.completionPercentage}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <button className="btn btn-secondary btn-sm">View</button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LearningResources;
