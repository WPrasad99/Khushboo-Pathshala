import { useState, useEffect } from 'react';
import { studentAdminAPI, batchAPI } from '../../api';
import './AdminPages.css';

export default function Students() {
    const [students, setStudents] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        batchId: '',
        phone: '',
        gender: '',
        educationLevel: ''
    });
    const [bulkData, setBulkData] = useState('');
    const [bulkBatchId, setBulkBatchId] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [generatedPassword, setGeneratedPassword] = useState('');

    useEffect(() => {
        fetchData();
    }, [selectedBatch, searchTerm]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const params = {};
            if (selectedBatch) params.batchId = selectedBatch;
            if (searchTerm) params.search = searchTerm;

            const [studentsRes, batchesRes] = await Promise.all([
                studentAdminAPI.getAllStudents(params),
                batchAPI.getAllBatches()
            ]);
            setStudents(studentsRes.data);
            setBatches(batchesRes.data);
        } catch (err) {
            setError('Failed to load data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setGeneratedPassword('');

        if (!formData.name || !formData.email || !formData.batchId) {
            setError('Name, email, and batch are required');
            return;
        }

        try {
            if (editingStudent) {
                await studentAdminAPI.updateStudent(editingStudent.id, formData);
                setSuccess('Student updated successfully');
            } else {
                const response = await studentAdminAPI.createStudent(formData);
                setSuccess('Student created successfully');
                if (response.data.generatedPassword) {
                    setGeneratedPassword(response.data.generatedPassword);
                }
            }
            await fetchData();
            if (!generatedPassword) {
                closeModal();
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Operation failed');
        }
    };

    const handleBulkSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!bulkData.trim() || !bulkBatchId) {
            setError('Student data and batch are required');
            return;
        }

        try {
            // Parse CSV/text input (format: name,email,phone per line)
            const lines = bulkData.trim().split('\n');
            const students = lines.map(line => {
                const [name, email, phone] = line.split(',').map(s => s.trim());
                return { name, email, phone };
            }).filter(s => s.name && s.email);

            if (students.length === 0) {
                setError('No valid student data found');
                return;
            }

            const response = await studentAdminAPI.bulkCreateStudents({
                students,
                batchId: bulkBatchId
            });

            const { created, failed } = response.data;
            let message = `Created ${created.length} students.`;
            if (failed.length > 0) {
                message += ` Failed: ${failed.length} (${failed.map(f => f.email).join(', ')})`;
            }
            setSuccess(message);
            await fetchData();
            closeBulkModal();
        } catch (err) {
            setError(err.response?.data?.error || 'Bulk creation failed');
        }
    };

    const handleDelete = async (student) => {
        if (!window.confirm(`Are you sure you want to delete "${student.name}"? This action cannot be undone.`)) return;

        try {
            await studentAdminAPI.deleteStudent(student.id);
            setSuccess('Student deleted successfully');
            await fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete student');
        }
    };

    const handleResetPassword = async (student) => {
        if (!window.confirm(`Reset password for "${student.name}"?`)) return;

        try {
            const response = await studentAdminAPI.resetPassword(student.id);
            setSuccess(`Password reset for ${student.name}. New password: ${response.data.newPassword}`);
        } catch (err) {
            setError('Failed to reset password');
        }
    };

    const openCreateModal = () => {
        setEditingStudent(null);
        setFormData({
            name: '',
            email: '',
            batchId: selectedBatch || '',
            phone: '',
            gender: '',
            educationLevel: ''
        });
        setGeneratedPassword('');
        setShowModal(true);
    };

    const openEditModal = (student) => {
        setEditingStudent(student);
        setFormData({
            name: student.name,
            email: student.email,
            batchId: student.batch?.id || '',
            phone: student.phone || '',
            gender: student.gender || '',
            educationLevel: student.educationLevel || ''
        });
        setGeneratedPassword('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingStudent(null);
        setGeneratedPassword('');
    };

    const openBulkModal = () => {
        setBulkData('');
        setBulkBatchId(selectedBatch || '');
        setShowBulkModal(true);
    };

    const closeBulkModal = () => {
        setShowBulkModal(false);
        setBulkData('');
    };

    const filteredStudents = students;

    if (loading) {
        return (
            <div className="admin-page">
                <div className="loading-spinner">Loading students...</div>
            </div>
        );
    }

    return (
        <div className="admin-page students-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1 className="page-title">
                        <span className="title-icon">👩‍🎓</span>
                        Student Management
                    </h1>
                    <p className="page-subtitle">Create and manage student accounts with batch assignments</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={openBulkModal}>
                        <span className="btn-icon">📋</span>
                        Bulk Import
                    </button>
                    <button className="btn-primary create-btn" onClick={openCreateModal}>
                        <span className="btn-icon">➕</span>
                        Add Student
                    </button>
                </div>
            </div>

            {/* Status Messages */}
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select
                        value={selectedBatch}
                        onChange={(e) => setSelectedBatch(e.target.value)}
                    >
                        <option value="">All Batches</option>
                        {batches.map(batch => (
                            <option key={batch.id} value={batch.id}>
                                {batch.name} ({batch.studentCount || 0} students)
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">👩‍🎓</div>
                    <div className="stat-content">
                        <div className="stat-value">{filteredStudents.length}</div>
                        <div className="stat-label">
                            {selectedBatch ? 'Students in Batch' : 'Total Students'}
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <div className="stat-value">
                            {filteredStudents.filter(s => s.batch?.isActive).length}
                        </div>
                        <div className="stat-label">Active (Can Login)</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-content">
                        <div className="stat-value">
                            {filteredStudents.filter(s => !s.batch).length}
                        </div>
                        <div className="stat-label">Unassigned</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📦</div>
                    <div className="stat-content">
                        <div className="stat-value">{batches.length}</div>
                        <div className="stat-label">Total Batches</div>
                    </div>
                </div>
            </div>

            {/* Students Table */}
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Email</th>
                            <th>Batch</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="empty-table">
                                    No students found
                                </td>
                            </tr>
                        ) : (
                            filteredStudents.map(student => (
                                <tr key={student.id}>
                                    <td>
                                        <div className="user-cell">
                                            <img
                                                src={student.avatar}
                                                alt={student.name}
                                                className="user-avatar"
                                            />
                                            <span className="user-name">{student.name}</span>
                                        </div>
                                    </td>
                                    <td>{student.email}</td>
                                    <td>
                                        {student.batch ? (
                                            <span className={`batch-tag ${student.batch.isActive ? 'active' : 'inactive'}`}>
                                                {student.batch.name}
                                            </span>
                                        ) : (
                                            <span className="batch-tag unassigned">Unassigned</span>
                                        )}
                                    </td>
                                    <td>
                                        {student.batch?.isActive ? (
                                            <span className="status-badge active">Can Login</span>
                                        ) : (
                                            <span className="status-badge inactive">Blocked</span>
                                        )}
                                    </td>
                                    <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn-icon-small"
                                                onClick={() => openEditModal(student)}
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-icon-small"
                                                onClick={() => handleResetPassword(student)}
                                                title="Reset Password"
                                            >
                                                🔑
                                            </button>
                                            <button
                                                className="btn-icon-small btn-danger"
                                                onClick={() => handleDelete(student)}
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content student-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingStudent ? 'Edit Student' : 'Add New Student'}</h2>
                            <button className="modal-close" onClick={closeModal}>&times;</button>
                        </div>

                        {generatedPassword && (
                            <div className="alert alert-info password-alert">
                                <strong>Generated Password:</strong>
                                <code className="password-code">{generatedPassword}</code>
                                <small>Share this with the student. They can change it after first login.</small>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="student-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="name">Full Name *</label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Student's full name"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Email Address *</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="student@example.com"
                                        required
                                        disabled={!!editingStudent}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="batchId">Assign to Batch *</label>
                                    <select
                                        id="batchId"
                                        value={formData.batchId}
                                        onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select a batch...</option>
                                        {batches.map(batch => (
                                            <option key={batch.id} value={batch.id}>
                                                {batch.name} {!batch.isActive && '(Inactive)'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="phone">Phone Number</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="Phone number"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="gender">Gender</label>
                                    <select
                                        id="gender"
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    >
                                        <option value="">Select...</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="educationLevel">Education Level</label>
                                    <select
                                        id="educationLevel"
                                        value={formData.educationLevel}
                                        onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                                    >
                                        <option value="">Select...</option>
                                        <option value="10th">10th Standard</option>
                                        <option value="12th">12th Standard</option>
                                        <option value="Undergraduate">Undergraduate</option>
                                        <option value="Graduate">Graduate</option>
                                        <option value="Postgraduate">Postgraduate</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={closeModal}>
                                    {generatedPassword ? 'Close' : 'Cancel'}
                                </button>
                                {!generatedPassword && (
                                    <button type="submit" className="btn-primary">
                                        {editingStudent ? 'Update Student' : 'Create Student'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Import Modal */}
            {showBulkModal && (
                <div className="modal-overlay" onClick={closeBulkModal}>
                    <div className="modal-content bulk-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Bulk Import Students</h2>
                            <button className="modal-close" onClick={closeBulkModal}>&times;</button>
                        </div>

                        <form onSubmit={handleBulkSubmit} className="bulk-form">
                            <div className="form-group">
                                <label htmlFor="bulkBatchId">Assign to Batch *</label>
                                <select
                                    id="bulkBatchId"
                                    value={bulkBatchId}
                                    onChange={(e) => setBulkBatchId(e.target.value)}
                                    required
                                >
                                    <option value="">Select a batch...</option>
                                    {batches.map(batch => (
                                        <option key={batch.id} value={batch.id}>
                                            {batch.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="bulkData">
                                    Student Data *
                                    <small>(One per line: name,email,phone)</small>
                                </label>
                                <textarea
                                    id="bulkData"
                                    value={bulkData}
                                    onChange={(e) => setBulkData(e.target.value)}
                                    placeholder="John Doe,john@example.com,9876543210
Jane Smith,jane@example.com,9876543211"
                                    rows={10}
                                    required
                                />
                            </div>

                            <div className="form-help">
                                <strong>Format:</strong> Each line should contain:
                                <code>Name, Email, Phone (optional)</code>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={closeBulkModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Import Students
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
