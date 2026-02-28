import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    useMentorAssignments,
    useMentorBatches,
    useCreateAssignment,
    useMentorQuizzes,
    useCreateQuiz
} from '../../../hooks/mentor/useMentorQueries';
import {
    ClipboardList, PlusSquare, X, Calendar, Target, Layout, Filter, ArrowRight,
    HelpCircle, BookOpen, Clock, AlertCircle, CheckCircle2, MoreVertical, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiErrorMessage } from '../../../api';
import '../../../components/admin/Modal.css';

// --- MODALS ---

const CreateAssignmentModal = ({ batchId, batches, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [maxMarks, setMaxMarks] = useState(100);
    const [selectedBatchId, setSelectedBatchId] = useState(batchId || '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const createAssignment = useCreateAssignment();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!selectedBatchId) {
                setError('Please select a target batch.');
                setLoading(false);
                return;
            }

            const parsedDate = new Date(dueDate);
            if (isNaN(parsedDate.getTime())) {
                setError('Please provide a valid deadline.');
                setLoading(false);
                return;
            }

            if (parsedDate < new Date()) {
                setError('Deadline cannot be set in the past.');
                setLoading(false);
                return;
            }

            await createAssignment.mutateAsync({
                title,
                description,
                batchId: selectedBatchId,
                dueDate: parsedDate.toISOString(),
                maxMarks: Number(maxMarks)
            });

            onSuccess();
            onClose();
        } catch (err) {
            setError(getApiErrorMessage(err, 'Failed to create assignment. Please try again.'));
            setLoading(false);
        }
    };

    return createPortal(
        <AnimatePresence>
            <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{ zIndex: 1000 }}
            >
                <motion.div
                    className="glass-modal"
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ maxWidth: '550px', width: '95%', borderRadius: 'var(--radius-2xl)' }}
                >
                    <div className="modal-header" style={{ padding: 'var(--space-20) var(--space-24)' }}>
                        <h2 style={{ fontSize: 'var(--fs-h3)', margin: 0 }}>Issue New Task</h2>
                        <button type="button" className="m-btn m-btn--ghost" onClick={onClose} aria-label="Close" style={{ padding: '8px', minHeight: 'unset' }}>
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                        <div className="modal-body" style={{ padding: 'var(--space-24)' }}>
                            {error && (
                                <div className="m-badge m-badge--error" style={{ width: '100%', marginBottom: 'var(--space-16)', padding: 'var(--space-12)', borderRadius: 'var(--radius-md)', justifyContent: 'center' }}>
                                    {error}
                                </div>
                            )}

                            <div className="m-form-group" style={{ marginBottom: 'var(--space-16)' }}>
                                <label style={{ display: 'block', fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-medium)', marginBottom: 'var(--space-8)', color: 'var(--text-secondary)' }}>Target Batch *</label>
                                <select
                                    className="m-select"
                                    value={selectedBatchId}
                                    onChange={(e) => setSelectedBatchId(e.target.value)}
                                    required
                                    style={{ width: '100%' }}
                                >
                                    <option value="">Choose a batch...</option>
                                    {(batches || []).map((b) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="m-form-group" style={{ marginBottom: 'var(--space-16)' }}>
                                <label style={{ display: 'block', fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-medium)', marginBottom: 'var(--space-8)', color: 'var(--text-secondary)' }}>Assignment Title *</label>
                                <input
                                    type="text"
                                    className="m-search-input"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Full Stack Portfolio Project"
                                    required
                                    style={{ width: '100%', paddingLeft: 'var(--space-16)' }}
                                />
                            </div>

                            <div className="m-form-group" style={{ marginBottom: 'var(--space-16)' }}>
                                <label style={{ display: 'block', fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-medium)', marginBottom: 'var(--space-8)', color: 'var(--text-secondary)' }}>Project Requirements *</label>
                                <textarea
                                    className="m-search-input"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Provide detailed instructions and evaluation criteria..."
                                    rows={4}
                                    style={{ width: '100%', padding: 'var(--space-12) var(--space-16)', minHeight: '120px', resize: 'none' }}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-16)' }}>
                                <div className="m-form-group">
                                    <label style={{ display: 'block', fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-medium)', marginBottom: 'var(--space-8)', color: 'var(--text-secondary)' }}>Submission Deadline *</label>
                                    <input
                                        type="date"
                                        className="m-search-input"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                        style={{ width: '100%', paddingLeft: 'var(--space-16)' }}
                                    />
                                </div>
                                <div className="m-form-group">
                                    <label style={{ display: 'block', fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-medium)', marginBottom: 'var(--space-8)', color: 'var(--text-secondary)' }}>Maximum Score</label>
                                    <input
                                        type="number"
                                        className="m-search-input"
                                        value={maxMarks}
                                        onChange={(e) => setMaxMarks(e.target.value)}
                                        min={1}
                                        max={100}
                                        required
                                        style={{ width: '100%', paddingLeft: 'var(--space-16)' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions" style={{ padding: 'var(--space-20) var(--space-24)', borderTop: '1px solid var(--color-border)' }}>
                            <button type="button" className="m-btn m-btn--ghost" onClick={onClose}>
                                Save as Draft
                            </button>
                            <button type="submit" className="m-btn m-btn--primary" disabled={loading} style={{ marginLeft: 'auto' }}>
                                {loading ? 'Deploying...' : 'Publish Task'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

const CreateQuizModal = ({ batchId, batches, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [timeLimit, setTimeLimit] = useState(30);
    const [selectedBatchId, setSelectedBatchId] = useState(batchId || '');
    const [questions, setQuestions] = useState([{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const createQuiz = useCreateQuiz();

    const addQuestion = () => {
        setQuestions([...questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
    };

    const removeQuestion = (index) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuestions(newQuestions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!selectedBatchId) throw new Error('Please select a batch.');
            if (questions.some(q => !q.question || q.options.some(o => !o))) {
                throw new Error('Please fill all question details.');
            }

            await createQuiz.mutateAsync({
                title,
                description,
                batchId: selectedBatchId,
                timeLimit: Number(timeLimit),
                questions
            });

            onSuccess();
            onClose();
        } catch (err) {
            setError(getApiErrorMessage(err, 'Failed to create quiz.'));
            setLoading(false);
        }
    };

    return createPortal(
        <AnimatePresence>
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ zIndex: 1100 }}>
                <motion.div
                    className="glass-modal"
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                >
                    <div className="modal-header" style={{ padding: 'var(--space-20) var(--space-24)' }}>
                        <h2>Create Assessment Quiz</h2>
                        <button type="button" className="m-btn m-btn--ghost" onClick={onClose} style={{ padding: '8px' }}><X size={20} /></button>
                    </div>

                    <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <div className="modal-body" style={{ padding: 'var(--space-24)', overflowY: 'auto' }}>
                            {error && <div className="m-badge m-badge--error" style={{ width: '100%', marginBottom: 'var(--space-16)', padding: '12px' }}>{error}</div>}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div className="m-form-group">
                                    <label className="m-label">Target Batch *</label>
                                    <select className="m-select" value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)} required>
                                        <option value="">Select Batch...</option>
                                        {batches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="m-form-group">
                                    <label className="m-label">Time Limit (Minutes) *</label>
                                    <input type="number" className="m-search-input" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} placeholder="e.g. 30" required />
                                </div>
                            </div>

                            <div className="m-form-group" style={{ marginBottom: '16px' }}>
                                <label className="m-label">Quiz Title *</label>
                                <input type="text" className="m-search-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. React Fundamentals Quiz" required />
                            </div>

                            <div className="m-form-group" style={{ marginBottom: '24px' }}>
                                <label className="m-label">Overview / Legend</label>
                                <textarea className="m-search-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the quiz..." rows={2} />
                            </div>

                            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ margin: 0, fontSize: 'var(--fs-body-lg)' }}>Questions ({questions.length})</h3>
                                    <button type="button" className="m-btn m-btn--secondary" onClick={addQuestion} style={{ padding: '4px 12px', fontSize: 'var(--fs-small)' }}>
                                        <PlusSquare size={16} /> Add Question
                                    </button>
                                </div>

                                {questions.map((q, qIdx) => (
                                    <div key={qIdx} style={{ background: 'var(--color-surface-muted)', padding: '20px', borderRadius: 'var(--radius-xl)', marginBottom: '16px', border: '1px solid var(--color-border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <span style={{ fontWeight: 'var(--fw-bold)', fontSize: '12px', color: 'var(--color-primary)' }}>QUESTION {qIdx + 1}</span>
                                            {questions.length > 1 && (
                                                <button type="button" onClick={() => removeQuestion(qIdx)} style={{ color: 'var(--color-error)', background: 'none' }}><Trash2 size={16} /></button>
                                            )}
                                        </div>
                                        <input
                                            className="m-search-input"
                                            style={{ marginBottom: '16px', background: 'var(--color-surface)' }}
                                            value={q.question}
                                            onChange={(e) => handleQuestionChange(qIdx, 'question', e.target.value)}
                                            placeholder="Enter question text..."
                                        />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            {q.options.map((opt, oIdx) => (
                                                <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input
                                                        type="radio"
                                                        name={`correct-${qIdx}`}
                                                        checked={q.correctAnswer === oIdx}
                                                        onChange={() => handleQuestionChange(qIdx, 'correctAnswer', oIdx)}
                                                    />
                                                    <input
                                                        className="m-search-input"
                                                        style={{ background: 'var(--color-surface)', height: '36px', fontSize: 'var(--fs-small)' }}
                                                        value={opt}
                                                        onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                                                        placeholder={`Option ${oIdx + 1}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="modal-actions" style={{ padding: 'var(--space-20) var(--space-24)', borderTop: '1px solid var(--color-border)' }}>
                            <button type="button" className="m-btn m-btn--ghost" onClick={onClose}>Cancel</button>
                            <button type="submit" className="m-btn m-btn--primary" disabled={loading} style={{ marginLeft: 'auto' }}>
                                {loading ? 'Creating Quiz...' : 'Finalize & Publish Quiz'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

// --- MAIN COMPONENT ---

const AssignmentsList = () => {
    const { data: batches } = useMentorBatches();
    const [selectedBatch, setSelectedBatch] = useState('');
    const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' | 'quizzes'
    const [showCreateModal, setShowCreateModal] = useState(false);

    const initialSetDone = useRef(false);

    useEffect(() => {
        if (initialSetDone.current || !batches || batches.length === 0) return;
        initialSetDone.current = true;
        setSelectedBatch(batches[0].id);
    }, [batches]);

    const { data: assignmentsData, isLoading: isLoadingAssignments, isError: isAssignError, refetch: refetchAssign } = useMentorAssignments(selectedBatch);
    const { data: quizzesData, isLoading: isLoadingQuizzes, isError: isQuizError, refetch: refetchQuizzes } = useMentorQuizzes(selectedBatch);

    const assignments = Array.isArray(assignmentsData) ? assignmentsData : [];
    const quizzes = Array.isArray(quizzesData) ? quizzesData : [];

    const handleSuccess = () => {
        if (activeTab === 'assignments') refetchAssign();
        else refetchQuizzes();
    };

    if (isAssignError || isQuizError) {
        return (
            <div className="m-section">
                <div className="m-empty-state">
                    <AlertCircle size={48} style={{ opacity: 0.2 }} />
                    <h3 className="m-empty-state__title">Data Sync Error</h3>
                    <p className="m-empty-state__desc">We couldn't synchronize your academic records. Please try reconnecting.</p>
                    <button className="m-btn m-btn--primary" onClick={() => window.location.reload()}>Retry Sync</button>
                </div>
            </div>
        );
    }

    return (
        <div className="m-section">
            <header className="mentor-page-header">
                <div>
                    <h2 className="mentor-page-title">Curriculum & Assessments</h2>
                    <p className="mentor-page-subtitle">Publish tasks, host quizzes, and monitor student performance benchmarks.</p>
                </div>
                <div className="mentor-header-actions">
                    <button
                        className="m-btn m-btn--primary shadow-sm"
                        disabled={!selectedBatch}
                        onClick={() => setShowCreateModal(true)}
                    >
                        {activeTab === 'assignments' ? (
                            <><PlusSquare size={18} /> Issue New Task</>
                        ) : (
                            <><HelpCircle size={18} /> Create New Quiz</>
                        )}
                    </button>
                </div>
            </header>

            {/* TAB NAVIGATION */}
            <div style={{ display: 'flex', gap: 'var(--space-8)', marginBottom: 'var(--space-16)', background: 'var(--color-surface-muted)', padding: '6px', borderRadius: 'var(--radius-lg)', width: 'fit-content' }}>
                <button
                    onClick={() => setActiveTab('assignments')}
                    className={`m-btn ${activeTab === 'assignments' ? 'm-btn--secondary' : 'm-btn--ghost'}`}
                    style={{ minHeight: '36px', padding: '0 20px', borderRadius: 'var(--radius-md)' }}
                >
                    <ClipboardList size={16} /> Assignments
                </button>
                <button
                    onClick={() => setActiveTab('quizzes')}
                    className={`m-btn ${activeTab === 'quizzes' ? 'm-btn--secondary' : 'm-btn--ghost'}`}
                    style={{ minHeight: '36px', padding: '0 20px', borderRadius: 'var(--radius-md)' }}
                >
                    <HelpCircle size={16} /> Quizzes
                </button>
            </div>

            <div className="m-card" style={{ padding: 'var(--space-16)', marginBottom: 'var(--space-20)', border: '1px dashed var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-16)', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                        <Layout size={18} />
                        <span style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-medium)' }}>Active Filter:</span>
                    </div>
                    <select
                        className="m-select"
                        value={selectedBatch}
                        onChange={(e) => setSelectedBatch(e.target.value)}
                        style={{ minWidth: '240px', flex: 1, border: 'none', background: 'transparent', fontWeight: 'var(--fw-semibold)' }}
                    >
                        <option value="">Select a batch to manage content...</option>
                        {Array.isArray(batches) && batches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {activeTab === 'assignments' ? `${assignments.length} Tasks` : `${quizzes.length} Quizzes`} Found
                        </div>
                    </div>
                </div>
            </div>

            <div className="m-grid-3">
                {!selectedBatch ? (
                    <div className="m-empty-state" style={{ gridColumn: '1 / -1', padding: '100px 24px' }}>
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ repeat: Infinity, duration: 2, repeatType: 'reverse' }}>
                            <Layout size={48} style={{ opacity: 0.2, color: 'var(--color-primary)' }} />
                        </motion.div>
                        <h3 className="m-empty-state__title">Ready to post content?</h3>
                        <p className="m-empty-state__desc">Select a batch from the dropdown above to manage its academic lifecycle.</p>
                    </div>
                ) : (isLoadingAssignments || isLoadingQuizzes) ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="m-skeleton m-skeleton--h200 shadow-sm" />
                    ))
                ) : activeTab === 'assignments' ? (
                    assignments.length > 0 ? (
                        assignments.map((assign, idx) => (
                            <motion.div
                                key={assign.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="m-card m-card--interactive shadow-sm border-hover"
                                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)', border: '1px solid var(--color-border)' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ background: 'var(--color-primary-soft)', padding: '8px', borderRadius: '10px' }}>
                                        <ClipboardList size={20} style={{ color: 'var(--color-primary)' }} />
                                    </div>
                                    <div className="m-badge m-badge--success" style={{ fontSize: '10px' }}>Ongoing</div>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 'var(--fs-body-lg)', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>{assign.title}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-small)', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {assign.description}
                                    </p>
                                </div>

                                <div style={{ background: 'var(--color-surface-muted)', padding: '12px', borderRadius: 'var(--radius-lg)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 'auto' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                                        <Target size={12} />
                                        <span>{assign.maxMarks} Marks</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-warning)' }}>
                                        <Calendar size={12} />
                                        <span>Deadline: {new Date(assign.dueDate).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <button className="m-btn m-btn--primary" style={{ width: '100%', fontSize: 'var(--fs-small)', minHeight: '38px' }}>
                                    Grade Submissions <ArrowRight size={14} style={{ marginLeft: '4px' }} />
                                </button>
                            </motion.div>
                        ))
                    ) : (
                        <div className="m-empty-state" style={{ gridColumn: '1 / -1', padding: '80px 24px' }}>
                            <div style={{ background: 'var(--color-primary-soft)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                <ClipboardList size={32} style={{ color: 'var(--color-primary)' }} />
                            </div>
                            <h3 className="m-empty-state__title">Empty Assignment Board</h3>
                            <p className="m-empty-state__desc">You haven't issued any specific tasks to this batch yet. Start their learning journey now.</p>
                            <button className="m-btn m-btn--primary" onClick={() => setShowCreateModal(true)}>Deploy First Task</button>
                        </div>
                    )
                ) : (
                    // QUIZZES TAB
                    quizzes.length > 0 ? (
                        quizzes.map((quiz, idx) => (
                            <motion.div
                                key={quiz.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="m-card m-card--interactive shadow-sm"
                                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)', border: '1px solid var(--color-border)' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ background: 'var(--color-warning-soft)', padding: '8px', borderRadius: '10px' }}>
                                        <BookOpen size={20} style={{ color: 'var(--color-warning)' }} />
                                    </div>
                                    <div className="m-badge m-badge--info" style={{ fontSize: '10px' }}>Live Quiz</div>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: 'var(--fs-body-lg)', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>{quiz.title}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-small)', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {quiz.questions?.length || 0} Multiple choice questions covering batch specific topics.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: 'auto' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                                        <Clock size={12} />
                                        <span>{quiz.timeLimit} Mins Limit</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-success)' }}>
                                        <CheckCircle2 size={12} />
                                        <span>Auto-graded</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="m-btn m-btn--ghost" style={{ flex: 1, fontSize: 'var(--fs-small)', minHeight: '38px' }}>
                                        Analyze Results
                                    </button>
                                    <button className="m-btn m-btn--ghost" style={{ padding: '8px', minWidth: 'unset' }}>
                                        <MoreVertical size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="m-empty-state" style={{ gridColumn: '1 / -1', padding: '80px 24px' }}>
                            <div style={{ background: 'var(--color-warning-soft)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                <HelpCircle size={32} style={{ color: 'var(--color-warning)' }} />
                            </div>
                            <h3 className="m-empty-state__title">No Assessments Issued</h3>
                            <p className="m-empty-state__desc">Host a quiz to benchmark student knowledge and identify learning gaps.</p>
                            <button className="m-btn m-btn--primary" onClick={() => setShowCreateModal(true)}>Create First Quiz</button>
                        </div>
                    )
                )}
            </div>

            {showCreateModal && activeTab === 'assignments' && (
                <CreateAssignmentModal
                    batchId={selectedBatch}
                    batches={Array.isArray(batches) ? batches : []}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleSuccess}
                />
            )}

            {showCreateModal && activeTab === 'quizzes' && (
                <CreateQuizModal
                    batchId={selectedBatch}
                    batches={Array.isArray(batches) ? batches : []}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
};

export default AssignmentsList;
