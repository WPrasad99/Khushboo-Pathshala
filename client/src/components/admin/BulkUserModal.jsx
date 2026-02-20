import { useState } from 'react';
import { adminAPI } from '../../api';
import { FiX, FiUpload, FiDownload, FiCheck, FiAlertCircle, FiUsers, FiLayers } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import './Modal.css';

const BulkUserModal = ({ onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [batchName, setBatchName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successData, setSuccessData] = useState(null);
    const [step, setStep] = useState(1); // 1: Upload, 2: Batch, 3: Success

    const handleFileUpload = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    setError('The file is empty.');
                    return;
                }

                // Validate columns
                const headers = Object.keys(jsonData[0]);
                const requiredHeaders = ['name', 'email'];
                const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

                if (missingHeaders.length > 0) {
                    setError(`Missing columns: ${missingHeaders.join(', ')}`);
                    return;
                }

                setPreviewData(jsonData);
                setFile(selectedFile);
                setError('');
                setStep(2);
            } catch (err) {
                console.error('File parsing error:', err);
                setError('Failed to parse file. Please ensure it is a valid Excel or CSV file.');
            }
        };
        reader.readAsArrayBuffer(selectedFile);
    };

    const handleSubmit = async () => {
        if (!batchName) {
            setError('Please enter a batch name');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await adminAPI.bulkCreateUsers({
                users: previewData,
                batchName
            });
            setSuccessData(response.data);
            setStep(3);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create bulk users');
        } finally {
            setLoading(false);
        }
    };

    const downloadCredentials = () => {
        if (!successData?.createdUsers) return;

        const dataToSave = successData.createdUsers.map(u => ({
            Name: u.name,
            Email: u.email,
            Password: u.password,
            Batch: successData.batch.name
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToSave);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Credentials");
        XLSX.writeFile(workbook, `Bulk_Users_${batchName}_Credentials.xlsx`);
    };

    return (
        <AnimatePresence>
            <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="glass-modal"
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    style={{ maxWidth: '600px' }}
                >
                    <div className="modal-header">
                        <h2>Bulk User Creation</h2>
                        <button onClick={onClose} className="modal-close-btn">
                            <FiX size={20} />
                        </button>
                    </div>

                    <div className="modal-body">
                        {error && (
                            <motion.div
                                className="error-message"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    padding: 'var(--space-20)',
                                    borderRadius: '12px',
                                    marginBottom: '20px',
                                    fontSize: 'var(--fs-body)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <FiAlertCircle /> {error}
                            </motion.div>
                        )}

                        {step === 1 && (
                            <div className="upload-step" style={{ textAlign: 'center', padding: '20px 0' }}>
                                <div
                                    className="upload-dropzone"
                                    onClick={() => document.getElementById('bulk-file-input').click()}
                                    style={{
                                        border: '2px dashed rgba(74, 144, 226, 0.3)',
                                        borderRadius: '16px',
                                        padding: '40px',
                                        cursor: 'pointer',
                                        background: 'rgba(74, 144, 226, 0.05)',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <FiUpload size={48} style={{ color: '#4a90e2', marginBottom: '16px' }} />
                                    <h3>Upload Excel or CSV</h3>
                                    <p style={{ color: 'var(--color-text-)', marginTop: '8px' }}>
                                        Excel must contain columns named <strong>'name'</strong> and <strong>'email'</strong>
                                    </p>
                                    <input
                                        type="file"
                                        id="bulk-file-input"
                                        hidden
                                        accept=".xlsx, .xls, .csv"
                                        onChange={handleFileUpload}
                                    />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="batch-step">
                                <div className="glass-form-group">
                                    <label className="glass-label">Found {previewData.length} users in file.</label>
                                    <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'rgba(255,255,255,0.5)', borderRadius: '12px', padding: '10px', marginBottom: '20px' }}>
                                        <table style={{ width: '100%', fontSize: 'var(--fs-body)' }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ textAlign: 'left' }}>Name</th>
                                                    <th style={{ textAlign: 'left' }}>Email</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewData.slice(0, 5).map((u, i) => (
                                                    <tr key={i}>
                                                        <td>{u.name}</td>
                                                        <td>{u.email}</td>
                                                    </tr>
                                                ))}
                                                {previewData.length > 5 && (
                                                    <tr>
                                                        <td colSpan="2" style={{ textAlign: 'center', color: 'var(--color-text-)' }}>... and {previewData.length - 5} more</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="glass-form-group">
                                    <label className="glass-label">Assign to Batch</label>
                                    <div className="glass-input-group">
                                        <input
                                            type="text"
                                            className="glass-input"
                                            value={batchName}
                                            onChange={(e) => setBatchName(e.target.value)}
                                            placeholder="Enter batch name (e.g. Python 2024)"
                                            required
                                        />
                                        <FiLayers className="glass-input-icon" />
                                    </div>
                                    <small style={{ color: 'var(--color-text-)', display: 'block', marginTop: '8px' }}>
                                        If the batch doesn't exist, it will be created automatically.
                                    </small>
                                </div>

                                <div className="modal-actions" style={{ marginTop: '30px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="btn-glass-secondary"
                                        disabled={loading}
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        className="btn-glass-primary"
                                        disabled={loading}
                                    >
                                        {loading ? 'Processing...' : 'Create Users'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="success-step" style={{ textAlign: 'center', padding: '20px 0' }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    background: '#10b981',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 20px',
                                    color: 'white'
                                }}>
                                    <FiCheck size={32} />
                                </div>
                                <h2 style={{ color: '#10b981' }}>Success!</h2>
                                <p style={{ color: 'var(--color-text-)', margin: '16px 0 24px' }}>
                                    {successData?.message}
                                </p>

                                {successData?.errors?.length > 0 && (
                                    <div style={{ textAlign: 'left', background: 'rgba(239, 68, 68, 0.05)', padding: 'var(--space-20)', borderRadius: '12px', marginBottom: '24px' }}>
                                        <p style={{ color: '#ef4444', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-body)', marginBottom: '8px' }}>
                                            Errors ({successData.errors.length}):
                                        </p>
                                        <ul style={{ fontSize: 'var(--fs-small)', color: 'var(--color-text-)', maxHeight: '100px', overflowY: 'auto' }}>
                                            {successData.errors.map((err, i) => (
                                                <li key={i}>{err.email}: {err.error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div style={{ display: 'grid', gap: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={downloadCredentials}
                                        className="btn-glass-primary"
                                        style={{ width: '100%', justifyContent: 'center' }}
                                    >
                                        <FiDownload /> Download Credentials
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="btn-glass-secondary"
                                        style={{ width: '100%', justifyContent: 'center' }}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default BulkUserModal;
