import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../student/Navbar';

const StudentLayout = () => {
    return (
        <div className="student-layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main className="student-main-content" style={{ flex: 1, padding: '20px' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default StudentLayout;
