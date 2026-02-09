import React, { useState, useEffect } from 'react';
import { FiX, FiUsers } from 'react-icons/fi';
import { batchAPI, chatAPI } from '../../api';
import './CreateGroupModal.css';

const CreateGroupModal = ({ onClose, onGroupCreated }) => {
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchBatches();
    }, []);

    const fetchBatches = async () => {
        try {
            const response = await batchAPI.getAll();
            setBatches(response.data || []);
        } catch (err) {
            setError('Failed to load batches');
            console.error('Error fetching batches:', err);
        }
    };

    const handleCreateGroup = async () => {
        if (!selectedBatch) {
            setError('Please select a batch');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await chatAPI.createBatchGroup(selectedBatch);
            onGroupCreated(response.data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create group');
            console.error('Error creating batch group:', err);
        } finally {
            setLoading(false);
        }
    };

    const selectedBatchData = batches.find(b => b.id === selectedBatch);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2><FiUsers /> Create Batch Group</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label htmlFor="batch-select">Select Batch</label>
                        <select
                            id="batch-select"
                            value={selectedBatch}
                            onChange={(e) => setSelectedBatch(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">-- Choose a batch --</option>
                            {batches.map(batch => (
                                <option key={batch.id} value={batch.id}>
                                    {batch.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedBatchData && (
                        <div className="batch-preview">
                            <h4>Group Members Preview:</h4>
                            <p className="member-count">
                                <FiUsers /> {' '}
                                {(selectedBatchData.students?.length || 0) + (selectedBatchData.mentors?.length || 0)} members
                                ({selectedBatchData.students?.length || 0} students, {selectedBatchData.mentors?.length || 0} mentors)
                            </p>
                            <p className="info-text">
                                All students and mentors from this batch will be automatically added to the group.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleCreateGroup}
                        disabled={loading || !selectedBatch}
                    >
                        {loading ? 'Creating...' : 'Create Group'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
