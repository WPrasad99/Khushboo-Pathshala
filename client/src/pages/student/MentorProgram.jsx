import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mentorshipAPI } from '../../api';
import { FiArrowLeft, FiSearch, FiBell, FiUser, FiLogOut, FiCalendar, FiMessageCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import './Dashboard.css';
import './MentorProgram.css';

const MentorProgram = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mentorship, setMentorship] = useState(null);
    const [batches, setBatches] = useState([]);
    const [upcomingMeetings, setUpcomingMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showMsgModal, setShowMsgModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [formData, setFormData] = useState({ date: '', message: '' });

    useEffect(() => {
        fetchMentorshipData();
    }, []);

    const fetchMentorshipData = async () => {
        try {
            const [mentorshipRes, batchesRes, upcomingRes] = await Promise.all([
                mentorshipAPI.get(),
                mentorshipAPI.getBatches(),
                mentorshipAPI.getMeetings('upcoming')
            ]);
            setMentorship(mentorshipRes.data);
            setBatches(batchesRes.data);
            setUpcomingMeetings(upcomingRes.data);
        } catch (error) {
            console.error('Failed to fetch mentorship data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (type) => {
        if (!mentorship?.mentor) {
            alert("No mentor assigned yet.");
            return;
        }
        setActionLoading(true);
        try {
            if (type === 'schedule') {
                await mentorshipAPI.createMeeting({
                    mentorId: mentorship.mentor.id,
                    meetingDate: formData.date,
                    discussionSummary: `Meeting requested by ${user.name}`
                });
                alert("Meeting request sent!");
            } else {
                await mentorshipAPI.sendMessage({
                    recipientId: mentorship.mentor.id,
                    content: formData.message
                });
                alert("Message sent!");
            }
            setShowScheduleModal(false);
            setShowMsgModal(false);
            setFormData({ date: '', message: '' });
            fetchMentorshipData();
        } catch (error) {
            alert("Failed to perform action.");
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return {
            day: date.getDate(),
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            full: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        };
    };

    return (
        <div className="mentor-program-page">
            {/* Header Removed */}

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                </div>
            ) : (
                <div className="mentorship-content">
                    {/* Top Row: Mentor & Actions */}
                    <div className="hub-grid">
                        {/* Mentor Card */}
                        <motion.div
                            className="mentor-main-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="card-badge">Your Mentors</div>
                            {mentorship?.mentors && mentorship.mentors.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {mentorship.mentors.map((mentor, idx) => (
                                        <div className="mentor-details" key={mentor.id || idx} style={idx > 0 ? { borderTop: '1px solid #e2e8f0', paddingTop: '16px' } : {}}>
                                            <div className="avatar-wrapper">
                                                <img src={mentor.avatar} alt={mentor.name} />
                                                <div className="status-indicator"></div>
                                            </div>
                                            <div className="info">
                                                <h2>{mentor.name}</h2>
                                                <p className="specialization">Expert Guide & Mentor</p>
                                                <div className="contact-pills">
                                                    <span>{mentor.email}</span>
                                                    {mentor.phone && <span>{mentor.phone}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : mentorship?.mentor ? (
                                <div className="mentor-details">
                                    <div className="avatar-wrapper">
                                        <img src={mentorship.mentor.avatar} alt={mentorship.mentor.name} />
                                        <div className="status-indicator"></div>
                                    </div>
                                    <div className="info">
                                        <h2>{mentorship.mentor.name}</h2>
                                        <p className="specialization">Expert Guide & Mentor</p>
                                        <div className="contact-pills">
                                            <span>{mentorship.mentor.email}</span>
                                            {mentorship.mentor.phone && <span>{mentorship.mentor.phone}</span>}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="no-mentor">
                                    <FiUser size={40} />
                                    <p>Assignment in progress...</p>
                                </div>
                            )}
                        </motion.div>

                        {/* Action Cards */}
                        <div className="action-stack">
                            <motion.div
                                className="action-card primary"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowScheduleModal(true)}
                            >
                                <div className="icon-box"><FiCalendar /></div>
                                <div className="text">
                                    <h3>Schedule Meet</h3>
                                    <p>Book a 1:1 session</p>
                                </div>
                            </motion.div>

                            <motion.div
                                className="action-card secondary"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowMsgModal(true)}
                            >
                                <div className="icon-box"><FiMessageCircle /></div>
                                <div className="text">
                                    <h3>Drop a Message</h3>
                                    <p>Direct chat with mentor</p>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Batches Section */}
                    <div className="batches-section" style={{ marginTop: '24px' }}>
                        <div className="section-header">
                            <h2>Your Batches</h2>
                            <span className="count">{batches.length}</span>
                        </div>
                        <div className="batches-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginTop: '16px' }}>
                            {batches.length === 0 ? (
                                <div className="empty-state">
                                    <p>No batches enrolled</p>
                                </div>
                            ) : (
                                batches.map((batch) => (
                                    <motion.div
                                        key={batch.id}
                                        className="batch-card"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{
                                            background: 'white',
                                            borderRadius: '12px',
                                            padding: '20px',
                                            border: '1px solid #E5E7EB',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1F2937', marginBottom: '8px' }}>{batch.name}</h3>
                                        <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '12px' }}>{batch.description || 'No description available'}</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: '#6B7280' }}>
                                            {batch.mentors && batch.mentors.length > 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontWeight: '600', color: '#4F46E5' }}>Mentors:</span>
                                                    <span>{batch.mentors.map(m => m.name).join(', ')}</span>
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontWeight: '600', color: '#4F46E5' }}>Students:</span>
                                                <span>{batch.studentCount}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontWeight: '600', color: '#4F46E5' }}>Status:</span>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    background: batch.status === 'ACTIVE' ? '#DCFCE7' : '#F3F4F6',
                                                    color: batch.status === 'ACTIVE' ? '#16A34A' : '#6B7280',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem'
                                                }}>{batch.status}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Bottom Row: Meetings */}
                    <div className="updates-section" style={{ marginTop: '24px' }}>
                        {/* Upcoming Meetings */}
                        <section className="meetings-hub">
                            <div className="section-header">
                                <h2>Upcoming Meetings</h2>
                                <span className="count">{upcomingMeetings.length}</span>
                            </div>
                            <div className="meetings-container">
                                {upcomingMeetings.length === 0 ? (
                                    <div className="empty-state">
                                        <p>No upcoming meetings scheduled</p>
                                    </div>
                                ) : (
                                    upcomingMeetings.map((meeting) => {
                                        const date = formatDate(meeting.meetingDate);
                                        return (
                                            <div key={meeting.id} className="meeting-row">
                                                <div className="date-badge">
                                                    <span className="day">{date.day}</span>
                                                    <span className="month">{date.month}</span>
                                                </div>
                                                <div className="meeting-info">
                                                    <h4>{meeting.discussionSummary || 'Mentorship Meeting'}</h4>
                                                    <p>{date.time} • {meeting.duration || 30} mins</p>
                                                </div>
                                                <div className="meeting-status" style={{ background: '#DBEAFE', color: '#1E40AF', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' }}>Scheduled</div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {showScheduleModal && (
                    <div className="modal-overlay">
                        <motion.div
                            className="modal-card"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <h2>Schedule Session</h2>
                            <input
                                type="datetime-local"
                                className="modal-input"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                            <div className="modal-actions">
                                <button onClick={() => setShowScheduleModal(false)}>Cancel</button>
                                <button
                                    className="confirm"
                                    onClick={() => handleAction('schedule')}
                                    disabled={actionLoading || !formData.date}
                                >
                                    {actionLoading ? 'Sending...' : 'Request Meet'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showMsgModal && (
                    <div className="modal-overlay">
                        <motion.div
                            className="modal-card"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <h2>Send Message</h2>
                            <textarea
                                className="modal-input"
                                placeholder="Type your message here..."
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            />
                            <div className="modal-actions">
                                <button onClick={() => setShowMsgModal(false)}>Cancel</button>
                                <button
                                    className="confirm"
                                    onClick={() => handleAction('message')}
                                    disabled={actionLoading || !formData.message}
                                >
                                    {actionLoading ? 'Sending...' : 'Send Message'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MentorProgram;
