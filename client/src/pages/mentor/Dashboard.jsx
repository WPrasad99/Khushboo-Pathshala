import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, Video, BookOpen, Calendar, MessageSquare, ClipboardList } from 'lucide-react';

import './MentorDashboard.css';

// Components
import Overview from './components/Overview';
import BatchesList from './components/BatchesList';
import MenteesList from './components/MenteesList';
import MeetingsList from './components/MeetingsList';
import SessionsList from './components/SessionsList';
import AssignmentsList from './components/AssignmentsList';

// Placeholder for Forum
const ForumPlaceholder = () => (
    <div className="m-empty-state">
        <MessageSquare size={48} />
        <h3 className="m-empty-state__title">Discussion Forum</h3>
        <p className="m-empty-state__desc">The community discussion board will be available soon. Stay tuned for updates!</p>
    </div>
);

const MentorDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Derived active tab from URL hash or pathname
    const getActiveTab = () => {
        const path = location.pathname.split('/').pop();
        if (['mentor', 'batches', 'sessions', 'assignments', 'mentorship', 'forum', 'meetings'].includes(path)) {
            return path === 'mentor' ? 'overview' : path;
        }
        const hash = location.hash.replace('#', '');
        return ['overview', 'batches', 'sessions', 'assignments', 'mentorship', 'forum', 'meetings'].includes(hash)
            ? hash : 'overview';
    };

    const [activeTab, setActiveTab] = useState(getActiveTab());

    useEffect(() => {
        setActiveTab(getActiveTab());
    }, [location.pathname, location.hash]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        navigate(tabId === 'overview' ? '/mentor' : `/mentor/${tabId}`);
    };

    const navItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'batches', label: 'Batches', icon: BookOpen },
        { id: 'meetings', label: 'Meetings', icon: Calendar },
        { id: 'mentorship', label: 'Mentees', icon: Users },
        { id: 'sessions', label: 'Resources', icon: Video },
        { id: 'assignments', label: 'Assignments', icon: ClipboardList },
        { id: 'forum', label: 'Forum', icon: MessageSquare },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <Overview />;
            case 'batches': return <BatchesList />;
            case 'meetings': return <MeetingsList />;
            case 'mentorship': return <MenteesList />;
            case 'sessions': return <SessionsList />;
            case 'assignments': return <AssignmentsList />;
            case 'forum': return <ForumPlaceholder />;
            default: return <Overview />;
        }
    };


    return (
        <div className="mentor-container">
            {renderContent()}
        </div>
    );
};

export default MentorDashboard;
