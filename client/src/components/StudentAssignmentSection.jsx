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
            return { status: 'Not Started', color: 'var(--color-text-)', bg: '#f1f5f9', icon: <FiClock /> };
        }
        if (quiz.submission.status === 'IN_PROGRESS') return { status: 'In Progress', color: '#d97706', bg: '#fef3c7', icon: <FiClock /> };
        if (quiz.submission.status === 'COMPLETED') return { status: `Score: ${quiz.submission.score}/${quiz.totalMarks}`, color: '#059669', bg: '#d1fae5', icon: <FiCheckCircle /> };
        return { status: 'Unknown', color: 'var(--color-text-)', bg: '#f1f5f9', icon: <FiClock /> };
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

    // --- Extended Quiz State ---
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [markedForReview, setMarkedForReview] = useState(new Set());
    const [visitedQuestions, setVisitedQuestions] = useState(new Set([0]));

    // Update visited questions when index changes
    useEffect(() => {
        if (activeQuiz) {
            setVisitedQuestions(prev => new Set(prev).add(currentQuestionIndex));
        }
    }, [currentQuestionIndex, activeQuiz]);

    // Helper to get question status color for palette
    const getQuestionStatusColor = (idx) => {
        const questionId = quizData.questions[idx].id;
        const isAnswered = answers[questionId] !== undefined;
        const isMarked = markedForReview.has(questionId);
        const isCurrent = currentQuestionIndex === idx;
        const isVisited = visitedQuestions.has(idx);

        if (isCurrent) return '#3b82f6'; // Blue
        if (isMarked) return '#8b5cf6'; // Purple
        if (isAnswered) return '#10b981'; // Green
        if (isVisited && !isAnswered) return '#ef4444'; // Red (Visited but not answered)
        return '#cbd5e1'; // Grey (Not Visited)
    };

    const toggleMarkForReview = () => {
        const questionId = quizData.questions[currentQuestionIndex].id;
        setMarkedForReview(prev => {
            const newSet = new Set(prev);
            if (newSet.has(questionId)) {
                newSet.delete(questionId);
            } else {
                newSet.add(questionId);
            }
            return newSet;
        });
    };

    const handleClearResponse = () => {
        const questionId = quizData.questions[currentQuestionIndex].id;
        const newAnswers = { ...answers };
        delete newAnswers[questionId];
        setAnswers(newAnswers);
    };

    // 1. Quiz Player Mode (Redesigned)
    if (activeQuiz && quizData && !showResult) {
        const currentQuestion = quizData.questions[currentQuestionIndex];
        const totalQuestions = quizData.questions.length;

        return (
            <div
                ref={quizContainerRef}
                style={{
                    position: isFullScreen ? 'fixed' : 'relative',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: '#f1f5f9',
                    zIndex: isFullScreen ? 9999 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: isFullScreen ? '100vh' : '85vh',
                    overflow: 'hidden'
                }}
                onContextMenu={(e) => e.preventDefault()}
            >
                {/* Header */}
                <div style={{
                    background: '#e2e8f0',
                    padding: '12px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #cbd5e1',
                    flexShrink: 0
                }}>
                    <h2 style={{ margin: 0, fontSize: 'var(--fs-h3)', color: '#1e293b', fontWeight: 'var(--fw-semibold)' }}>
                        Online Test - {quizData.title}
                    </h2>
                    <div style={{ fontSize: 'var(--fs-body)', color: 'var(--color-text-)' }}>
                        Attempt 1
                    </div>
                </div>

                {/* Main Content: Split View */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                    {/* Left: Question Area */}
                    <div style={{ flex: 1, padding: '40px', overflowY: 'auto', background: 'white', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: 'var(--fs-h3)', color: '#1e293b' }}>
                                Question {currentQuestionIndex + 1}
                            </h3>
                        </div>

                        <div style={{ fontSize: 'var(--fs-h3)', lineHeight: '1.6', color: 'var(--color-text-)', marginBottom: '32px' }}>
                            {currentQuestion.question}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                            {currentQuestion.options?.map((option, idx) => (
                                <label
                                    key={idx}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '16px', padding: 'var(--space-24)',
                                        background: answers[currentQuestion.id] === idx ? '#eff6ff' : 'white',
                                        border: `1px solid ${answers[currentQuestion.id] === idx ? '#3b82f6' : '#cbd5e1'}`,
                                        borderRadius: '8px', cursor: 'pointer', transition: 'all 0.1s'
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name={`question_${currentQuestion.id}`}
                                        checked={answers[currentQuestion.id] === idx}
                                        onChange={() => handleAnswerSelect(currentQuestion.id, idx)}
                                        style={{ accentColor: '#3b82f6', width: '18px', height: '18px' }}
                                    />
                                    <span style={{ fontSize: 'var(--fs-body-lg)', color: 'var(--color-text-)' }}>{option}</span>
                                </label>
                            ))}
                        </div>

                        {/* Bottom Control Bar */}
                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={toggleMarkForReview}
                                    style={{
                                        padding: '10px 20px', background: markedForReview.has(currentQuestion.id) ? '#7c3aed' : '#8b5cf6',
                                        color: 'white', border: 'none', borderRadius: '24px', fontWeight: 'var(--fw-semibold)', cursor: 'pointer'
                                    }}
                                >
                                    {markedForReview.has(currentQuestion.id) ? 'Unmark Review' : 'Mark for Review'}
                                </button>
                                <button
                                    onClick={handleClearResponse}
                                    style={{
                                        padding: '10px 20px', background: 'transparent', color: '#ef4444',
                                        border: '1px solid #ef4444', borderRadius: '24px', fontWeight: 'var(--fw-semibold)', cursor: 'pointer'
                                    }}
                                >
                                    Clear Response
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                    disabled={currentQuestionIndex === 0}
                                    style={{
                                        padding: '10px 24px', background: '#3b82f6', color: 'white', border: 'none',
                                        borderRadius: '6px', fontWeight: 'var(--fw-semibold)', cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                                        opacity: currentQuestionIndex === 0 ? 0.5 : 1
                                    }}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => {
                                        if (currentQuestionIndex < totalQuestions - 1) {
                                            setCurrentQuestionIndex(prev => prev + 1);
                                        } else {
                                            handleSubmitQuiz();
                                        }
                                    }}
                                    style={{
                                        padding: '10px 24px', background: currentQuestionIndex === totalQuestions - 1 ? '#10b981' : '#3b82f6',
                                        color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'var(--fw-semibold)', cursor: 'pointer'
                                    }}
                                >
                                    {currentQuestionIndex === totalQuestions - 1 ? 'Submit Test' : 'Next'}
                                </button>
                            </div>
                        </div>

                        {/* Legend */}
                        <div style={{ marginTop: '20px', display: 'flex', gap: '20px', fontSize: 'var(--fs-small)', color: 'var(--color-text-)', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }}></div> Current</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div> Answered</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></div> Not Answered</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#8b5cf6' }}></div> Marked for Review</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#cbd5e1' }}></div> Not Visited</div>
                        </div>
                    </div>

                    {/* Right: Sidebar */}
                    <div style={{ width: '320px', background: '#f8fafc', borderLeft: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column' }}>
                        {/* Timer Section */}
                        <div style={{ padding: '24px', background: '#e2e8f0', textAlign: 'center', borderBottom: '1px solid #cbd5e1' }}>
                            <div style={{ marginBottom: '8px', fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-)' }}>Time Left</div>
                            <div style={{ fontSize: 'var(--fs-h1)', fontWeight: 'var(--fw-bold)', color: timeLeft < 60 ? '#dc2626' : '#1e293b', fontFamily: 'monospace' }}>
                                {formatTime(timeLeft)}
                            </div>
                        </div>

                        {/* User Info (Placeholder) */}
                        <div style={{ padding: 'var(--space-24)', background: '#e2e8f0', borderBottom: '1px solid #cbd5e1', marginBottom: '16px' }}>
                            <div style={{ fontWeight: 'var(--fw-bold)', color: '#1e293b' }}>Section: General</div>
                        </div>

                        {/* Question Palette */}
                        <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
                            <h4 style={{ margin: '0 0 16px', color: '#1e293b', fontSize: 'var(--fs-body-lg)' }}>Question Palette</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                {quizData.questions.map((q, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentQuestionIndex(idx)}
                                        style={{
                                            aspectRatio: '1',
                                            borderRadius: '4px',
                                            border: 'none',
                                            background: getQuestionStatusColor(idx),
                                            color: getQuestionStatusColor(idx) === '#cbd5e1' ? '#475569' : 'white',
                                            fontWeight: 'var(--fw-semibold)',
                                            fontSize: 'var(--fs-body-lg)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            position: 'relative' // For polygon shape if needed, but square/rounded is standard
                                        }}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ padding: '20px', borderTop: '1px solid #cbd5e1' }}>
                            <button
                                onClick={handleSubmitQuiz}
                                style={{
                                    width: '100%', padding: 'var(--space-20)', background: '#10b981', color: 'white',
                                    border: 'none', borderRadius: '24px', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-body-lg)',
                                    cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                Submit Test
                            </button>
                        </div>
                    </div>
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
                    <p style={{ fontSize: 'var(--fs-h2)', fontWeight: 'var(--fw-bold)', color: '#3b82f6', margin: '0 0 8px' }}>
                        Your Score: {result.score}/{result.totalMarks}
                    </p>
                    <p style={{ color: 'var(--color-text-)' }}>Redirecting to list...</p>
                </motion.div>
            </div>
        );
    }

    // 3. Default List Mode
    return (
        <div className="student-assignments-wrapper">
            <style>{`
            .student-assignments-wrapper {
                padding: var(--space-24) 0;
            }
            .sa-filter-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: var(--space-16);
                margin-bottom: var(--space-24);
                flex-wrap: wrap;
            }
            .sa-tabs {
                display: flex;
                gap: var(--space-8);
                background: var(--color-bg);
                padding: var(--space-4);
                border-radius: var(--radius-md);
                border: 1px solid var(--color-border);
            }
            .sa-tab {
                padding: 6px 16px;
                border: none;
                background: transparent;
                border-radius: var(--radius-md);
                color: 'var(--color-text-)'
                font-size: var(--fs-body);
                font-weight: var(--fw-medium);
                cursor: pointer;
                transition: all var(--transition-fast);
            }
            .sa-tab.is-active {
                background: var(--color-surface);
                color: 'var(--color-)'
                font-weight: var(--fw-semibold);
                box-shadow: var(--shadow-sm);
            }
            .sa-search {
                position: relative;
                min-width: 280px;
            }
            .sa-search input {
                padding-left: 36px;
            }
            .sa-search-icon {
                position: absolute;
                left: 12px;
                top: 50%;
                transform: translateY(-50%);
                color: 'var(--color-text-)'
            }
            .sa-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                gap: var(--space-24);
            }
            .sa-card {
                display: flex;
                flex-direction: column;
                padding: 0;
                overflow: hidden;
            }
            .sa-card-header {
                height: 120px;
                padding: var(--space-20);
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                position: relative;
            }
            .sa-card-header.assignment { background: linear-gradient(135deg, var(--color-primary) 0%, #3730A3 100%); }
            .sa-card-header.quiz { background: linear-gradient(135deg, var(--color-success) 0%, #059669 100%); }
            .sa-card-header-badge {
                background: rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(4px);
                color: white;
            }
            .sa-card-icon-wrap {
                background: var(--color-surface);
                padding: 8px;
                border-radius: var(--radius-md);
                box-shadow: var(--shadow-sm);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .sa-card-body {
                padding: var(--space-20);
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            .sa-card-title {
                font-size: var(--fs-h3);
                margin-bottom: var(--space-8);
            }
            .sa-card-desc {
                font-size: var(--fs-body);
                color: 'var(--color-text-)'
                margin-bottom: var(--space-16);
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            .sa-meta {
                display: flex;
                gap: var(--space-8);
                flex-wrap: wrap;
                margin-top: auto;
                margin-bottom: var(--space-16);
            }
            .sa-modal-overlay {
                position: fixed;
                inset: 0;
                background: rgba(15, 23, 42, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                padding: var(--space-24);
                backdrop-filter: blur(4px);
            }
            .sa-modal-card {
                background: var(--color-surface);
                border-radius: var(--radius-lg);
                padding: var(--space-32);
                width: 100%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: var(--shadow-premium);
            }
            `}</style>

            {/* Top Bar: Tabs & Search */}
            <div className="sa-filter-bar">
                <div className="sa-tabs">
                    {[
                        { id: 'all', label: 'All Items' },
                        { id: 'assignments', label: 'Assignments' },
                        { id: 'quizzes', label: 'Quizzes' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`sa-tab ${activeTab === tab.id ? 'is-active' : ''}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="sa-search">
                    <FiSearch className="sa-search-icon" />
                    <input
                        type="text"
                        className="input"
                        placeholder="Search assignments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="sa-grid">
                    {[1, 2, 3].map(i => <div key={i} className="card skeleton" style={{ height: 260 }} />)}
                </div>
            ) : filteredContent().length > 0 ? (
                <div className="sa-grid">
                    {filteredContent().map((item, index) => {
                        const isAssignment = item.type === 'assignment';
                        const statusInfo = isAssignment ? getStatusInfo(item) : getQuizStatus(item);
                        const canStartQuiz = !isAssignment && (!item.submission || item.submission.status !== 'COMPLETED');

                        return (
                            <motion.div
                                key={`${item.type}-${item.id}`}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="card sa-card"
                            >
                                <div className={`sa-card-header ${isAssignment ? 'assignment' : 'quiz'}`}>
                                    <span className="badge sa-card-header-badge">
                                        {isAssignment ? 'ASSIGNMENT' : 'QUIZ'}
                                    </span>
                                    <div className="sa-card-icon-wrap" style={{ color: isAssignment ? 'var(--color-primary)' : 'var(--color-success)' }}>
                                        {isAssignment ? <FiFileText size={20} /> : <FiCheckCircle size={20} />}
                                    </div>
                                </div>

                                <div className="sa-card-body">
                                    <h3 className="sa-card-title">{item.title}</h3>
                                    <p className="sa-card-desc">{item.description}</p>

                                    <div className="sa-meta">
                                        <span className="badge" style={{ background: statusInfo.bg, color: statusInfo.color }}>
                                            {statusInfo.status}
                                        </span>
                                        {item.dueDate && (
                                            <span className="badge" style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}>
                                                Due: {new Date(item.dueDate).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    {isAssignment ? (
                                        !item.submissions?.[0] ? (
                                            <button
                                                className="btn btn-primary"
                                                style={{ width: '100%' }}
                                                onClick={() => { setSelectedAssignment(item); setShowSubmitModal(true); }}
                                            >
                                                Submit Assignment
                                            </button>
                                        ) : (
                                            <button
                                                className={`btn ${item.submissions[0].status === 'REJECTED' ? 'btn-primary' : 'btn-secondary'}`}
                                                style={{ width: '100%' }}
                                                disabled={item.submissions[0].status !== 'REJECTED'}
                                                onClick={() => { if (item.submissions[0].status === 'REJECTED') { setSelectedAssignment(item); setShowSubmitModal(true); } }}
                                            >
                                                {item.submissions[0].status === 'REJECTED' ? 'Resubmit' : 'Submitted'}
                                            </button>
                                        )
                                    ) : (
                                        canStartQuiz ? (
                                            <button
                                                className="btn btn-primary"
                                                style={{ width: '100%', background: 'var(--color-success)' }}
                                                onClick={() => handleStartQuiz(item)}
                                            >
                                                Start Quiz
                                            </button>
                                        ) : (
                                            <button className="btn btn-secondary" style={{ width: '100%' }} disabled>
                                                Completed
                                            </button>
                                        )
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="card" style={{ padding: '64px', textAlign: 'center', background: 'var(--color-bg)', borderStyle: 'dashed' }}>
                    <FiFileText size={48} style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }} />
                    <h4>No assignments found</h4>
                    <p>Try adjusting your search criteria.</p>
                </div>
            )}

            {/* Submit Modal */}
            <AnimatePresence>
                {showSubmitModal && selectedAssignment && (
                    <div className="sa-modal-overlay" onClick={() => setShowSubmitModal(false)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="sa-modal-card"
                        >
                            <h2 style={{ marginBottom: '8px' }}>{selectedAssignment.title}</h2>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>{selectedAssignment.description}</p>

                            <form onSubmit={handleSubmitAssignment}>
                                <div className="input-group">
                                    <label>File Submission</label>
                                    <div
                                        style={{ border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', padding: '32px', textAlign: 'center', cursor: 'pointer', background: 'var(--color-bg)' }}
                                        onClick={() => document.getElementById('file-upload').click()}
                                    >
                                        <input
                                            type="file"
                                            id="file-upload"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                            accept=".pdf,.doc,.docx,.ppt,.pptx"
                                        />
                                        <FiUpload size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }} />
                                        <div style={{ fontWeight: 'var(--fw-semibold)' }}>
                                            {selectedFile ? selectedFile.name : 'Click to upload your work'}
                                        </div>
                                    </div>
                                </div>

                                <div className="input-group" style={{ marginBottom: '24px' }}>
                                    <label>Comments (Optional)</label>
                                    <textarea
                                        className="textarea"
                                        style={{ minHeight: '120px', resize: 'vertical' }}
                                        value={submissionContent}
                                        onChange={(e) => setSubmissionContent(e.target.value)}
                                        placeholder="Add notes for your mentor..."
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowSubmitModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={!selectedFile && !submissionContent}>
                                        <FiSend /> Submit
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentAssignmentSection;
