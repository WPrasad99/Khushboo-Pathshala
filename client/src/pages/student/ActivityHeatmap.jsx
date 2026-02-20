import { useMemo, useState } from 'react';
import { FiClock } from 'react-icons/fi';
import './ActivityHeatmap.css';

const RANGE_OPTIONS = [
    { label: '3M', value: 3 },
    { label: '6M', value: 6 },
    { label: '12M', value: 12 }
];

const levelFromCount = (count) => {
    if (count <= 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count === 3) return 3;
    return 4;
};

const normalizeDate = (input) => {
    const d = new Date(input);
    return d.toISOString().slice(0, 10);
};

const ActivityHeatmap = ({ loginDates = [] }) => {
    const [rangeInMonths, setRangeInMonths] = useState(12);
    const [hovered, setHovered] = useState(null);

    const loginCountByDate = useMemo(() => {
        const counts = new Map();

        loginDates.forEach((date) => {
            const key = normalizeDate(date);
            counts.set(key, (counts.get(key) || 0) + 1);
        });

        return counts;
    }, [loginDates]);

    const { cells, monthLabels, totalActiveDays, totalSessions } = useMemo(() => {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth() - rangeInMonths + 1, 1);

        const paddedCells = [];
        const mondayOffset = (startDate.getDay() + 6) % 7;

        for (let index = 0; index < mondayOffset; index += 1) {
            paddedCells.push(null);
        }

        const monthLabelList = [];
        let previousMonth = -1;
        let activeDays = 0;
        let sessions = 0;

        for (let day = new Date(startDate); day <= today; day.setDate(day.getDate() + 1)) {
            const date = new Date(day);
            const key = normalizeDate(date);
            const sessionCount = loginCountByDate.get(key) || 0;
            const level = levelFromCount(sessionCount);

            if (sessionCount > 0) {
                activeDays += 1;
                sessions += sessionCount;
            }

            const gridColumn = Math.floor(paddedCells.length / 7);
            const month = date.getMonth();

            if (month !== previousMonth) {
                monthLabelList.push({
                    name: date.toLocaleString('default', { month: 'short' }),
                    column: gridColumn
                });
                previousMonth = month;
            }

            paddedCells.push({
                key,
                date,
                level,
                sessionCount,
                timeSpent: sessionCount * 35
            });
        }

        return {
            cells: paddedCells,
            monthLabels: monthLabelList,
            totalActiveDays: activeDays,
            totalSessions: sessions
        };
    }, [loginCountByDate, rangeInMonths]);

    return (
        <div className="activity-heatmap-v2">
            <header className="activity-heatmap-v2-header">
                <div>
                    <h3>Contribution Heatmap</h3>
                    <p>
                        {totalActiveDays} active day{totalActiveDays === 1 ? '' : 's'} · {totalSessions} session{totalSessions === 1 ? '' : 's'} viewed
                    </p>
                </div>

                <div className="activity-heatmap-controls">
                    <div className="activity-range-switcher">
                        {RANGE_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={rangeInMonths === option.value ? 'is-active' : ''}
                                onClick={() => setRangeInMonths(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    <div className="activity-legend">
                        <span>Less</span>
                        {[0, 1, 2, 3, 4].map((level) => (
                            <span key={level} className={`activity-legend-cell level-${level}`} />
                        ))}
                        <span>More</span>
                    </div>
                </div>
            </header>

            <div className="activity-heatmap-grid-wrap">
                <div className="activity-week-axis">
                    <span>Mon</span>
                    <span>Wed</span>
                    <span>Fri</span>
                </div>

                <div className="activity-calendar-wrap">
                    <div className="activity-month-axis">
                        {monthLabels.map((month) => (
                            <span key={`${month.name}-${month.column}`} style={{ left: `${(month.column / Math.max(1, Math.floor(cells.length / 7))) * 100}%` }}>
                                {month.name}
                            </span>
                        ))}
                    </div>

                    <div className="activity-cells-grid">
                        {cells.map((cell, index) => {
                            if (!cell) {
                                return <span key={`empty-${index}`} className="activity-cell is-empty" />;
                            }

                            return (
                                <button
                                    key={cell.key}
                                    type="button"
                                    className={`activity-cell level-${cell.level}`}
                                    onMouseEnter={(event) => {
                                        const rect = event.currentTarget.getBoundingClientRect();
                                        setHovered({
                                            x: rect.left + rect.width / 2,
                                            y: rect.top,
                                            ...cell
                                        });
                                    }}
                                    onMouseLeave={() => setHovered(null)}
                                    style={{ animationDelay: `${(index % 35) * 7}ms` }}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            <AnimateTooltip hovered={hovered} />
        </div>
    );
};

const AnimateTooltip = ({ hovered }) => {
    if (!hovered) return null;

    return (
        <div
            className="activity-tooltip"
            style={{
                left: hovered.x,
                top: hovered.y - 12
            }}
        >
            <strong>{hovered.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
            <p>
                <FiClock />
                {hovered.timeSpent} min learning time
            </p>
            <p>{hovered.sessionCount} session{hovered.sessionCount === 1 ? '' : 's'} watched</p>
        </div>
    );
};

export default ActivityHeatmap;
