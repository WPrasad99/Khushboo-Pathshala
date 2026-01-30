import React, { useMemo } from 'react';
import './ActivityHeatmap.css';

const ActivityHeatmap = ({ loginDates = [] }) => {
    // Generate dates for the last 365 days
    const heatmapData = useMemo(() => {
        const data = [];
        const today = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);

        // Create a Set of login date strings for quick lookup
        const loginDateSet = new Set(loginDates);

        for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const isToday = d.toDateString() === today.toDateString();
            const hasLogin = loginDateSet.has(dateStr);

            // Set intensity based on login status
            let intensity = 0;
            if (hasLogin) {
                intensity = 4; // Logged in = green
            } else if (isToday && loginDates.length === 0) {
                // Today but no login data yet, show as just logged in
                intensity = 4;
            }

            data.push({
                date: new Date(d),
                intensity,
                dateStr
            });
        }
        return data;
    }, [loginDates]);

    // Group by months for labels
    const months = useMemo(() => {
        const monthLabels = [];
        let currentMonth = -1;

        heatmapData.forEach((day, index) => {
            const m = day.date.getMonth();
            if (m !== currentMonth) {
                monthLabels.push({
                    name: day.date.toLocaleString('default', { month: 'short' }),
                    index: Math.floor(index / 7)
                });
                currentMonth = m;
            }
        });
        return monthLabels;
    }, [heatmapData]);

    // Count total active days
    const totalActiveDays = heatmapData.filter(d => d.intensity > 0).length;

    return (
        <div className="activity-heatmap-card">
            <div className="heatmap-header">
                <h3>Activity Log</h3>
                <span className="heatmap-subtitle">{totalActiveDays} active days in the last year</span>
            </div>

            <div className="heatmap-container">
                <div className="heatmap-grid">
                    <div className="heatmap-weekdays">
                        <span>Mon</span>
                        <span>Wed</span>
                        <span>Fri</span>
                    </div>

                    <div className="heatmap-calendar">
                        <div className="heatmap-months">
                            {months.map((m, i) => (
                                <span key={i} style={{ left: `${m.index * 14}px` }}>{m.name}</span>
                            ))}
                        </div>

                        <div className="heatmap-cells">
                            {heatmapData.map((day, i) => (
                                <div
                                    key={i}
                                    className={`heatmap-cell level-${day.intensity}`}
                                    title={`${day.date.toDateString()}: ${day.intensity > 0 ? 'Active' : 'No activity'}`}
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="heatmap-legend">
                    <span>Less</span>
                    <div className="legend-cell level-0"></div>
                    <div className="legend-cell level-4"></div>
                    <span>More</span>
                </div>
            </div>
        </div>
    );
};

export default ActivityHeatmap;
