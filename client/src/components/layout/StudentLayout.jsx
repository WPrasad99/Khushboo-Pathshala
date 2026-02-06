import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../student/Navbar';
import ChatBot from '../ChatBot';

const StudentLayout = () => {
    return (
        <div className="student-layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main className="student-main-content" style={{ flex: 1, padding: '20px' }}>
                <Outlet />
            </main>
            <ChatBot />
        </div>
    );
};

export default StudentLayout;
