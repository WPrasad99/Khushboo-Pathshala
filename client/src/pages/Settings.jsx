import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../api';
import { FiUser, FiLock, FiCheck, FiEdit2, FiArrowLeft, FiMail, FiPhone, FiShield, FiFileText, FiHeart, FiStar, FiX } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

const Settings = () => {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    const [leftPanelData, setLeftPanelData] = useState({
        bio: user?.bio || '',
        hobbies: user?.hobbies || '',
        skills: user?.skills || '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
    const [avatarFile, setAvatarFile] = useState(null);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            await userAPI.updateProfile(profileData);
            setSuccessMsg('Profile updated successfully!');
        } catch (err) {
            setErrorMsg('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleLeftPanelUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            await userAPI.updateProfile(leftPanelData);
            setSuccessMsg('Profile updated successfully!');
            setIsEditingProfile(false);
        } catch (err) {
            setErrorMsg('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        // Reset to original values
        setLeftPanelData({
            bio: user?.bio || '',
            hobbies: user?.hobbies || '',
            skills: user?.skills || '',
        });
        setIsEditingProfile(false);
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
            await userAPI.uploadAvatar(formData);
            window.location.reload();
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
        <div className="settings-container">


            {/* Main Settings Card */}
            <motion.div
                className="settings-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                {/* Left - Profile Picture & Bio Section */}
                <div className="profile-section">
                    <div className="avatar-container">
                        <img
                            src={avatarPreview || `https://ui-avatars.com/api/?name=${user?.name}`}
                            alt="Profile"
                            className="avatar-image"
                        />
                        <label htmlFor="avatar-upload" className="avatar-edit-btn">
                            <FiEdit2 size={14} />
                        </label>
                        <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            style={{ display: 'none' }}
                        />
                    </div>

                    <h2 className="profile-name">{user?.name}</h2>
                    <div className="profile-role">
                        <FiShield size={12} />
                        <span>{user?.role}</span>
                    </div>

                    {avatarFile && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="upload-confirm-btn"
                            onClick={uploadAvatar}
                            disabled={loading}
                        >
                            <FiCheck size={14} />
                            Save Photo
                        </motion.button>
                    )}

                    <form onSubmit={handleLeftPanelUpdate} className="left-panel-form">
                        {/* Bio/Description */}
                        <div className="bio-section">
                            <label className="bio-label">
                                <FiFileText size={14} />
                                About Me
                            </label>
                            <textarea
                                className="bio-textarea"
                                value={leftPanelData.bio}
                                onChange={(e) => setLeftPanelData({ ...leftPanelData, bio: e.target.value })}
                                placeholder="Write something about yourself..."
                                rows="4"
                                disabled={!isEditingProfile}
                            />
                        </div>

                        {/* Hobbies */}
                        <div className="bio-section">
                            <label className="bio-label">
                                <FiHeart size={14} />
                                Hobbies
                            </label>
                            <input
                                className="bio-input"
                                value={leftPanelData.hobbies}
                                onChange={(e) => setLeftPanelData({ ...leftPanelData, hobbies: e.target.value })}
                                placeholder="e.g., Reading, Gaming, Photography"
                                disabled={!isEditingProfile}
                            />
                        </div>

                        {/* Skills */}
                        <div className="bio-section">
                            <label className="bio-label">
                                <FiStar size={14} />
                                Skills
                            </label>
                            <input
                                className="bio-input"
                                value={leftPanelData.skills}
                                onChange={(e) => setLeftPanelData({ ...leftPanelData, skills: e.target.value })}
                                placeholder="e.g., Python, React, Design"
                                disabled={!isEditingProfile}
                            />
                        </div>

                        {/* Edit/Save Buttons */}
                        <div className="left-panel-actions">
                            {!isEditingProfile ? (
                                <button
                                    type="button"
                                    className="edit-profile-btn"
                                    onClick={() => setIsEditingProfile(true)}
                                >
                                    <FiEdit2 size={14} />
                                    Edit Profile
                                </button>
                            ) : (
                                <div className="edit-actions">
                                    <button
                                        type="submit"
                                        className="save-profile-btn"
                                        disabled={loading}
                                    >
                                        <FiCheck size={14} />
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        className="cancel-profile-btn"
                                        onClick={handleCancelEdit}
                                        disabled={loading}
                                    >
                                        <FiX size={14} />
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                {/* Right - Forms Section */}
                <div className="content-section">
                    {/* Profile Details Section */}
                    <div className="form-section">
                        <div className="section-header">
                            <div className="section-icon">
                                <FiUser size={20} color="#3b82f6" />
                            </div>
                            <h3>Profile Information</h3>
                        </div>

                        <form onSubmit={handleProfileUpdate}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">
                                        <FiUser size={14} />
                                        Full Name
                                    </label>
                                    <input
                                        className="form-input"
                                        value={profileData.name}
                                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                        placeholder="Enter your name"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <FiPhone size={14} />
                                        Phone Number
                                    </label>
                                    <input
                                        className="form-input"
                                        value={profileData.phone}
                                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <FiMail size={14} />
                                    Email Address
                                </label>
                                <input
                                    className="form-input disabled"
                                    value={profileData.email}
                                    disabled
                                />
                                <span className="helper-text">Email cannot be changed</span>
                            </div>

                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>

                    {/* Security Section */}
                    <div className="form-section">
                        <div className="section-header">
                            <div className="section-icon">
                                <FiLock size={20} color="#8b5cf6" />
                            </div>
                            <h3>Security & Password</h3>
                        </div>

                        <form onSubmit={handlePasswordChange}>
                            <div className="form-group">
                                <label className="form-label">
                                    <FiLock size={14} />
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    placeholder="Enter current password"
                                />
                            </div>

                            <div className="password-grid">
                                <div className="form-group">
                                    <label className="form-label">
                                        <FiLock size={14} />
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        placeholder="Enter new password"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <FiCheck size={14} />
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="submit-btn secondary" disabled={loading}>
                                {loading ? 'Updating...' : 'Change Password'}
                            </button>
                        </form>
                    </div>
                </div>
            </motion.div>

            {/* Success/Error Messages */}
            {successMsg && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="toast toast-success"
                >
                    <FiCheck size={18} />
                    {successMsg}
                </motion.div>
            )}
            {errorMsg && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="toast toast-error"
                >
                    {errorMsg}
                </motion.div>
            )}
        </div>
    );
};

export default Settings;
