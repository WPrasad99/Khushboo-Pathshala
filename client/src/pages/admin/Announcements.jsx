import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import './AdminPages.css';

const Announcements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        priority: 'normal'
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const response = await adminAPI.getAnnouncements();
            setAnnouncements(response.data);
        } catch (error) {
            console.error('Failed to fetch announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await adminAPI.createAnnouncement(formData);
            setShowModal(false);
            fetchAnnouncements();
            setFormData({ title: '', content: '', priority: 'normal' });
        } catch (error) {
            console.error('Failed to create announcement:', error);
        }
    };

    const getPriorityClass = (priority) => {
        switch (priority) {
            case 'high': return 'priority-high';
            case 'low': return 'priority-low';
            default: return 'priority-normal';
        }
    };

    if (loading) {
        return <div className="loading">Loading announcements...</div>;
    }

    return (
        <div className="admin-page">
            <div className="page-header">
                <h1>Announcements</h1>
                <button className="primary-btn" onClick={() => setShowModal(true)}>
                    + New Announcement
                </button>
            </div>

            <div className="announcements-grid">
                {announcements.length === 0 ? (
                    <div className="empty-state">
                        <p>No announcements yet. Create your first announcement!</p>
                    </div>
                ) : (
                    announcements.map(announcement => (
                        <div key={announcement.id} className={`announcement-card ${getPriorityClass(announcement.priority)}`}>
                            <div className="announcement-header">
                                <h3>{announcement.title}</h3>
                                <span className={`priority-badge ${getPriorityClass(announcement.priority)}`}>
                                    {announcement.priority}
                                </span>
                            </div>
                            <p className="announcement-content">{announcement.content}</p>
                            <div className="announcement-footer">
                                <span>By {announcement.createdBy?.name || 'Admin'}</span>
                                <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>Create Announcement</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Announcement title"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Content *</label>
                                <textarea
                                    value={formData.content}
                                    onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                    placeholder="Announcement content"
                                    rows="5"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Priority</label>
                                <select
                                    value={formData.priority}
                                    onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                                >
                                    <option value="low">Low</option>
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="primary-btn">
                                    Publish
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Announcements;
