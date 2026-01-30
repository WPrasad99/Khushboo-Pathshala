import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../student/Sidebar';

const StudentLayout = () => {
    return (
        <div className="student-layout">
            <Sidebar />
            <main className="student-main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default StudentLayout;
