import { useState } from 'react';
import './MentorPages.css';

const AttendanceUpload = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'text/csv') {
            setFile(selectedFile);
            parseCSV(selectedFile);
            setError('');
        } else {
            setError('Please upload a valid CSV file');
            setFile(null);
            setPreview([]);
        }
    };

    const parseCSV = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            const data = [];

            for (let i = 1; i < Math.min(lines.length, 6); i++) {
                if (lines[i].trim()) {
                    const values = lines[i].split(',').map(v => v.trim());
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index] || '';
                    });
                    data.push(row);
                }
            }
            setPreview(data);
        };
        reader.readAsText(file);
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Simulate upload - in production, this would send to backend
            await new Promise(resolve => setTimeout(resolve, 1500));
            setSuccess(`Successfully processed ${preview.length} attendance records!`);
            setFile(null);
            setPreview([]);
        } catch (err) {
            setError('Failed to upload attendance. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mentor-page">
            <div className="page-header">
                <h1>Upload Offline Attendance</h1>
                <p>Upload CSV file containing attendance records for offline sessions</p>
            </div>

            <div className="upload-section">
                <div className="file-upload-area">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        id="csv-upload"
                        className="file-input"
                    />
                    <label htmlFor="csv-upload" className="file-label">
                        <div className="upload-icon">📄</div>
                        <p>{file ? file.name : 'Click or drag CSV file here'}</p>
                        <span className="file-hint">Supported format: CSV (max 5MB)</span>
                    </label>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {preview.length > 0 && (
                    <div className="preview-section">
                        <h3>Preview (First 5 rows)</h3>
                        <div className="table-container">
                            <table className="attendance-table">
                                <thead>
                                    <tr>
                                        {Object.keys(preview[0]).map(header => (
                                            <th key={header}>{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.map((row, index) => (
                                        <tr key={index}>
                                            {Object.values(row).map((value, i) => (
                                                <td key={i}>{value}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button
                            className="submit-btn"
                            onClick={handleUpload}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Upload Attendance'}
                        </button>
                    </div>
                )}

                <div className="format-guide">
                    <h3>CSV Format Guide</h3>
                    <p>Your CSV file should contain the following columns:</p>
                    <ul>
                        <li><strong>student_email</strong> - Student's registered email</li>
                        <li><strong>session_id</strong> - Session identifier</li>
                        <li><strong>attendance_date</strong> - Date (YYYY-MM-DD)</li>
                        <li><strong>status</strong> - PRESENT or ABSENT</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AttendanceUpload;
