import { useState, useEffect, useRef } from 'react';
import { assignmentAPI, quizAPI } from '../api';
import { FiFileText, FiSend, FiCheckCircle, FiAlertCircle, FiClock, FiUpload, FiMaximize, FiX, FiSearch, FiFilter, FiChevronRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const StudentAssignmentSection = () => {
    // --- State Management ---
    const [assignments, setAssignments] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // UI State
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'assignments', 'quizzes'
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'completed', 'overdue'

    // Interaction State
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submissionContent, setSubmissionContent] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    // Quiz Player State
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [quizData, setQuizData] = useState(null);
    const [currentQuizId, setCurrentQuizId] = useState(null);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState(null);
    const quizContainerRef = useRef(null);
    const timerRef = useRef(null);

    // --- Lifecycle ---
    useEffect(() => {
        fetchData();
    }, []);

    // Quiz Timer & Security Effect
    useEffect(() => {
        if (activeQuiz && quizData) {
            // Set initial time
            setTimeLeft(quizData.duration * 60);

            // Start timer
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleAutoSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            // Set up visibility change listener
            const handleVisibilityChange = () => {
                if (document.hidden && isFullScreen) {
                    setTabSwitchCount(prev => {
                        const newCount = prev + 1;
                        if (newCount >= 3) {
                            alert('Too many tab switches detected! Quiz will be auto-submitted.');
                            handleAutoSubmit();
                        } else {
                            alert(`Warning: Tab switching detected! (${newCount}/3). Quiz will be auto-submitted after 3 attempts.`);
                        }
                        return newCount;
                    });
                }
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);

            return () => {
                if (timerRef.current) clearInterval(timerRef.current);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            };
        }
    }, [activeQuiz, quizData, isFullScreen]);

    // --- Data Fetching ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const [assignmentsRes, quizzesRes] = await Promise.all([
                assignmentAPI.getAssignments(),
                quizAPI.getStudentQuizzes()
            ]);
            setAssignments(assignmentsRes.data || []);
            setQuizzes(quizzesRes.data || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Helpers ---
    const getStatusInfo = (assignment) => {
        const submission = assignment.submissions?.[0];
        if (!submission) {
            const isOverdue = new Date(assignment.dueDate) < new Date();
            if (isOverdue) return { status: 'Overdue', color: '#dc2626', bg: '#fee2e2', icon: <FiAlertCircle /> };
            return { status: 'Pending', color: '#d97706', bg: '#fef3c7', icon: <FiClock /> };
        }
        if (submission.status === 'PENDING') return { status: 'Submitted', color: '#3b82f6', bg: '#eff6ff', icon: <FiCheckCircle /> };
        if (submission.status === 'APPROVED') return { status: 'Approved', color: '#059669', bg: '#d1fae5', icon: <FiCheckCircle /> };
        return { status: 'Rejected', color: '#dc2626', bg: '#fee2e2', icon: <FiAlertCircle /> };
    };

    const getQuizStatus = (quiz) => {
        if (!quiz.submission) {
            const isOverdue = new Date(quiz.dueDate) < new Date();
            if (isOverdue) return { status: 'Overdue', color: '#dc2626', bg: '#fee2e2', icon: <FiAlertCircle /> };
            return { status: 'Not Started', color: '#64748b', bg: '#f1f5f9', icon: <FiClock /> };
        }
        if (quiz.submission.status === 'IN_PROGRESS') return { status: 'In Progress', color: '#d97706', bg: '#fef3c7', icon: <FiClock /> };
        if (quiz.submission.status === 'COMPLETED') return { status: `Score: ${quiz.submission.score}/${quiz.totalMarks}`, color: '#059669', bg: '#d1fae5', icon: <FiCheckCircle /> };
        return { status: 'Unknown', color: '#64748b', bg: '#f1f5f9', icon: <FiClock /> };
    };

    // --- Filtering Logic ---
    const filteredContent = () => {
        let content = [];

        if (activeTab === 'all' || activeTab === 'assignments') {
            const mappedAssignments = assignments.map(a => ({ ...a, type: 'assignment' }));
            content = [...content, ...mappedAssignments];
        }
        if (activeTab === 'all' || activeTab === 'quizzes') {
            const mappedQuizzes = quizzes.map(q => ({ ...q, type: 'quiz' }));
            content = [...content, ...mappedQuizzes];
        }

        return content.filter(item => {
            // Search Filter
            const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchQuery.toLowerCase());

            // Status Filter
            let matchesStatus = true;
            if (filterStatus !== 'all') {
                if (item.type === 'assignment') {
                    const status = getStatusInfo(item).status.toLowerCase();
                    if (filterStatus === 'pending') matchesStatus = status === 'pending' || status === 'overdue' || status === 'rejected'; // Group needing action
                    if (filterStatus === 'completed') matchesStatus = status === 'submitted' || status === 'approved';
                    if (filterStatus === 'overdue') matchesStatus = status === 'overdue';
                } else {
                    const status = getQuizStatus(item).status.toLowerCase(); // 'not started', 'in progress', 'score: ...'
                    if (filterStatus === 'pending') matchesStatus = status === 'not started' || status === 'overdue';
                    if (filterStatus === 'completed') matchesStatus = status.includes('score');
                    if (filterStatus === 'overdue') matchesStatus = status === 'overdue';
                }
            }

            return matchesSearch && matchesStatus;
        });
    };

    // --- Assignment Handlers ---
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSubmitAssignment = async (e) => {
        e.preventDefault();
        try {
            let data;
            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                formData.append('content', submissionContent || 'File submission');
                data = formData;
            } else {
                data = { content: submissionContent };
            }

            await assignmentAPI.submitAssignment(selectedAssignment.id, data);

            setSubmissionContent('');
            setSelectedFile(null);
            setShowSubmitModal(false);
            setSelectedAssignment(null);
            fetchData();
            alert('Assignment submitted successfully!');
        } catch (error) {
            console.error('Failed to submit assignment:', error);
            alert('Failed to submit assignment');
        }
    };

    // --- Quiz Handlers ---
    const handleStartQuiz = async (quiz) => {
        try {
            await quizAPI.startQuiz(quiz.id);
            const response = await quizAPI.getQuizDetails(quiz.id);
            setQuizData(response.data);
            setCurrentQuizId(quiz.id);
            setActiveQuiz(quiz);
            setAnswers({});

            if (quizContainerRef.current) {
                try {
                    await quizContainerRef.current.requestFullscreen();
                    setIsFullScreen(true);
                } catch (err) {
                    console.error('Failed to enter fullscreen:', err);
                    alert('Please allow fullscreen mode to start the quiz.');
                }
            }
        } catch (error) {
            console.error('Failed to start quiz:', error);
            alert('Failed to start quiz. Please try again.');
        }
    };

    const handleAnswerSelect = (questionId, optionIndex) => {
        setAnswers({ ...answers, [questionId]: optionIndex });
    };

    const handleAutoSubmit = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        await submitQuiz();
    };

    const handleSubmitQuiz = async () => {
        if (window.confirm('Are you sure you want to submit the quiz?')) {
            await submitQuiz();
        }
    };

    const submitQuiz = async () => {
        try {
            const response = await quizAPI.submitQuiz(currentQuizId, answers);
            setResult(response.data);
            setShowResult(true);

            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }
            setIsFullScreen(false);

            fetchData();

            setTimeout(() => {
                setActiveQuiz(null);
                setQuizData(null);
                setShowResult(false);
                setAnswers({});
                setTabSwitchCount(0);
            }, 5000);
        } catch (error) {
            console.error('Failed to submit quiz:', error);
            alert('Failed to submit quiz. Please try again.');
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // --- Render Logic ---

    // 1. Quiz Player Mode
    if (activeQuiz && quizData && !showResult) {
        return (
            <div
                ref={quizContainerRef}
                style={{
                    position: isFullScreen ? 'fixed' : 'relative',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: '#fff',
                    zIndex: isFullScreen ? 9999 : 1,
                    padding: '40px',
                    overflowY: 'auto'
                }}
                onContextMenu={(e) => e.preventDefault()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', padding: '20px', background: '#f8faff', borderRadius: '12px' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e3a8a' }}>{quizData.title}</h2>
                        <p style={{ margin: '4px 0 0', color: '#64748b' }}>{quizData.description}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ padding: '12px 20px', background: timeLeft < 60 ? '#fef2f2' : '#f0f9ff', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiClock style={{ color: timeLeft < 60 ? '#dc2626' : '#3b82f6' }} />
                            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: timeLeft < 60 ? '#dc2626' : '#3b82f6' }}>
                                {formatTime(timeLeft)}
                            </span>
                        </div>
                    </div>
                </div>

                {tabSwitchCount > 0 && (
                    <div style={{ padding: '12px 20px', background: '#fef2f2', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FiAlertCircle style={{ color: '#dc2626' }} />
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>
                            Warning: {tabSwitchCount} tab switch(es) detected. Quiz will auto-submit after 3 attempts.
                        </span>
                    </div>
                )}

                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    {quizData.questions?.map((question, qIdx) => (
                        <div key={question.id} style={{ marginBottom: '32px', padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#1e293b' }}>
                                Q{qIdx + 1}. {question.question}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {question.options?.map((option, idx) => (
                                    <label
                                        key={idx}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '12px', padding: '16px',
                                            background: answers[question.id] === idx ? '#dbeafe' : 'white',
                                            border: `2px solid ${answers[question.id] === idx ? '#3b82f6' : '#e2e8f0'}`,
                                            borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name={`question_${question.id}`}
                                            checked={answers[question.id] === idx}
                                            onChange={() => handleAnswerSelect(question.id, idx)}
                                            style={{ accentColor: '#3b82f6' }}
                                        />
                                        <span style={{ fontSize: '0.95rem', color: '#1e293b' }}>{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ position: 'fixed', bottom: '20px', right: '20px', display: 'flex', gap: '12px' }}>
                    <button
                        onClick={handleSubmitQuiz}
                        style={{
                            padding: '16px 32px', background: '#3b82f6', color: 'white', border: 'none',
                            borderRadius: '8px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                        }}
                    >
                        Submit Quiz
                    </button>
                </div>
            </div>
        );
    }

    // 2. Quiz Result Mode
    if (showResult && result) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                        maxWidth: '500px', margin: '0 auto', padding: '40px',
                        background: '#f8faff', borderRadius: '16px', border: '2px solid #3b82f6'
                    }}
                >
                    <FiCheckCircle size={64} style={{ color: '#10b981', marginBottom: '20px' }} />
                    <h2 style={{ margin: '0 0 16px', color: '#1e3a8a' }}>Quiz Submitted!</h2>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6', margin: '0 0 8px' }}>
                        Your Score: {result.score}/{result.totalMarks}
                    </p>
                    <p style={{ color: '#64748b' }}>Redirecting to list...</p>
                </motion.div>
            </div>
        );
    }

    // 3. Default List Mode
    return (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{ marginBottom: '16px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', marginBottom: '16px' }}>Assignments & Quizzes</h1>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Top Bar: Tabs & Search */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '12px', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
                            {[
                                { id: 'all', label: 'All Items' },
                                { id: 'assignments', label: 'Assignments' },
                                { id: 'quizzes', label: 'Quizzes' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        padding: '8px 20px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: activeTab === tab.id ? 'white' : 'transparent',
                                        color: activeTab === tab.id ? '#3b82f6' : '#64748b',
                                        fontWeight: activeTab === tab.id ? 700 : 500,
                                        boxShadow: activeTab === tab.id ? '0 2px 4px -1px rgba(0,0,0,0.1)' : 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div style={{ position: 'relative', minWidth: '300px' }}>
                            <FiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="Search by title..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 10px 10px 40px',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                    Loading content...
                </div>
            ) : filteredContent().length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                    {filteredContent().map((item, index) => {
                        const isAssignment = item.type === 'assignment';
                        const statusInfo = isAssignment ? getStatusInfo(item) : getQuizStatus(item);
                        const canStartQuiz = !isAssignment && (!item.submission || item.submission.status !== 'COMPLETED');

                        return (
                            <motion.div
                                key={`${item.type}-${item.id}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                style={{
                                    background: 'white',
                                    borderRadius: '16px',
                                    border: '1px solid #e2e8f0',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    cursor: 'pointer'
                                }}
                                whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                            >
                                {/* Card Graphic Header */}
                                <div style={{
                                    height: '140px',
                                    background: isAssignment ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    position: 'relative',
                                    padding: '20px',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between'
                                }}>
                                    <span style={{
                                        background: 'rgba(255,255,255,0.2)',
                                        backdropFilter: 'blur(4px)',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        fontWeight: 700
                                    }}>
                                        {isAssignment ? 'ASSIGNMENT' : 'QUIZ'}
                                    </span>
                                    <div style={{
                                        background: 'white',
                                        padding: '8px',
                                        borderRadius: '12px',
                                        color: isAssignment ? '#2563eb' : '#059669',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                    }}>
                                        {isAssignment ? <FiFileText size={24} /> : <FiCheckCircle size={24} />}
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', lineHeight: '1.4' }}>
                                            {item.title}
                                        </h3>
                                    </div>

                                    <p style={{
                                        margin: '0 0 16px',
                                        fontSize: '0.9rem',
                                        color: '#64748b',
                                        lineHeight: '1.5',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {item.description}
                                    </p>

                                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {/* Meta Info */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {/* Status Badge */}
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                background: statusInfo.bg,
                                                color: statusInfo.color,
                                                fontSize: '0.75rem',
                                                fontWeight: 600
                                            }}>
                                                {statusInfo.icon} {statusInfo.status}
                                            </span>

                                            {/* Due Date Badge */}
                                            {item.dueDate && (
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    background: '#f1f5f9',
                                                    color: '#64748b',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600
                                                }}>
                                                    <FiClock /> Due: {new Date(item.dueDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Action Button */}
                                        {isAssignment ? (
                                            !item.submissions?.[0] ? (
                                                <button
                                                    onClick={() => { setSelectedAssignment(item); setShowSubmitModal(true); }}
                                                    style={{ width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                >
                                                    Submit Assignment <FiChevronRight />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => { if (item.submissions[0].status === 'REJECTED') { setSelectedAssignment(item); setShowSubmitModal(true); } }}
                                                    disabled={item.submissions[0].status !== 'REJECTED'}
                                                    style={{ width: '100%', padding: '10px', background: 'white', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '8px', fontWeight: 600, cursor: item.submissions[0].status === 'REJECTED' ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: item.submissions[0].status === 'REJECTED' ? 1 : 0.7 }}
                                                >
                                                    {item.submissions[0].status === 'REJECTED' ? 'Resubmit' : 'View Details'}
                                                </button>
                                            )
                                        ) : (
                                            canStartQuiz ? (
                                                <button
                                                    onClick={() => handleStartQuiz(item)}
                                                    style={{ width: '100%', padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                >
                                                    Start Quiz <FiMaximize />
                                                </button>
                                            ) : (
                                                <div style={{ width: '100%', padding: '10px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '8px', fontWeight: 600, textAlign: 'center', fontSize: '0.9rem' }}>
                                                    Completed
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                    <FiFileText size={48} style={{ marginBottom: '16px', color: '#94a3b8' }} />
                    <h3 style={{ margin: '0 0 8px', color: '#1e293b' }}>No content found</h3>
                    <p style={{ color: '#64748b', margin: 0 }}>Try adjusting your filters or search query.</p>
                </div>
            )}

            {/* Submit Assignment Modal */}
            <AnimatePresence>
                {showSubmitModal && selectedAssignment && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
                        onClick={() => setShowSubmitModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ background: 'white', borderRadius: '24px', padding: '32px', maxWidth: '600px', width: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                        >
                            <h2 style={{ margin: '0 0 8px', fontSize: '1.5rem', color: '#1e293b' }}>{selectedAssignment.title}</h2>
                            <p style={{ margin: '0 0 24px', color: '#64748b', lineHeight: '1.6' }}>{selectedAssignment.description}</p>

                            <form onSubmit={handleSubmitAssignment}>
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, color: '#334155' }}>File Submission</label>
                                    <div
                                        style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc', transition: 'all 0.2s' }}
                                        onClick={() => document.getElementById('file-upload').click()}
                                    >
                                        <input
                                            type="file"
                                            id="file-upload"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                            accept=".pdf,.doc,.docx,.ppt,.pptx"
                                        />
                                        <FiUpload size={32} style={{ color: '#94a3b8', marginBottom: '12px' }} />
                                        <div style={{ color: '#334155', fontWeight: 500, marginBottom: '4px' }}>
                                            {selectedFile ? selectedFile.name : 'Click to upload your work'}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            PDF, Word, or PowerPoint
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '32px' }}>
                                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, color: '#334155' }}>Comments (Optional)</label>
                                    <textarea
                                        style={{ width: '100%', minHeight: '120px', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem', resize: 'vertical' }}
                                        value={submissionContent}
                                        onChange={(e) => setSubmissionContent(e.target.value)}
                                        placeholder="Add any notes for your mentor..."
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <button type="button" onClick={() => setShowSubmitModal(false)} style={{ flex: 1, padding: '14px', background: 'white', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" style={{ flex: 1, padding: '14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={!selectedFile && !submissionContent}>
                                        <FiSend /> Submit Assignment
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentAssignmentSection;
