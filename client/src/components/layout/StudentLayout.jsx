import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../student/Navbar';
import ChatBot from '../ChatBot';

const StudentLayout = () => {
    const location = useLocation();
    const isMessagesPage = location.pathname.includes('/messages');

    return (
        <div
            className="student-layout"
            style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                height: isMessagesPage ? '100vh' : 'auto',
                overflow: isMessagesPage ? 'hidden' : 'visible'
            }}
        >
            <Navbar />
            <main
                className="student-main-content"
                style={{
                    flex: 1,
                    padding: isMessagesPage ? 0 : '20px',
                    paddingTop: isMessagesPage ? '80px' : '20px',
                    overflow: isMessagesPage ? 'hidden' : 'auto',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Outlet />
            </main>
            {!isMessagesPage && <ChatBot />}
        </div>
    );
};

export default StudentLayout;
