import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMentorStudents, useMentorBatches } from '../../../hooks/mentor/useMentorQueries';
import { Search, User, MessageCircle, Filter, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const MenteesList = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBatch, setSelectedBatch] = useState('');
    const { data: studentsData, isLoading, isError } = useMentorStudents({
        search: searchTerm,
        batchId: selectedBatch || undefined
    });

    const { data: batchesData } = useMentorBatches();
    const batches = Array.isArray(batchesData) ? batchesData : [];
    const students = Array.isArray(studentsData) ? studentsData : [];

    if (isError) {
        return (
            <div className="m-section">
                <div className="m-empty-state">
                    <h3 className="m-empty-state__title">Sync Lost</h3>
                    <p className="m-empty-state__desc">We couldn't reach the student directory. Please check your connection.</p>
                    <button className="m-btn m-btn--primary" onClick={() => window.location.reload()}>Re-sync Directory</button>
                </div>
            </div>
        );
    }

    return (
        <div className="m-section">
            <header className="mentor-page-header">
                <div>
                    <h2 className="mentor-page-title">Mentees Directory</h2>
                    <p className="mentor-page-subtitle">Manage and track individual student performance across all your active batches.</p>
                </div>
                <div className="mentor-header-actions">
                    <button className="m-btn m-btn--secondary">
                        <Download size={18} />
                        Export
                    </button>
                </div>
            </header>

            <div className="m-card" style={{ padding: 'var(--space-20)', marginBottom: 'var(--space-8)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-16)', alignItems: 'center' }}>
                    <div className="m-search-wrap" style={{ flex: 1, minWidth: '300px' }}>
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Find mentees by name or email..."
                            className="m-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-12)', alignItems: 'center' }}>
                        <Filter size={18} style={{ color: 'var(--text-muted)' }} />
                        <select
                            className="m-select"
                            value={selectedBatch}
                            onChange={(e) => setSelectedBatch(e.target.value)}
                            style={{ minWidth: '200px' }}
                        >
                            <option value="">All Batches</option>
                            {batches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="m-card m-card--flat" style={{ overflow: 'hidden' }}>
                <div className="m-table-wrap">
                    <table className="m-table">
                        <thead>
                            <tr>
                                <th>Student Profile</th>
                                <th>Contact Details</th>
                                <th>Engagement Score</th>
                                <th className="text-right">Quick Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={4}><div className="m-skeleton m-skeleton--h40" /></td>
                                    </tr>
                                ))
                            ) : students.length > 0 ? (
                                students.map((student, idx) => (
                                    <motion.tr
                                        key={student.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <td>
                                            <div className="m-user-row">
                                                <div className="m-user-avatar" style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                    {student.name[0]}
                                                </div>
                                                <div>
                                                    <span className="m-user-name">{student.name}</span>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{student.educationLevel || 'Student'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)' }}>{student.email}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{student.phone || 'No phone provided'}</div>
                                        </td>
                                        <td>
                                            <div className="m-progress-wrap">
                                                <div className="m-progress-bar" style={{ height: '6px' }}>
                                                    <div className="m-progress-fill" style={{ width: `${student.attendanceAvg}%` }} />
                                                </div>
                                                <span className="m-progress-text">{student.attendanceAvg}%</span>
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <button
                                                className="m-btn m-btn--primary"
                                                onClick={() => navigate(`/mentor/chat/${student.id}`)}
                                                style={{ minHeight: '34px', padding: '0 12px' }}
                                            >
                                                <MessageCircle size={14} />
                                                Chat
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4}>
                                        <div className="m-empty-state" style={{ border: 'none', padding: 'var(--space-64) var(--space-24)' }}>
                                            <div style={{ background: 'var(--color-surface-muted)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-16)' }}>
                                                <User size={32} style={{ color: 'var(--text-muted)' }} />
                                            </div>
                                            <h3 className="m-empty-state__title">No Mentees Found</h3>
                                            <p className="m-empty-state__desc">Try adjusting your search terms or filter criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MenteesList;
