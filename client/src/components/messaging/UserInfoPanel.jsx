import React from 'react';
import { FiX, FiMail, FiUser, FiAward } from 'react-icons/fi';
import { motion } from 'framer-motion';
import './GroupInfoPanel.css'; // Reuse styles

const UserInfoPanel = ({ user, onClose }) => {
    if (!user) return null;

    return (
        <motion.div
            className="group-info-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween' }}
        >
            <div className="group-info-header">
                <h2>User Info</h2>
                <button onClick={onClose} className="close-panel-btn">
                    <FiX />
                </button>
            </div>

            <div className="group-info-content">
                <div className="user-profile-header">
                    <div className="user-large-avatar">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} />
                        ) : (
                            <div className="avatar-placeholder">
                                {user.name?.charAt(0)?.toUpperCase()}
                            </div>
                        )}
                    </div>
                    <h3>{user.name}</h3>
                    <span className="user-role-badge">{user.role}</span>
                </div>

                <div className="user-details-list">
                    {user.email && (
                        <div className="detail-item">
                            <FiMail />
                            <div>
                                <label>Email</label>
                                <p>{user.email}</p>
                            </div>
                        </div>
                    )}
                    <div className="detail-item">
                        <FiUser />
                        <div>
                            <label>User ID</label>
                            <p>{user.id}</p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default UserInfoPanel;
