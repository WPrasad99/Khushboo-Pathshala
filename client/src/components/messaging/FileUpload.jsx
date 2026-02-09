import React, { useState, useRef } from 'react';
import { FiPaperclip, FiX, FiFile, FiImage } from 'react-icons/fi';
import './FileUpload.css';

const FileUpload = ({ onFilesSelected, disabled }) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + selectedFiles.length > 5) {
            alert('Maximum 5 files allowed');
            return;
        }

        // Check file sizes
        const oversized = files.filter(f => f.size > 10 * 1024 * 1024);
        if (oversized.length > 0) {
            alert('Some files exceed 10MB limit');
            return;
        }

        const newFiles = [...selectedFiles, ...files];
        setSelectedFiles(newFiles);
        onFilesSelected(newFiles);
    };

    const removeFile = (index) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);
        onFilesSelected(newFiles);
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const getFileIcon = (file) => {
        if (file.type.startsWith('image/')) return <FiImage />;
        return <FiFile />;
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="file-upload-container">
            <button
                type="button"
                className="file-upload-btn"
                onClick={handleButtonClick}
                disabled={disabled || selectedFiles.length >= 5}
                title="Attach files"
            >
                <FiPaperclip />
            </button>

            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            {selectedFiles.length > 0 && (
                <div className="file-preview-list">
                    {selectedFiles.map((file, index) => (
                        <div key={index} className="file-preview-item">
                            <div className="file-icon">{getFileIcon(file)}</div>
                            <div className="file-info">
                                <span className="file-name">{file.name}</span>
                                <span className="file-size">{formatFileSize(file.size)}</span>
                            </div>
                            <button
                                type="button"
                                className="remove-file-btn"
                                onClick={() => removeFile(index)}
                            >
                                <FiX />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileUpload;
