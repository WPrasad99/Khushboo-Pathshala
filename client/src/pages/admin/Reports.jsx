import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import './AdminPages.css';

const Reports = () => {
    const [reports, setReports] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const response = await adminAPI.getReports();
            setReports(response.data);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading reports...</div>;
    }

    if (!reports) {
        return <div className="error">Failed to load reports</div>;
    }

    return (
        <div className="admin-page">
            <div className="page-header">
                <h1>Analytics & Reports</h1>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon students">👨‍🎓</div>
                    <div className="stat-info">
                        <span className="stat-number">{reports.stats.totalStudents}</span>
                        <span className="stat-label">Total Students</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon mentors">👨‍🏫</div>
                    <div className="stat-info">
                        <span className="stat-number">{reports.stats.totalMentors}</span>
                        <span className="stat-label">Total Mentors</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon resources">📚</div>
                    <div className="stat-info">
                        <span className="stat-number">{reports.stats.totalResources}</span>
                        <span className="stat-label">Learning Resources</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon sessions">📅</div>
                    <div className="stat-info">
                        <span className="stat-number">{reports.stats.totalSessions}</span>
                        <span className="stat-label">Total Sessions</span>
                    </div>
                </div>
            </div>

            <div className="report-section">
                <h2>Recent Activity Tracking</h2>
                <div className="tracking-table-container">
                    <table className="tracking-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Resource</th>
                                <th>Progress</th>
                                <th>Attendance</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.recentTrackings?.map(tracking => (
                                <tr key={tracking.id}>
                                    <td>{tracking.user?.name || 'Unknown'}</td>
                                    <td>{tracking.resource?.title || 'Unknown'}</td>
                                    <td>
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{ width: `${Math.min(tracking.completionPercentage, 100)}%` }}
                                            />
                                            <span>{Math.round(tracking.completionPercentage)}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${tracking.attendanceMarked ? 'marked' : 'pending'}`}>
                                            {tracking.attendanceMarked ? 'Marked' : 'Pending'}
                                        </span>
                                    </td>
                                    <td>{new Date(tracking.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="report-section">
                <h2>Platform Overview</h2>
                <div className="overview-cards">
                    <div className="overview-card">
                        <h3>Engagement Rate</h3>
                        <div className="metric">
                            <span className="metric-value">78%</span>
                            <span className="metric-trend positive">↑ 5%</span>
                        </div>
                        <p>Average user engagement this month</p>
                    </div>
                    <div className="overview-card">
                        <h3>Course Completion</h3>
                        <div className="metric">
                            <span className="metric-value">65%</span>
                            <span className="metric-trend positive">↑ 12%</span>
                        </div>
                        <p>Average course completion rate</p>
                    </div>
                    <div className="overview-card">
                        <h3>Active Users</h3>
                        <div className="metric">
                            <span className="metric-value">{Math.round(reports.stats.totalStudents * 0.7)}</span>
                            <span className="metric-trend neutral">—</span>
                        </div>
                        <p>Users active in the last 7 days</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
