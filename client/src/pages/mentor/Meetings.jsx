import { useState, useEffect } from 'react';
import { mentorshipAPI } from '../../api';
import './MentorPages.css';

const Meetings = () => {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        menteeId: '',
        meetingDate: '',
        duration: 30,
        discussionSummary: '',
        feedback: '',
        remarks: ''
    });

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
        try {
            const response = await mentorshipAPI.getMeetings();
            setMeetings(response.data);
        } catch (error) {
            console.error('Failed to fetch meetings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await mentorshipAPI.createMeeting(formData);
            setShowModal(false);
            fetchMeetings();
            setFormData({
                menteeId: '',
                meetingDate: '',
                duration: 30,
                discussionSummary: '',
                feedback: '',
                remarks: ''
            });
        } catch (error) {
            console.error('Failed to create meeting:', error);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    if (loading) {
        return <div className="loading">Loading meetings...</div>;
    }

    return (
        <div className="mentor-page">
            <div className="page-header">
                <h1>Meeting Management</h1>
                <button className="primary-btn" onClick={() => setShowModal(true)}>
                    + Schedule Meeting
                </button>
            </div>

            <div className="meetings-grid">
                {meetings.length === 0 ? (
                    <div className="empty-state">
                        <p>No meetings scheduled yet</p>
                    </div>
                ) : (
                    meetings.map(meeting => (
                        <div key={meeting.id} className="meeting-card">
                            <div className="meeting-header">
                                <div className="mentee-info">
                                    <img
                                        src={meeting.mentorship?.mentee?.avatar || '/default-avatar.png'}
                                        alt="Mentee"
                                        className="mentee-avatar"
                                    />
                                    <span>{meeting.mentorship?.mentee?.name || 'Unknown'}</span>
                                </div>
                                <span className="meeting-date">{formatDate(meeting.meetingDate)}</span>
                            </div>
                            <div className="meeting-body">
                                <p><strong>Duration:</strong> {meeting.duration} minutes</p>
                                {meeting.discussionSummary && (
                                    <p><strong>Summary:</strong> {meeting.discussionSummary}</p>
                                )}
                                {meeting.feedback && (
                                    <p><strong>Feedback:</strong> {meeting.feedback}</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>Schedule New Meeting</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Meeting Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={formData.meetingDate}
                                    onChange={e => setFormData(prev => ({ ...prev, meetingDate: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Duration (minutes)</label>
                                <input
                                    type="number"
                                    value={formData.duration}
                                    onChange={e => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                                    min="15"
                                    max="120"
                                />
                            </div>
                            <div className="form-group">
                                <label>Discussion Summary</label>
                                <textarea
                                    value={formData.discussionSummary}
                                    onChange={e => setFormData(prev => ({ ...prev, discussionSummary: e.target.value }))}
                                    placeholder="Brief description of the meeting agenda"
                                    rows="3"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="primary-btn">
                                    Schedule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Meetings;
