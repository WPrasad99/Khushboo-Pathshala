import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FiBook,
    FiCheckCircle,
    FiClock,
    FiDownload,
    FiFileText,
    FiPlay,
    FiSearch,
    FiVideo
} from 'react-icons/fi';
import { resourceAPI } from '../../api';
import './Courses.css';

const tabConfig = [
    { id: 'all', name: 'All Content', icon: FiBook },
    { id: 'sessions', name: 'Sessions', icon: FiVideo },
    { id: 'resources', name: 'Resources', icon: FiFileText },
    { id: 'courses', name: 'Courses', icon: FiPlay }
];

const categoryConfig = [
    { id: 'all', name: 'All Categories' },
    { id: 'TECHNICAL_SKILLS', name: 'Technical Skills' },
    { id: 'SOFT_SKILLS', name: 'Soft Skills' },
    { id: 'CAREER_GUIDANCE', name: 'Career Guidance' }
];

const getProgressColor = (progress) => {
    if (progress >= 80) return 'var(--color-success)';
    if (progress >= 40) return 'var(--color-warning)';
    return 'var(--color-primary)';
};

const LearningSkeleton = () => (
    <div className="learning-grid">
        {Array.from({ length: 6 }).map((_, index) => (
            <article key={index} className="learning-card skeleton" style={{ minHeight: 340 }} />
        ))}
    </div>
);

const Courses = () => {
    const navigate = useNavigate();

    const [content, setContent] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                setLoading(true);
                const params = {};

                if (activeCategory !== 'all') params.category = activeCategory;
                if (activeTab === 'sessions') params.type = 'SESSION';
                if (activeTab === 'resources') params.type = 'RESOURCE';
                if (activeTab === 'courses') params.type = 'COURSE';

                const response = await resourceAPI.getAll(params);
                setContent(response.data || []);
            } catch (error) {
                console.error('Failed to fetch learning content:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, [activeTab, activeCategory]);

    const filteredContent = useMemo(
        () =>
            content.filter(
                (item) =>
                    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        [content, searchQuery]
    );

    const summaryCounts = useMemo(() => {
        const sessions = content.filter((item) => item.type === 'SESSION').length;
        const resources = content.filter((item) => item.type === 'RESOURCE').length;
        const courses = content.filter((item) => !item.type || item.type === 'COURSE').length;

        return { sessions, resources, courses };
    }, [content]);

    const handleOpenContent = (item) => {
        const isResource = item.type === 'RESOURCE';

        if (isResource) {
            const resourceUrl = item.videoUrl?.startsWith('http') ? item.videoUrl : `http://localhost:5001${item.videoUrl}`;
            window.open(resourceUrl, '_blank');
            return;
        }

        navigate(`/student/courses/${item.id}`);
    };

    return (
        <div className="learning-page">


            <section className="learning-toolbar">
                <div className="learning-tab-row">
                    {tabConfig.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                className={`learning-tab ${activeTab === tab.id ? 'is-active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <Icon />
                                {tab.name}
                            </button>
                        );
                    })}
                </div>

                <div className="learning-category-row">
                    {categoryConfig.map((category) => (
                        <button
                            key={category.id}
                            type="button"
                            className={`learning-category-chip ${activeCategory === category.id ? 'is-active' : ''}`}
                            onClick={() => setActiveCategory(category.id)}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            </section>

            {loading ? (
                <LearningSkeleton />
            ) : filteredContent.length > 0 ? (
                <div className="learning-grid">
                    {filteredContent.map((item, index) => {
                        const isSession = item.type === 'SESSION';
                        const isResource = item.type === 'RESOURCE';
                        const isCourse = item.type === 'COURSE' || !item.type;
                        const progress = Math.round(item.userProgress?.completionPercentage || 0);
                        const isCompleted = progress >= 100;

                        return (
                            <motion.article
                                key={item.id}
                                className={`learning-card type-${item.type?.toLowerCase() || 'course'}`}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                            >
                                <div className="learning-thumb">
                                    <img
                                        src={
                                            item.thumbnailUrl ||
                                            (item.videoId ? `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg` : null) ||
                                            (isSession ? 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80' : 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80')
                                        }
                                        alt={item.title}
                                        onError={(e) => {
                                            if (e.target.src.includes('maxresdefault')) {
                                                e.target.src = e.target.src.replace('maxresdefault', 'mqdefault');
                                            } else if (!e.target.src.includes('unsplash')) {
                                                e.target.src = 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80';
                                            }
                                        }}
                                    />

                                    <span className="learning-type-pill">
                                        {isSession && <FiVideo />}
                                        {isResource && <FiFileText />}
                                        {isCourse && <FiPlay />}
                                        {isSession ? 'Session' : isResource ? 'Resource' : 'Course'}
                                    </span>

                                    {!!item.duration && (
                                        <span className="learning-duration-pill">
                                            <FiClock /> {item.duration} min
                                        </span>
                                    )}

                                    {isCompleted && (
                                        <span className="learning-complete-pill">
                                            <FiCheckCircle /> Completed
                                        </span>
                                    )}
                                </div>

                                <div className="learning-body">
                                    <div className="learning-top-tags">
                                        <span className="learning-tag">{item.category?.replaceAll('_', ' ') || 'General'}</span>
                                        {item.batch?.name && <span className="learning-tag secondary">{item.batch.name}</span>}
                                    </div>

                                    <h3>{item.title}</h3>


                                    <div className="learning-mentor-row">
                                        <img
                                            src={item.uploadedBy?.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=mentor'}
                                            alt={item.uploadedBy?.name || 'Mentor'}
                                        />
                                        <span>{item.uploadedBy?.name || 'Mentor'} • {item.duration || 30} min</span>
                                    </div>

                                    {!isResource && (
                                        <div className="learning-progress-wrap">
                                            <div className="learning-progress-meta">
                                                <span>Progress</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: `${progress}%`, background: getProgressColor(progress) }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        className={`btn ${isResource ? 'btn-secondary' : 'btn-primary'} learning-open-btn`}
                                        onClick={() => handleOpenContent(item)}
                                    >
                                        {isResource ? <FiDownload /> : <FiPlay />}
                                        {isResource
                                            ? 'Download Resource'
                                            : progress > 0
                                                ? `Continue ${isSession ? 'Session' : 'Course'}`
                                                : `Start ${isSession ? 'Session' : 'Course'}`}
                                    </button>
                                </div>
                            </motion.article>
                        );
                    })}
                </div>
            ) : (
                <section className="learning-empty card-hero">
                    <FiBook />
                    <h2>No content found</h2>
                    <p>Try adjusting filters or searching with a different keyword.</p>
                </section>
            )}
        </div>
    );
};

export default Courses;
