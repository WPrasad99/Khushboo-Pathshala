import React, { useState } from 'react';
import { useMentorStudents, useMentorBatches } from '../../../hooks/mentor/useMentorQueries';
import { Search, User, MessageCircle } from 'lucide-react';

const MenteesList = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBatch, setSelectedBatch] = useState('');
    const { data: studentsData, isLoading } = useMentorStudents({
        search: searchTerm,
        batchId: selectedBatch || undefined
    });

    const { data: batchesData } = useMentorBatches();

    return (
        <div className="m-section">
            <div className="mentor-page-header">
                <h2 className="mentor-page-title">Mentees Directory</h2>
                <div className="mentor-header-actions">
                    <select
                        className="m-select"
                        value={selectedBatch}
                        onChange={(e) => setSelectedBatch(e.target.value)}
                    >
                        <option value="">All Batches</option>
                        {batchesData?.data?.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>

                    <div className="m-search-wrap">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search students..."
                            className="m-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="m-card m-card--flat">
                <div className="m-table-wrap">
                    <table className="m-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Email</th>
                                <th>Engagement Avg</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={4}><div className="m-skeleton m-skeleton--h40" /></td>
                                    </tr>
                                ))
                            ) : studentsData?.data?.length > 0 ? (
                                studentsData.data.map(student => (
                                    <tr key={student.id}>
                                        <td>
                                            <div className="m-user-row">
                                                <img
                                                    src={student.avatar}
                                                    alt={student.name}
                                                    className="m-user-avatar"
                                                />
                                                <span className="m-user-name">{student.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{student.email}</td>
                                        <td>
                                            <div className="m-progress-wrap">
                                                <div className="m-progress-bar">
                                                    <div className="m-progress-fill" style={{ width: `${student.attendanceAvg}%` }} />
                                                </div>
                                                <span className="m-progress-text">{student.attendanceAvg}%</span>
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <button className="m-btn m-btn--ghost">
                                                <MessageCircle size={16} />
                                                Message
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4}>
                                        <div className="m-empty-state" style={{ border: 'none', padding: 'var(--space-40) var(--space-16)' }}>
                                            <User size={48} />
                                            <p className="m-empty-state__desc">No students found matching your criteria.</p>
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
