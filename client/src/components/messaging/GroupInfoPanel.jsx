import React, { useState, useEffect } from 'react';
import { FiX, FiUserPlus, FiUserMinus, FiEdit2, FiLogOut } from 'react-icons/fi';
import { motion } from 'framer-motion';
import './GroupInfoPanel.css';

const GroupInfoPanel = ({ group, onClose, currentUserId }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [groupName, setGroupName] = useState(group.name);
    const [groupDescription, setGroupDescription] = useState(group.description || '');
    const [members, setMembers] = useState(group.members || []);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [showAddMember, setShowAddMember] = useState(false);

    const isAdmin = members.find(m => m.userId === currentUserId)?.role === 'admin';

    useEffect(() => {
        setGroupName(group.name);
        setGroupDescription(group.description || '');
        setMembers(group.members || []);
        setIsEditing(false);
        setShowAddMember(false);
    }, [group]);

    useEffect(() => {
        if (showAddMember) {
            fetchAvailableUsers();
        }
    }, [showAddMember]);

    const fetchAvailableUsers = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/chat/users', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const users = await response.json();
            const memberIds = members.map(m => m.userId);
            setAvailableUsers(users.filter(u => !memberIds.includes(u.id)));
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const handleUpdateGroup = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/chat/groups/${group.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ name: groupName, description: groupDescription })
            });

            if (response.ok) {
                setIsEditing(false);
                alert('Group updated successfully');
            }
        } catch (error) {
            console.error('Failed to update group:', error);
            alert('Failed to update group');
        }
    };

    const handleAddMember = async (userId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/chat/groups/${group.id}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ userIds: [userId] })
            });

            if (response.ok) {
                const newMembers = await response.json();
                setMembers([...members, ...newMembers]);
                setShowAddMember(false);
            }
        } catch (error) {
            console.error('Failed to add member:', error);
            alert('Failed to add member');
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!confirm('Remove this member from the group?')) return;

        try {
            const response = await fetch(`http://localhost:5000/api/chat/groups/${group.id}/members/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.ok) {
                setMembers(members.filter(m => m.userId !== userId));
            }
        } catch (error) {
            console.error('Failed to remove member:', error);
            alert('Failed to remove member');
        }
    };

    const handleLeaveGroup = async () => {
        if (!confirm('Are you sure you want to leave this group?')) return;

        try {
            const response = await fetch(`http://localhost:5000/api/chat/groups/${group.id}/leave`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.ok) {
                onClose();
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to leave group:', error);
            alert('Failed to leave group');
        }
    };

    return (
        <motion.div
            className="group-info-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween' }}
        >
            <div className="group-info-header">
                <h2>Group Info</h2>
                <button onClick={onClose} className="close-panel-btn">
                    <FiX />
                </button>
            </div>

            <div className="group-info-content">
                {isEditing ? (
                    <div className="edit-group-form">
                        <label>
                            Group Name
                            <input
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                            />
                        </label>
                        <label>
                            Description
                            <textarea
                                value={groupDescription}
                                onChange={(e) => setGroupDescription(e.target.value)}
                                rows={3}
                            />
                        </label>
                        <div className="edit-actions">
                            <button onClick={handleUpdateGroup} className="save-btn">Save</button>
                            <button onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div className="group-details">
                        <h3>{group.name}</h3>
                        {group.description && <p>{group.description}</p>}
                        {isAdmin && (
                            <button onClick={() => setIsEditing(true)} className="edit-group-btn">
                                <FiEdit2 /> Edit Group
                            </button>
                        )}
                    </div>
                )}

                <div className="members-section">
                    <div className="members-header">
                        <h4>{members.length} Members</h4>
                        {isAdmin && (
                            <button onClick={() => setShowAddMember(!showAddMember)} className="add-member-btn">
                                <FiUserPlus /> Add Member
                            </button>
                        )}
                    </div>

                    {showAddMember && (
                        <div className="add-member-list">
                            {availableUsers.map(user => (
                                <div key={user.id} className="available-user" onClick={() => handleAddMember(user.id)}>
                                    <span>{user.name}</span>
                                    <FiUserPlus />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="members-list">
                        {members.map(member => (
                            <div key={member.userId} className="member-item">
                                <div className="member-avatar">
                                    {member.user?.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="member-info">
                                    <div className="member-name">{member.user?.name}</div>
                                    <div className="member-role">{member.role}</div>
                                </div>
                                {isAdmin && member.userId !== currentUserId && (
                                    <button
                                        onClick={() => handleRemoveMember(member.userId)}
                                        className="remove-member-btn"
                                    >
                                        <FiUserMinus />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <button onClick={handleLeaveGroup} className="leave-group-btn">
                    <FiLogOut /> Leave Group
                </button>
            </div>
        </motion.div>
    );
};

export default GroupInfoPanel;
