import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resourceAPI } from '../../api';
import { FiArrowLeft, FiPlay, FiCheckCircle, FiClock, FiBook, FiLock } from 'react-icons/fi';
import { motion } from 'framer-motion';
import './CoursePlayer.css';

const CoursePlayer = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [completedVideos, setCompletedVideos] = useState(new Set());
    const [videoProgress, setVideoProgress] = useState({});

    useEffect(() => {
        fetchCourse();
    }, [courseId]);

    const fetchCourse = async () => {
        try {
            setLoading(true);
            const response = await resourceAPI.getOne(courseId);
            setCourse(response.data);

            // Load completed videos from user progress
            if (response.data.userProgress) {
                const progress = response.data.userProgress;
                const completedCount = Math.floor((progress.completionPercentage / 100) * (response.data.lessonsCount || 1));
                const completed = new Set();
                for (let i = 0; i < completedCount; i++) {
                    completed.add(i);
                }
                setCompletedVideos(completed);
                setCurrentVideoIndex(Math.min(completedCount, (response.data.lessonsCount || 1) - 1));
            }
        } catch (error) {
            console.error('Failed to fetch course:', error);
        } finally {
            setLoading(false);
        }
    };

    // Generate video list from playlist
    const getVideoList = () => {
        if (!course) return [];

        // Use real lessons if available
        if (course.lessons && Array.isArray(course.lessons) && course.lessons.length > 0) {
            return course.lessons.map((lesson, i) => ({
                index: i,
                title: lesson.title,
                videoId: lesson.videoId,
                duration: lesson.durationStr,
                completed: completedVideos.has(i),
                locked: i > 0 && !completedVideos.has(i - 1)
            }));
        }

        // Fallback for courses without lesson details
        const count = course.lessonsCount || 1;
        const videos = [];
        for (let i = 0; i < count; i++) {
            videos.push({
                index: i,
                title: `Lesson ${i + 1}`,
                completed: completedVideos.has(i),
                locked: i > 0 && !completedVideos.has(i - 1)
            });
        }
        return videos;
    };

    // Handle video completion (when user finishes watching)
    const handleVideoComplete = async () => {
        const newCompleted = new Set(completedVideos);
        newCompleted.add(currentVideoIndex);
        setCompletedVideos(newCompleted);

        // Update progress on backend
        const count = (course.lessons && course.lessons.length) || course.lessonsCount || 1;
        try {
            await resourceAPI.trackProgress(courseId, {
                watchDuration: newCompleted.size * 600, // Approximate
                totalDuration: count * 600,
                dropOffPoint: newCompleted.size * 600
            });
        } catch (error) {
            console.error('Failed to update progress:', error);
        }

        // Auto-advance to next video if available
        if (currentVideoIndex < count - 1) {
            setCurrentVideoIndex(currentVideoIndex + 1);
        }
    };

    const canPlayVideo = (index) => {
        if (index === 0) return true;
        return completedVideos.has(index - 1);
    };

    const selectVideo = (index) => {
        if (canPlayVideo(index)) {
            setCurrentVideoIndex(index);
        }
    };

    const courseProgress = () => {
        if (!course) return 0;
        const count = (course.lessons && course.lessons.length) || course.lessonsCount || 1;
        return (completedVideos.size / count) * 100;
    };

    if (loading) {
        return (
            <div className="course-player-loading">
                <div className="loading-spinner"></div>
                <p>Loading course...</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="course-not-found">
                <h2>Course not found</h2>
                <button onClick={() => navigate('/student/courses')}>Back to Courses</button>
            </div>
        );
    }

    const videos = getVideoList();
    const currentVideo = videos[currentVideoIndex];
    // Use direct video ID if available, otherwise fallback to playlist index
    const videoSrc = currentVideo?.videoId
        ? `https://www.youtube.com/embed/${currentVideo.videoId}`
        : `https://www.youtube.com/embed/videoseries?list=${course.videoUrl}&index=${currentVideoIndex}`;

    return (
        <div className="course-player-page">
            {/* Header */}
            <div className="player-header">
                <button className="back-btn" onClick={() => navigate('/student/courses')}>
                    <FiArrowLeft />
                    <span>Back to Courses</span>
                </button>
                <div className="header-progress">
                    <span className="progress-text">{completedVideos.size}/{videos.length} Videos</span>
                    <div className="header-progress-bar">
                        <div
                            className="header-progress-fill"
                            style={{ width: `${courseProgress()}%` }}
                        />
                    </div>
                    <span className="progress-percent">{Math.round(courseProgress())}%</span>
                </div>
            </div>

            <div className="player-layout">
                {/* Video Section */}
                <div className="video-section">
                    <motion.div
                        className="video-wrapper"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={currentVideoIndex}
                    >
                        <iframe
                            src={videoSrc}
                            title={`${course.title} - ${currentVideo?.title || 'Video'}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            frameBorder="0"
                        />
                    </motion.div>

                    {/* Course Info */}
                    <div className="course-info-panel">
                        <h1>{currentVideo?.title || course.title}</h1>
                        <p className="course-desc">{course.description}</p>

                        <div className="course-stats">
                            <div className="stat-item">
                                <FiBook />
                                <span>{videos.length} Videos</span>
                            </div>
                            <div className="stat-item">
                                <FiClock />
                                <span>{currentVideo?.duration || '10:00'}</span>
                            </div>
                            <div className="stat-item">
                                <FiCheckCircle />
                                <span>{completedVideos.size} Completed</span>
                            </div>
                        </div>

                        {/* Mark Complete Button */}
                        <button
                            className={`mark-complete-btn ${completedVideos.has(currentVideoIndex) ? 'completed' : ''}`}
                            onClick={handleVideoComplete}
                            disabled={completedVideos.has(currentVideoIndex)}
                        >
                            {completedVideos.has(currentVideoIndex)
                                ? '✓ Video Completed'
                                : 'Mark Video as Complete'}
                        </button>

                        {/* Notice */}
                        <div className="notice-box">
                            <strong>Note:</strong> You must complete each video fully before unlocking the next one.
                            Completed videos: {completedVideos.size}/{videos.length}
                        </div>
                    </div>
                </div>

                {/* Video List Sidebar */}
                <div className="video-list-sidebar">
                    <h3>Course Content</h3>
                    <div className="video-list">
                        {videos.map((video) => (
                            <div
                                key={video.index}
                                className={`video-item ${currentVideoIndex === video.index ? 'active' : ''} ${video.completed ? 'completed' : ''} ${video.locked ? 'locked' : ''}`}
                                onClick={() => selectVideo(video.index)}
                            >
                                <div className="video-item-icon">
                                    {video.locked ? (
                                        <FiLock />
                                    ) : video.completed ? (
                                        <FiCheckCircle />
                                    ) : (
                                        <FiPlay />
                                    )}
                                </div>
                                <div className="video-item-info">
                                    <span className="video-item-title">{video.title}</span>
                                    {video.duration && <span className="video-item-duration">{video.duration}</span>}
                                    {video.locked && <span className="video-item-status">Complete previous</span>}
                                    {video.completed && <span className="video-item-status completed">Completed</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoursePlayer;
