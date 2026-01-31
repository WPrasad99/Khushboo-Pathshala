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
    const [meetings, setMeetings] = useState([]);
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
            const [mentorshipRes, meetingsRes] = await Promise.all([
                mentorshipAPI.get(),
                mentorshipAPI.getMeetings()
            ]);
            setMentorship(mentorshipRes.data);
            setMeetings(meetingsRes.data);
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
                            <div className="card-badge">Your Mentor</div>
                            {mentorship?.mentor ? (
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

                    {/* Bottom Row: Meetings & Updates */}
                    <div className="updates-section">
                        <section className="meetings-hub">
                            <div className="section-header">
                                <h2>Upcoming Sessions</h2>
                                <span className="count">{meetings.length}</span>
                            </div>
                            <div className="meetings-container">
                                {meetings.length === 0 ? (
                                    <div className="empty-state">
                                        <p>No upcoming sessions found</p>
                                    </div>
                                ) : (
                                    meetings.map((meeting) => {
                                        const date = formatDate(meeting.meetingDate);
                                        return (
                                            <div key={meeting.id} className="meeting-row">
                                                <div className="date-badge">
                                                    <span className="day">{date.day}</span>
                                                    <span className="month">{date.month}</span>
                                                </div>
                                                <div className="meeting-info">
                                                    <h4>{meeting.discussionSummary || 'Mentorship Session'}</h4>
                                                    <p>{date.time} • {meeting.duration} mins</p>
                                                </div>
                                                <div className="meeting-status">Scheduled</div>
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
