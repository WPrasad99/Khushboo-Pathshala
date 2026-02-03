import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, adminAPI } from '../api';
import { FiUser, FiLock, FiUpload, FiCheck, FiShield, FiSave } from 'react-icons/fi';
import { motion } from 'framer-motion';
import '../pages/admin/AdminDashboard.css'; // Reuse existing styles
import './admin/AdminDashboard.css'; // Ensure path is correct relative to this file? No, assume global css usage or import specifically.

const Settings = () => {
    const { user, login } = useAuth(); // login used to update user context after avatar change
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [adminStats, setAdminStats] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
    const [avatarFile, setAvatarFile] = useState(null);

    useEffect(() => {
        if (user?.role === 'ADMIN') {
            fetchAdminStats();
        }
    }, [user]);

    const fetchAdminStats = async () => {
        try {
            const res = await adminAPI.getReports(); // Reuse existing report/stats endpoint
            setAdminStats(res.data?.stats);
        } catch (err) {
            console.error(err);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            const res = await userAPI.updateProfile(profileData);
            // Update context if needed, but for now just show success
            setSuccessMsg('Profile updated successfully!');
        } catch (err) {
            setErrorMsg('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const uploadAvatar = async () => {
        if (!avatarFile) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('avatar', avatarFile);
            const res = await userAPI.uploadAvatar(formData);

            // Update local user context with new avatar URL
            // This is a bit of a hack, ideally we have a specific updateUser action or re-fetch profile
            // Assuming the login function or similar can accept partial updates or we force a reload/re-fetch
            window.location.reload(); // Simple way to refresh context for now
        } catch (err) {
            setErrorMsg("Failed to upload avatar.");
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setErrorMsg("New passwords do not match.");
            return;
        }
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            await userAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setSuccessMsg('Password changed successfully!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Failed to change password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ fontSize: '2rem', marginBottom: '32px', color: '#1e293b' }}
            >
                Settings
            </motion.h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>

                {/* 1. Profile Settings */}
                <motion.div className="glass-card" style={{ padding: '24px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '10px', borderRadius: '12px' }}>
                            <FiUser size={24} color="#6366f1" />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Profile Details</h2>
                    </div>

                    <form onSubmit={handleProfileUpdate}>
                        <div className="glass-form-group">
                            <label className="glass-label">Full Name</label>
                            <input
                                className="glass-input"
                                value={profileData.name}
                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            />
                        </div>
                        <div className="glass-form-group">
                            <label className="glass-label">Email Address</label>
                            <input
                                className="glass-input"
                                value={profileData.email}
                                disabled
                                style={{ opacity: 0.7, cursor: 'not-allowed' }}
                            />
                            <small style={{ color: '#64748b', marginTop: '4px', display: 'block' }}>Email cannot be changed.</small>
                        </div>
                        <div className="glass-form-group">
                            <label className="glass-label">Phone</label>
                            <input
                                className="glass-input"
                                value={profileData.phone}
                                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                placeholder="+91 98765 43210"
                            />
                        </div>
                        <div className="glass-form-group">
                            <label className="glass-label">Role</label>
                            <div style={{
                                display: 'inline-block',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                background: 'rgba(99, 102, 241, 0.1)',
                                color: '#6366f1',
                                fontWeight: '600',
                                fontSize: '0.875rem'
                            }}>
                                {user?.role}
                            </div>
                        </div>

                        <button type="submit" className="btn-glass-primary" disabled={loading} style={{ width: '100%', marginTop: '16px' }}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </motion.div>

                {/* 2. Avatar & Password */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Avatar Upload */}
                    <motion.div className="glass-card" style={{ padding: '24px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px' }}>
                                <FiUpload size={24} color="#10b981" />
                            </div>
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Profile Photo</h2>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ position: 'relative' }}>
                                <img
                                    src={avatarPreview || `https://ui-avatars.com/api/?name=${user?.name}`}
                                    alt="Profile"
                                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                />
                                <label htmlFor="avatar-upload" style={{
                                    position: 'absolute', bottom: 0, right: 0,
                                    background: '#ffffff', border: '1px solid #e2e8f0',
                                    borderRadius: '50%', width: '28px', height: '28px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                }}>
                                    <FiEdit2 size={14} color="#64748b" />
                                </label>
                                <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px' }}>
                                    Upload a new profile photo. Supported formats: JPG, PNG.
                                </p>
                                {avatarFile && (
                                    <button className="btn-glass-primary" onClick={uploadAvatar} disabled={loading} style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                                        <FiCheck /> Confirm Upload
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Change Password */}
                    <motion.div className="glass-card" style={{ padding: '24px', flex: 1 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
                            <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '10px', borderRadius: '12px' }}>
                                <FiLock size={24} color="#f43f5e" />
                            </div>
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Security</h2>
                        </div>

                        <form onSubmit={handlePasswordChange}>
                            <div className="glass-form-group">
                                <label className="glass-label">Current Password</label>
                                <input
                                    type="password"
                                    className="glass-input"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="glass-form-group">
                                    <label className="glass-label">New Password</label>
                                    <input
                                        type="password"
                                        className="glass-input"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    />
                                </div>
                                <div className="glass-form-group">
                                    <label className="glass-label">Confirm</label>
                                    <input
                                        type="password"
                                        className="glass-input"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn-glass-primary" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
                                Change Password
                            </button>
                        </form>
                    </motion.div>

                </div>
            </div>

            {/* Admin Only Stats */}
            {user?.role === 'ADMIN' && adminStats && (
                <motion.div className="glass-card" style={{ marginTop: '24px', padding: '24px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '12px' }}>
                            <FiShield size={24} color="#f59e0b" />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>System Status (Admin Only)</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.5)', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{adminStats.totalUsers}</div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Users</div>
                        </div>
                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.5)', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{adminStats.totalSessions}</div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Sessions</div>
                        </div>
                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.5)', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{adminStats.totalResources}</div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Resources</div>
                        </div>
                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.5)', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Active</div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>System Status</div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Messages */}
            {successMsg && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    {successMsg}
                </motion.div>
            )}
            {errorMsg && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#ef4444', color: 'white', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    {errorMsg}
                </motion.div>
            )}
        </div>
    );
};

// Missing Imports Fix
import { FiEdit2 } from 'react-icons/fi';

export default Settings;
