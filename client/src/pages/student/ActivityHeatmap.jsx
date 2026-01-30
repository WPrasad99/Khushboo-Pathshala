import React, { useMemo } from 'react';
import './ActivityHeatmap.css';

const ActivityHeatmap = () => {
    // Generate dates for the last 365 days
    const heatmapData = useMemo(() => {
        const data = [];
        const today = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);

        for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
            const isToday = d.toDateString() === today.toDateString();
            // Simulate random activity - more sparse for realism
            const randomValue = Math.random();
            let intensity = 0;
            if (isToday) {
                intensity = 4;
            } else if (randomValue > 0.85) {
                intensity = 4;
            } else if (randomValue > 0.75) {
                intensity = 3;
            } else if (randomValue > 0.6) {
                intensity = 2;
            } else if (randomValue > 0.4) {
                intensity = 1;
            }

            data.push({
                date: new Date(d),
                intensity
            });
        }
        return data;
    }, []);

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

    return (
        <div className="activity-heatmap-card">
            <div className="heatmap-header">
                <h3>Activity Log</h3>
                <span className="heatmap-subtitle">Your daily learning activity</span>
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
                    <div className="legend-cell level-1"></div>
                    <div className="legend-cell level-2"></div>
                    <div className="legend-cell level-3"></div>
                    <div className="legend-cell level-4"></div>
                    <span>More</span>
                </div>
            </div>
        </div>
    );
};

export default ActivityHeatmap;
