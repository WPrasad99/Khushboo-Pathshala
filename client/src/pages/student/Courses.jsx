import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resourceAPI } from '../../api';
import { FiPlay, FiClock, FiBook, FiCheckCircle, FiSearch } from 'react-icons/fi';
import { motion } from 'framer-motion';
import './Courses.css';

const Courses = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const categories = [
        { id: 'all', name: 'All Courses', icon: <FiBook /> },
        { id: 'TECHNICAL_SKILLS', name: 'Technical', icon: <FiPlay /> },
        { id: 'SOFT_SKILLS', name: 'Soft Skills', icon: <FiCheckCircle /> },
        { id: 'CAREER_GUIDANCE', name: 'Career', icon: <FiClock /> }
    ];

    useEffect(() => {
        fetchCourses();
    }, [activeCategory]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await resourceAPI.getAll(activeCategory === 'all' ? undefined : activeCategory);
            setCourses(response.data);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getProgressColor = (progress) => {
        if (progress >= 80) return '#10B981';
        if (progress >= 40) return '#F59E0B';
        return '#6366F1';
    };

    const handleStartCourse = (courseId) => {
        navigate(`/student/courses/${courseId}`);
    };

    return (
        <div className="courses-page">
            {/* Header */}
            <div className="courses-header">
                <div className="courses-header-text">
                    <h1>Courses</h1>
                    <p>Continue your learning journey</p>
                </div>
                <div className="courses-search">
                    <FiSearch />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
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

            {/* Courses Grid */}
            <div className="courses-grid">
                {loading ? (
                    <div className="courses-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading courses...</p>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div className="no-courses">
                        <FiBook size={48} />
                        <h3>No courses found</h3>
                        <p>Try a different category or search term</p>
                    </div>
                ) : (
                    filteredCourses.map((course, i) => (
                        <motion.div
                            key={course.id}
                            className="course-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <div className="course-thumbnail">
                                <img
                                    src={course.thumbnailUrl || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop`}
                                    alt={course.title}
                                />
                                <div className="course-duration">
                                    <FiClock />
                                    <span>{course.duration} min</span>
                                </div>
                                {course.userProgress?.completionPercentage >= 100 && (
                                    <div className="course-completed-badge">
                                        <FiCheckCircle />
                                        Completed
                                    </div>
                                )}
                            </div>

                            <div className="course-content">
                                <div className="course-category-tag">
                                    {course.category?.replace('_', ' ') || 'General'}
                                </div>
                                <h3 className="course-title">{course.title}</h3>
                                <p className="course-description">
                                    {course.description?.substring(0, 80) || 'Learn new skills with this comprehensive course.'}
                                    {course.description?.length > 80 ? '...' : ''}
                                </p>

                                <div className="course-meta">
                                    <span><FiPlay /> {course.lessonsCount || 1} Lessons</span>
                                    <span><FiBook /> {course.category?.replace('_', ' ') || 'Course'}</span>
                                </div>

                                {/* Progress Bar */}
                                <div className="course-progress">
                                    <div className="progress-header">
                                        <span>Progress</span>
                                        <span>{Math.round(course.userProgress?.completionPercentage || 0)}%</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${course.userProgress?.completionPercentage || 0}%`,
                                                background: getProgressColor(course.userProgress?.completionPercentage || 0)
                                            }}
                                        />
                                    </div>
                                </div>

                                <button
                                    className="course-btn"
                                    onClick={() => handleStartCourse(course.id)}
                                >
                                    {course.userProgress?.completionPercentage > 0 ? 'Continue Course' : 'Start Course'}
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Courses;
