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
            if (isOverdue) return { status: 'Overdue', color: 'var(--color-error)', bg: 'var(--color-error-soft)', icon: <FiAlertCircle /> };
            return { status: 'Pending', color: 'var(--color-warning)', bg: 'var(--color-warning-soft)', icon: <FiClock /> };
        }
        if (submission.status === 'PENDING') return { status: 'Submitted', color: 'var(--color-primary)', bg: 'var(--color-primary-soft)', icon: <FiCheckCircle /> };
        if (submission.status === 'APPROVED' || submission.status === 'REVIEWED') {
            const marksStr = submission.marks !== null ? ` (${submission.marks}/${assignment.maxMarks})` : '';
            return { status: `Approved${marksStr}`, color: 'var(--color-success)', bg: 'var(--color-success-soft)', icon: <FiCheckCircle /> };
        }
        return { status: 'Rejected', color: 'var(--color-error)', bg: 'var(--color-error-soft)', icon: <FiAlertCircle /> };
    };

    const getQuizStatus = (quiz) => {
        if (!quiz.submission) {
            const isOverdue = new Date(quiz.dueDate) < new Date();
            if (isOverdue) return { status: 'Overdue', color: 'var(--color-error)', bg: 'var(--color-error-soft)', icon: <FiAlertCircle /> };
            return { status: 'Not Started', color: 'var(--text-muted)', bg: 'var(--bg-tertiary)', icon: <FiClock /> };
        }
        if (quiz.submission.status === 'IN_PROGRESS') return { status: 'In Progress', color: 'var(--color-warning)', bg: 'var(--color-warning-soft)', icon: <FiClock /> };
        if (quiz.submission.status === 'COMPLETED') return { status: `Score: ${quiz.submission.score}/${quiz.totalMarks}`, color: 'var(--color-success)', bg: 'var(--color-success-soft)', icon: <FiCheckCircle /> };
        return { status: 'Unknown', color: 'var(--text-muted)', bg: 'var(--bg-tertiary)', icon: <FiClock /> };
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

        if (isCurrent) return 'var(--color-primary)'; // Blue
        if (isMarked) return 'var(--color-secondary)'; // Purple
        if (isAnswered) return 'var(--color-success)'; // Green
        if (isVisited && !isAnswered) return 'var(--color-error)'; // Red (Visited but not answered)
        return 'var(--border-subtle)'; // Grey (Not Visited)
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
                    background: 'var(--bg-primary)',
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
                    background: 'var(--bg-tertiary)',
                    padding: '12px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--border-subtle)',
                    flexShrink: 0
                }}>
                    <h2 style={{ margin: 0, fontSize: 'var(--fs-h3)', color: 'var(--text-primary)', fontWeight: 'var(--fw-semibold)' }}>
                        Online Test - {quizData.title}
                    </h2>
                    <div style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)' }}>
                        Attempt 1
                    </div>
                </div>

                {/* Main Content: Split View */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                    {/* Left: Question Area */}
                    <div style={{ flex: 1, padding: '40px', overflowY: 'auto', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                                Question {currentQuestionIndex + 1}
                            </h3>
                        </div>

                        <div style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text-primary)', marginBottom: '32px' }}>
                            {currentQuestion.question}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                            {currentQuestion.options?.map((option, idx) => (
                                <label
                                    key={idx}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '16px', padding: '16px',
                                        background: answers[currentQuestion.id] === idx ? 'var(--color-primary-soft)' : 'var(--bg-secondary)',
                                        border: `1px solid ${answers[currentQuestion.id] === idx ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                        borderRadius: '8px', cursor: 'pointer', transition: 'all 0.1s'
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name={`question_${currentQuestion.id}`}
                                        checked={answers[currentQuestion.id] === idx}
                                        onChange={() => handleAnswerSelect(currentQuestion.id, idx)}
                                        style={{ accentColor: 'var(--color-primary)', width: '18px', height: '18px' }}
                                    />
                                    <span style={{ fontSize: 'var(--fs-body-lg)', color: 'var(--text-primary)' }}>{option}</span>
                                </label>
                            ))}
                        </div>

                        {/* Bottom Control Bar */}
                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={toggleMarkForReview}
                                    style={{
                                        padding: '10px 20px', background: markedForReview.has(currentQuestion.id) ? 'var(--color-secondary-dark)' : 'var(--color-secondary)',
                                        color: 'white', border: 'none', borderRadius: '24px', fontWeight: 'var(--fw-semibold)', cursor: 'pointer'
                                    }}
                                >
                                    {markedForReview.has(currentQuestion.id) ? 'Unmark Review' : 'Mark for Review'}
                                </button>
                                <button
                                    onClick={handleClearResponse}
                                    style={{
                                        padding: '10px 20px', background: 'transparent', color: 'var(--color-error)',
                                        border: '1px solid var(--color-error)', borderRadius: '24px', fontWeight: 'var(--fw-semibold)', cursor: 'pointer'
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
                                        padding: '10px 24px', background: 'var(--color-primary)', color: 'white', border: 'none',
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
                                        padding: '10px 24px', background: currentQuestionIndex === totalQuestions - 1 ? 'var(--color-success)' : 'var(--color-primary)',
                                        color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'var(--fw-semibold)', cursor: 'pointer'
                                    }}
                                >
                                    {currentQuestionIndex === totalQuestions - 1 ? 'Submit Test' : 'Next'}
                                </button>
                            </div>
                        </div>

                        {/* Legend */}
                        <div style={{ marginTop: '20px', display: 'flex', gap: '20px', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-primary)' }}></div> Current</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-success)' }}></div> Answered</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-error)' }}></div> Not Answered</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-secondary)' }}></div> Marked for Review</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--border-subtle)' }}></div> Not Visited</div>
                        </div>
                    </div>

                    {/* Right: Sidebar */}
                    <div style={{ width: '320px', background: 'var(--bg-primary)', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
                        {/* Timer Section */}
                        <div style={{ padding: '24px', background: 'var(--bg-tertiary)', textAlign: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
                            <div style={{ marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Time Left</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: timeLeft < 60 ? 'var(--color-error)' : 'var(--text-primary)', fontFamily: 'monospace' }}>
                                {formatTime(timeLeft)}
                            </div>
                        </div>

                        {/* User Info (Placeholder) */}
                        <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Section: General</div>
                        </div>

                        {/* Question Palette */}
                        <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
                            <h4 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: '1rem' }}>Question Palette</h4>
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
                                            color: getQuestionStatusColor(idx) === 'var(--border-subtle)' ? 'var(--text-secondary)' : 'white',
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

                        <div style={{ padding: '20px', borderTop: '1px solid var(--color-border)' }}>
                            <button
                                onClick={handleSubmitQuiz}
                                style={{
                                    width: '100%', padding: 'var(--space-20)', background: 'var(--color-success)', color: 'white',
                                    border: 'none', borderRadius: '24px', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-body-lg)',
                                    cursor: 'pointer', boxShadow: 'var(--shadow-md)'
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
                        background: 'var(--bg-secondary)', borderRadius: '16px', border: '2px solid var(--color-primary)'
                    }}
                >
                    <FiCheckCircle size={64} style={{ color: 'var(--color-success)', marginBottom: '20px' }} />
                    <h2 style={{ margin: '0 0 16px', color: 'var(--text-primary)' }}>Quiz Submitted!</h2>
                    <p style={{ fontSize: 'var(--fs-h2)', fontWeight: 'var(--fw-bold)', color: 'var(--color-primary)', margin: '0 0 8px' }}>
                        Your Score: {result.score}/{result.totalMarks}
                    </p>
                    <p style={{ color: 'var(--text-secondary)' }}>Redirecting to list...</p>
                </motion.div>
            </div>
        );
    }

    // 3. Default List Mode
    return (
        <div className="student-assignments-wrapper">
            <style>{`
            .student-assignments-wrapper {
                padding: var(--space-8) 0;
            }
            .sa-filter-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: var(--space-16);
                margin-bottom: var(--space-32);
                flex-wrap: wrap;
            }
            .sa-tab {
                padding: 10px 24px;
                border: none;
                background: transparent;
                border-radius: 12px;
                color: var(--text-secondary);
                font-size: var(--fs-body);
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .sa-tab.is-active {
                background: var(--color-surface);
                color: var(--color-primary);
                font-weight: 700;
                box-shadow: var(--shadow-md);
            }
            .sa-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                gap: 28px;
            }
            .sa-card {
                background: white;
                border: 1px solid rgba(226, 232, 240, 0.8);
                border-radius: 20px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
            }
            .sa-card:hover {
                transform: translateY(-8px);
                box-shadow: 0 12px 25px rgba(0, 0, 0, 0.08);
                border-color: rgba(99, 102, 241, 0.4);
            }
            .sa-card-header {
                height: 100px;
                padding: 24px;
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                position: relative;
            }
            .sa-card-header.assignment { 
                background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); 
            }
            .sa-card-header.quiz { 
                background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); 
            }
            .sa-card-header-badge {
                background: rgba(255, 255, 255, 0.15);
                backdrop-filter: blur(8px);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.2);
                padding: 4px 12px;
                border-radius: 30px;
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.5px;
            }
            .sa-card-icon-wrap {
                background: white;
                width: 44px;
                height: 44px;
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
                transform: translateY(12px);
            }
            .sa-card-body {
                padding: 32px 24px 24px;
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            .sa-card-title {
                font-size: 1.15rem;
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 12px;
                line-height: 1.4;
            }
            .sa-card-desc {
                font-size: 0.95rem;
                color: #64748b;
                margin-bottom: 24px;
                line-height: 1.6;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            .sa-meta {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
                margin-top: auto;
                margin-bottom: 24px;
            }
            .sa-badge {
                padding: 6px 12px;
                border-radius: 8px;
                font-size: 0.8rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .sa-modal-overlay {
                position: fixed;
                inset: 0;
                background: rgba(15, 23, 42, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                padding: var(--space-24);
                backdrop-filter: blur(10px);
            }
            .sa-modal-card {
                background: white;
                border-radius: 28px;
                padding: 40px;
                width: 100%;
                max-width: 620px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            }
            `}</style>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Top Bar: Tabs Only */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '12px', background: 'var(--bg-primary)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
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
                                    background: activeTab === tab.id ? 'var(--color-surface)' : 'transparent',
                                    color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--text-muted)',
                                    fontWeight: activeTab === tab.id ? 700 : 500,
                                    boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
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
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: '20px',
                                    overflow: 'hidden',
                                    boxShadow: 'var(--shadow-sm)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '100%',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative',
                                    userSelect: 'none'
                                }}
                                whileHover={{ y: -8, boxShadow: 'var(--shadow-lg)', borderColor: 'var(--color-primary)' }}
                            >
                                {/* Type Ribbon */}
                                <div style={{
                                    position: 'absolute', top: '12px', right: '12px', zIndex: 5,
                                    padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                                    background: isAssignment ? 'var(--color-primary-soft)' : 'var(--color-success-soft)',
                                    color: isAssignment ? 'var(--color-primary)' : 'var(--color-success)',
                                    letterSpacing: '0.05em'
                                }}>
                                    {item.type}
                                </div>

                                <div style={{ padding: '24px 24px 16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div style={{ padding: '12px', background: isAssignment ? 'var(--color-primary-soft)' : 'var(--color-success-soft)', borderRadius: '14px', color: isAssignment ? 'var(--color-primary)' : 'var(--color-success)' }}>
                                            {isAssignment ? <FiFileText size={22} /> : <FiClock size={22} />}
                                        </div>
                                    </div>
                                    <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>{item.title}</h3>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.8rem' }}>
                                        {item.description}
                                    </p>
                                </div>

                                <div style={{ padding: '0 24px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        <FiCalendar />
                                        <span>Deadline: {new Date(item.dueDate).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, ...statusInfo }}>
                                        <span style={{ fontSize: '1.1rem' }}>{statusInfo.icon}</span>
                                        <span>{statusInfo.status}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ padding: '0 24px 24px' }}>
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
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ width: '100%' }}
                                                    onClick={() => {
                                                        const sub = item.submissions[0];
                                                        if (sub.content.startsWith('/uploads/')) {
                                                            window.open(`${import.meta.env.VITE_API_BASE}${sub.content}`, '_blank');
                                                        } else {
                                                            alert(`Your submission: ${sub.content}`);
                                                        }
                                                    }}
                                                >
                                                    View My Submission
                                                </button>
                                                {item.submissions[0].status === 'REJECTED' && (
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{ width: '100%' }}
                                                        onClick={() => { setSelectedAssignment(item); setShowSubmitModal(true); }}
                                                    >
                                                        Resubmit
                                                    </button>
                                                )}
                                            </div>
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
                <div style={{ textAlign: 'center', padding: '60px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px dashed var(--border-subtle)' }}>
                    <FiFileText size={48} style={{ marginBottom: '16px', color: 'var(--text-muted)' }} />
                    <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>No content found</h3>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Try adjusting your filters or search query.</p>
                </div>
            )}

            {/* Submit Modal */}
            <AnimatePresence>
                {showSubmitModal && selectedAssignment && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
                        onClick={() => setShowSubmitModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ background: 'var(--bg-secondary)', borderRadius: '24px', padding: '32px', maxWidth: '600px', width: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: 'var(--admin-shadow-xl)', border: '1px solid var(--border-subtle)' }}
                        >
                            <h2 style={{ margin: '0 0 8px', fontSize: '1.5rem', color: 'var(--text-primary)' }}>{selectedAssignment.title}</h2>
                            <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{selectedAssignment.description}</p>

                            <form onSubmit={handleSubmitAssignment}>
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, color: 'var(--text-primary)' }}>File Submission</label>
                                    <div
                                        style={{ border: '2px dashed var(--border-subtle)', borderRadius: '12px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-tertiary)', transition: 'all 0.2s' }}
                                        onClick={() => document.getElementById('file-upload').click()}
                                    >
                                        <input
                                            type="file"
                                            id="file-upload"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                            accept=".pdf,.doc,.docx,.ppt,.pptx"
                                        />
                                        <FiUpload size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                                        <div style={{ color: 'var(--text-primary)', fontWeight: 500, marginBottom: '4px' }}>
                                            {selectedFile ? selectedFile.name : 'Click to upload your work'}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '32px' }}>
                                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, color: 'var(--text-primary)' }}>Comments (Optional)</label>
                                    <textarea
                                        style={{ width: '100%', minHeight: '120px', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '1rem', resize: 'vertical' }}
                                        value={submissionContent}
                                        onChange={(e) => setSubmissionContent(e.target.value)}
                                        placeholder="Add notes for your mentor..."
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <button type="button" onClick={() => setShowSubmitModal(false)} style={{ flex: 1, padding: '14px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" style={{ flex: 1, padding: '14px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={!selectedFile && !submissionContent}>
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
