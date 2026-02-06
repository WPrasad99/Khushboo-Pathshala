import { useState, useEffect } from 'react';
import { assignmentAPI } from '../api';
import { FiFileText, FiSend, FiCheckCircle, FiAlertCircle, FiClock, FiUpload, FiPaperclip } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const StudentAssignmentSection = () => {
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submissionContent, setSubmissionContent] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const response = await assignmentAPI.getAssignments();
            setAssignments(response.data || []);
        } catch (error) {
            console.error('Failed to fetch assignments:', error);
        } finally {
            setLoading(false);
        }
    };

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
            fetchAssignments();
            alert('Assignment submitted successfully!');
        } catch (error) {
            console.error('Failed to submit assignment:', error);
            alert('Failed to submit assignment');
        }
    };

    const getStatusInfo = (assignment) => {
        const submission = assignment.submissions?.[0];
        if (!submission) {
            return { status: 'Not Submitted', color: '#64748b', icon: <FiClock />, bg: '#f1f5f9' };
        }
        if (submission.status === 'PENDING') {
            return { status: 'Submitted', color: '#d97706', icon: <FiClock />, bg: '#fef3c7' };
        }
        if (submission.status === 'APPROVED') {
            return { status: 'Approved', color: '#059669', icon: <FiCheckCircle />, bg: '#d1fae5' };
        }
        return { status: 'Rejected', color: '#dc2626', icon: <FiAlertCircle />, bg: '#fee2e2' };
    };

    const isOverdue = (dueDate) => new Date(dueDate) < new Date();

    return (
        <div className="assignments-container">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '20px' }}>My Assignments</h2>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading assignments...</div>
            ) : assignments.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {assignments.map(assignment => {
                        const submission = assignment.submissions?.[0];
                        const statusInfo = getStatusInfo(assignment);
                        const overdue = isOverdue(assignment.dueDate) && !submission;

                        return (
                            <motion.div
                                key={assignment.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div style={{ padding: '10px', background: '#eff6ff', color: '#2563eb', borderRadius: '10px' }}>
                                        <FiFileText size={20} />
                                    </div>
                                    {overdue && (
                                        <span style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>
                                            OVERDUE
                                        </span>
                                    )}
                                </div>

                                <h4 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: '#1e293b', fontWeight: 700 }}>{assignment.title}</h4>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
                                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                </div>

                                <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0 0 20px', lineHeight: '1.5', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {assignment.description}
                                </p>

                                <div style={{ marginTop: 'auto' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '8px 12px', background: statusInfo.bg, borderRadius: '8px', width: 'fit-content' }}>
                                        <span style={{ color: statusInfo.color }}>{statusInfo.icon}</span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: statusInfo.color }}>
                                            {statusInfo.status}
                                        </span>
                                    </div>

                                    {submission?.feedback && (
                                        <div style={{ marginBottom: '16px', padding: '12px', background: '#fff7ed', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>Mentor Feedback:</div>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#78350f' }}>{submission.feedback}</p>
                                        </div>
                                    )}

                                    {!submission ? (
                                        <button
                                            onClick={() => {
                                                setSelectedAssignment(assignment);
                                                setShowSubmitModal(true);
                                            }}
                                            style={{ width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                        >
                                            <FiSend /> Submit
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                if (submission.status === 'REJECTED') {
                                                    setSelectedAssignment(assignment);
                                                    setShowSubmitModal(true);
                                                }
                                            }}
                                            disabled={submission.status !== 'REJECTED'}
                                            style={{
                                                width: '100%', padding: '12px',
                                                background: submission.status === 'REJECTED' ? '#f59e0b' : '#f1f5f9',
                                                color: submission.status === 'REJECTED' ? 'white' : '#64748b',
                                                border: 'none', borderRadius: '10px', fontWeight: 600,
                                                cursor: submission.status === 'REJECTED' ? 'pointer' : 'default',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                            }}
                                        >
                                            {submission.status === 'REJECTED' ? <><FiSend /> Resubmit</> : 'View Details'}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                    <FiFileText size={48} style={{ marginBottom: '16px', color: '#94a3b8' }} />
                    <h3 style={{ margin: '0 0 8px', color: '#1e293b' }}>No assignments yet</h3>
                    <p style={{ color: '#64748b', margin: 0 }}>You're all caught up!</p>
                </div>
            )}

            {/* Submit Modal */}
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
