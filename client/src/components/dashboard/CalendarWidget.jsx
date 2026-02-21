import React, { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiClock, FiVideo, FiMapPin, FiCalendar } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const CalendarWidget = ({ meetings = [] }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentDate);

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const isSameDay = (d1, d2) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const getMeetingsForDate = (date) => {
        return meetings.filter(m => {
            const mDate = new Date(m.meetingDate);
            return isSameDay(mDate, date);
        });
    };

    const selectedMeetings = getMeetingsForDate(selectedDate);

    return (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontSize: 'var(--fs-h3)', color: '#1e293b', fontWeight: 'var(--fw-bold)' }}>
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={prevMonth} style={{ background: 'transparent', border: '1px solid #e2e8f0', color: 'var(--color-text-)', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FiChevronLeft />
                        </button>
                        <button onClick={nextMonth} style={{ background: 'transparent', border: '1px solid #e2e8f0', color: 'var(--color-text-)', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FiChevronRight />
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-)', marginBottom: '12px' }}>
                    <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                    {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array(days).fill(null).map((_, i) => {
                        const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
                        const hasMeeting = getMeetingsForDate(dayDate).length > 0;
                        const isSelected = isSameDay(dayDate, selectedDate);
                        const isToday = isSameDay(dayDate, new Date());

                        return (
                            <motion.div
                                key={i}
                                whileHover={{ scale: 1.05, backgroundColor: '#f1f5f9' }}
                                onClick={() => setSelectedDate(dayDate)}
                                style={{
                                    aspectRatio: '1',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    background: isSelected ? '#3b82f6' : (isToday ? '#eff6ff' : 'transparent'),
                                    color: isSelected ? 'white' : (isToday ? '#3b82f6' : '#475569'),
                                    position: 'relative',
                                    fontSize: 'var(--fs-body)',
                                    fontWeight: isSelected || isToday ? 600 : 400,
                                    margin: '0 auto',
                                    width: '36px',
                                    height: '36px'
                                }}
                            >
                                {i + 1}
                                {hasMeeting && !isSelected && (
                                    <div style={{ width: '4px', height: '4px', background: '#3b82f6', borderRadius: '50%', position: 'absolute', bottom: '4px' }} />
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <div style={{ padding: '24px', flex: 1, overflowY: 'auto', background: '#fafafa' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: 'var(--fs-body)', color: 'var(--color-text-)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'var(--fw-semibold)' }}>
                    <FiCalendar /> Meetings on {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </h4>

                {selectedMeetings.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {selectedMeetings.map((meeting, idx) => (
                            <div
                                key={meeting.id || idx}
                                style={{
                                    padding: 'var(--space-24)',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    background: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '16px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                                    <div>
                                        <div style={{ fontWeight: 'var(--fw-semibold)', color: '#1e293b', marginBottom: '4px' }}>
                                            {meeting.title || meeting.discussionSummary || 'Mentorship Session'}
                                        </div>
                                        <div style={{ fontSize: 'var(--fs-body)', color: 'var(--color-text-)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <FiClock size={14} />
                                            {new Date(meeting.meetingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            <span style={{ margin: '0 4px' }}>•</span>
                                            {meeting.batch?.name ? meeting.batch.name : (meeting.mentorship?.mentee?.name || 'Session')}
                                        </div>
                                    </div>
                                </div>

                                {(() => {
                                    const link = meeting.remarks?.startsWith('http')
                                        ? meeting.remarks
                                        : (meeting.discussionSummary?.match(/Link: (http\S+)/)?.[1] || meeting.description?.match(/Link: (http\S+)/)?.[1]);

                                    return link ? (
                                        <a
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '8px 16px',
                                                background: '#3b82f6',
                                                color: 'white',
                                                borderRadius: '8px',
                                                textDecoration: 'none',
                                                fontSize: 'var(--fs-body)',
                                                fontWeight: 'var(--fw-semibold)',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            <FiVideo /> Join
                                        </a>
                                    ) : (
                                        <div style={{ padding: '8px 16px', background: '#f1f5f9', color: 'var(--color-text-)', borderRadius: '8px', fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-semibold)', whiteSpace: 'nowrap' }}>
                                            Offline
                                        </div>
                                    );
                                })()}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-)' }}>
                        <p>No meetings scheduled for this day.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarWidget;
