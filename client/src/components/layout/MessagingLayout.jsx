import React from 'react';
import { useAuth } from '../../context/AuthContext';
import StudentNavbar from '../student/Navbar';
import ChatBot from '../ChatBot';
import MessagingPage from '../../pages/MessagingPage';

const MessagingLayout = () => {
    const { user } = useAuth();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <StudentNavbar />
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <MessagingPage />
            </div>
            <ChatBot />
        </div>
    );
};

export default MessagingLayout;
