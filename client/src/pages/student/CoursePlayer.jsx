import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    FiArrowLeft,
    FiBook,
    FiCheckCircle,
    FiClock,
    FiDownload,
    FiExternalLink,
    FiLock,
    FiPlay,
    FiSave
} from 'react-icons/fi';
import { resourceAPI } from '../../api';
import './CoursePlayer.css';

const CoursePlayer = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [completedVideos, setCompletedVideos] = useState(new Set());
    const [notes, setNotes] = useState('');

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                setLoading(true);
                const response = await resourceAPI.getOne(courseId);
                const payload = response.data;
                setCourse(payload);

                if (payload.userProgress) {
                    const lessonCount = (payload.lessons && payload.lessons.length) || payload.lessonsCount || 1;
                    const completedCount = Math.floor((payload.userProgress.completionPercentage / 100) * lessonCount);
                    const completed = new Set();

                    for (let index = 0; index < completedCount; index += 1) {
                        completed.add(index);
                    }

                    setCompletedVideos(completed);
                    setCurrentVideoIndex(Math.min(completedCount, lessonCount - 1));
                }
            } catch (error) {
                console.error('Failed to fetch course:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [courseId]);

    useEffect(() => {
        const storedNotes = localStorage.getItem(`course-notes-${courseId}`) || '';
        setNotes(storedNotes);
    }, [courseId]);

    useEffect(() => {
        localStorage.setItem(`course-notes-${courseId}`, notes);
    }, [courseId, notes]);

    const getVideoList = () => {
        if (!course) return [];

        if (course.lessons && Array.isArray(course.lessons) && course.lessons.length > 0) {
            return course.lessons.map((lesson, index) => ({
                index,
                title: lesson.title,
                videoId: lesson.videoId,
                duration: lesson.durationStr,
                completed: completedVideos.has(index),
                locked: index > 0 && !completedVideos.has(index - 1)
            }));
        }

        const count = course.lessonsCount || 1;
        return Array.from({ length: count }).map((_, index) => ({
            index,
            title: `Lesson ${index + 1}`,
            completed: completedVideos.has(index),
            locked: index > 0 && !completedVideos.has(index - 1)
        }));
    };

    const videos = getVideoList();

    const canPlayVideo = (index) => index === 0 || completedVideos.has(index - 1);

    const selectVideo = (index) => {
        if (!canPlayVideo(index)) return;
        setCurrentVideoIndex(index);
    };

    const courseProgress = useMemo(() => {
        if (!course) return 0;

        const lessonCount = (course.lessons && course.lessons.length) || course.lessonsCount || 1;
        return Math.round((completedVideos.size / lessonCount) * 100);
    }, [completedVideos.size, course]);

    const handleVideoComplete = async () => {
        const updated = new Set(completedVideos);
        updated.add(currentVideoIndex);
        setCompletedVideos(updated);

        const lessonCount = (course.lessons && course.lessons.length) || course.lessonsCount || 1;

        try {
            await resourceAPI.trackProgress(courseId, {
                watchDuration: updated.size * 600,
                totalDuration: lessonCount * 600,
                dropOffPoint: updated.size * 600
            });
        } catch (error) {
            console.error('Failed to update progress:', error);
        }

        if (currentVideoIndex < lessonCount - 1) {
            setCurrentVideoIndex(currentVideoIndex + 1);
        }
    };

    const getYouTubeInfo = (url) => {
        if (!url) return { type: null, id: null };

        try {
            if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return { type: 'video', id: url };
            if (/^PL[a-zA-Z0-9_-]{20,}$/.test(url)) return { type: 'playlist', id: url };

            const parsed = new URL(url);

            if (parsed.hostname === 'youtu.be') {
                return { type: 'video', id: parsed.pathname.slice(1) };
            }

            if (parsed.pathname === '/playlist') {
                return { type: 'playlist', id: parsed.searchParams.get('list') };
            }

            if (parsed.pathname.startsWith('/embed/')) {
                const id = parsed.pathname.split('/')[2];
                if (id === 'videoseries') {
                    return { type: 'playlist', id: parsed.searchParams.get('list') };
                }

                return { type: 'video', id };
            }

            if (parsed.pathname === '/watch') {
                if (parsed.searchParams.has('list')) {
                    return {
                        type: 'playlist',
                        id: parsed.searchParams.get('list'),
                        videoId: parsed.searchParams.get('v')
                    };
                }

                return { type: 'video', id: parsed.searchParams.get('v') };
            }
        } catch (error) {
            console.error('Invalid video URL', url, error);
        }

        return { type: 'unknown', id: url };
    };

    const currentVideo = videos[currentVideoIndex];

    let videoSrc = '';
    if (currentVideo?.videoId) {
        videoSrc = `https://www.youtube.com/embed/${currentVideo.videoId}`;
    } else {
        const info = getYouTubeInfo(course?.videoUrl);
        if (info.type === 'playlist') {
            videoSrc = `https://www.youtube.com/embed?listType=playlist&list=${info.id}&index=${currentVideoIndex}`;
        } else if (info.type === 'video') {
            videoSrc = `https://www.youtube.com/embed/${info.id}`;
        } else {
            videoSrc = course?.videoUrl?.includes('embed') ? course.videoUrl : `https://www.youtube.com/embed/${course?.videoUrl}`;
        }
    }

    const attachments = [
        {
            id: 'main',
            label: 'Course Material',
            href: course?.videoUrl,
            isExternal: true
        }
    ].filter(Boolean);

    const relatedSessions = videos
        .filter((video) => video.index !== currentVideoIndex)
        .slice(0, 6);

    if (loading) {
        return (
            <div className="course-player-loading-v2">
                <div className="loading-spinner" />
                <p>Loading learning workspace...</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="course-player-loading-v2">
                <h2>Course not found</h2>
                <button type="button" className="btn btn-primary" onClick={() => navigate('/student/courses')}>
                    Back to Learning
                </button>
            </div>
        );
    }

    return (
        <div className="course-player-v2">
            <header className="course-player-header-v2">
                <button type="button" className="btn btn-secondary" onClick={() => navigate('/student/courses')}>
                    <FiArrowLeft /> Back to Learning
                </button>

                <div className="course-player-header-stats">
                    <div>
                        <small>Completion</small>
                        <strong>{courseProgress}%</strong>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${courseProgress}%` }} />
                    </div>
                    {courseProgress >= 80 && (
                        <span className="badge badge-success">
                            <FiCheckCircle /> Completion Badge Unlocked
                        </span>
                    )}
                </div>
            </header>

            <div className="course-player-layout-v2">
                <section className="course-video-column">
                    <div className="course-video-sticky">
                        <motion.div className="course-video-shell" key={currentVideoIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <iframe
                                src={videoSrc}
                                title={`${course.title} - ${currentVideo?.title || 'Lesson'}`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                frameBorder="0"
                            />
                        </motion.div>

                        <article className="course-video-progress-card card">
                            <div>
                                <h3>{currentVideo?.title || course.title}</h3>
                                <p>{completedVideos.size}/{videos.length} lessons completed</p>
                            </div>

                            <button
                                type="button"
                                className={`btn ${completedVideos.has(currentVideoIndex) ? 'btn-secondary' : 'btn-primary'}`}
                                onClick={handleVideoComplete}
                                disabled={completedVideos.has(currentVideoIndex)}
                            >
                                {completedVideos.has(currentVideoIndex) ? <FiCheckCircle /> : <FiPlay />}
                                {completedVideos.has(currentVideoIndex) ? 'Completed' : 'Mark Lesson Complete'}
                            </button>
                        </article>
                    </div>

                    <article className="course-lesson-list-card card">
                        <header>
                            <h3>Lesson Navigator</h3>
                            <span>{videos.length} lessons</span>
                        </header>

                        <div className="course-lesson-list">
                            {videos.map((video) => (
                                <button
                                    key={video.index}
                                    type="button"
                                    className={`course-lesson-item ${video.index === currentVideoIndex ? 'is-active' : ''} ${video.completed ? 'is-complete' : ''}`}
                                    onClick={() => selectVideo(video.index)}
                                    disabled={video.locked}
                                >
                                    <span className="course-lesson-icon">
                                        {video.locked ? <FiLock /> : video.completed ? <FiCheckCircle /> : <FiPlay />}
                                    </span>

                                    <span className="course-lesson-content">
                                        <strong>{video.title}</strong>
                                        <small>
                                            {video.locked
                                                ? 'Complete previous lesson'
                                                : video.completed
                                                    ? 'Completed'
                                                    : video.duration || 'Ready to watch'}
                                        </small>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </article>
                </section>

                <aside className="course-detail-column">
                    <article className="course-detail-card card">
                        <h3>Description</h3>
                        <p>{course.description || 'No description provided for this module.'}</p>
                        <div className="course-detail-meta">
                            <span><FiBook /> {videos.length} Lessons</span>
                            <span><FiClock /> {currentVideo?.duration || `${course.duration || 0} min`}</span>
                        </div>
                    </article>

                    <article className="course-detail-card card">
                        <h3>Attachments</h3>
                        <div className="course-attachment-list">
                            {attachments.map((item) => (
                                <a
                                    key={item.id}
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="course-attachment-item"
                                >
                                    <span>{item.label}</span>
                                    {item.isExternal ? <FiExternalLink /> : <FiDownload />}
                                </a>
                            ))}
                        </div>
                    </article>

                    <article className="course-detail-card card">
                        <h3>Related Sessions</h3>
                        <div className="course-related-list">
                            {relatedSessions.length > 0 ? (
                                relatedSessions.map((video) => (
                                    <button key={video.index} type="button" onClick={() => selectVideo(video.index)}>
                                        <span>{video.title}</span>
                                        <FiPlay />
                                    </button>
                                ))
                            ) : (
                                <p className="course-muted">No related sessions available.</p>
                            )}
                        </div>
                    </article>

                    <article className="course-detail-card card">
                        <h3>Your Notes</h3>
                        <textarea
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            placeholder="Write your revision notes, key points, and follow-up questions..."
                            rows={7}
                        />
                        <div className="course-notes-footer">
                            <span>Autosaved locally</span>
                            <span><FiSave /> Saved</span>
                        </div>
                    </article>
                </aside>
            </div>
        </div>
    );
};

export default CoursePlayer;
