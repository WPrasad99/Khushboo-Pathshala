import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import './AdminPages.css';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await adminAPI.getUsers();
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await adminAPI.updateUserRole(userId, newRole);
            setUsers(users.map(user =>
                user.id === userId ? { ...user, role: newRole } : user
            ));
        } catch (error) {
            console.error('Failed to update role:', error);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesFilter = filter === 'ALL' || user.role === filter;
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'ADMIN': return 'badge-admin';
            case 'MENTOR': return 'badge-mentor';
            default: return 'badge-student';
        }
    };

    if (loading) {
        return <div className="loading">Loading users...</div>;
    }

    return (
        <div className="admin-page">
            <div className="page-header">
                <h1>User Management</h1>
                <div className="header-stats">
                    <span className="stat">Total: {users.length}</span>
                    <span className="stat">Students: {users.filter(u => u.role === 'STUDENT').length}</span>
                    <span className="stat">Mentors: {users.filter(u => u.role === 'MENTOR').length}</span>
                </div>
            </div>

            <div className="filters-bar">
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <div className="filter-buttons">
                    {['ALL', 'STUDENT', 'MENTOR', 'ADMIN'].map(role => (
                        <button
                            key={role}
                            className={`filter-btn ${filter === role ? 'active' : ''}`}
                            onClick={() => setFilter(role)}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id}>
                                <td>
                                    <div className="user-cell">
                                        <img
                                            src={user.avatar || '/default-avatar.png'}
                                            alt={user.name}
                                            className="user-avatar"
                                        />
                                        <span>{user.name}</span>
                                    </div>
                                </td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        className="role-select"
                                    >
                                        <option value="STUDENT">Student</option>
                                        <option value="MENTOR">Mentor</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Users;
