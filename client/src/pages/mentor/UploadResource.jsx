import { useState } from 'react';
import { resourceAPI } from '../../api';
import './MentorPages.css';

const UploadResource = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'TECHNICAL_SKILLS',
        videoUrl: '',
        duration: 60,
        thumbnailUrl: '',
        lessonsCount: 1,
        isHot: false
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await resourceAPI.create(formData);
            setSuccess('Resource uploaded successfully!');
            setFormData({
                title: '',
                description: '',
                category: 'TECHNICAL_SKILLS',
                videoUrl: '',
                duration: 60,
                thumbnailUrl: '',
                lessonsCount: 1,
                isHot: false
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to upload resource');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mentor-page">
            <div className="page-header">
                <h1>Upload Learning Resource</h1>
                <p>Add new educational content for students</p>
            </div>

            <div className="upload-form-container">
                <form onSubmit={handleSubmit} className="upload-form">
                    {success && <div className="alert alert-success">{success}</div>}
                    {error && <div className="alert alert-error">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="title">Resource Title *</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Enter resource title"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description *</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe the learning resource"
                            rows="4"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="category">Category *</label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            >
                                <option value="TECHNICAL_SKILLS">Technical Skills</option>
                                <option value="SOFT_SKILLS">Soft Skills</option>
                                <option value="CAREER_GUIDANCE">Career Guidance</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="duration">Duration (minutes) *</label>
                            <input
                                type="number"
                                id="duration"
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                min="1"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="videoUrl">Video URL / Playlist ID *</label>
                        <input
                            type="text"
                            id="videoUrl"
                            name="videoUrl"
                            value={formData.videoUrl}
                            onChange={handleChange}
                            placeholder="YouTube video URL or playlist ID"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="thumbnailUrl">Thumbnail URL</label>
                        <input
                            type="text"
                            id="thumbnailUrl"
                            name="thumbnailUrl"
                            value={formData.thumbnailUrl}
                            onChange={handleChange}
                            placeholder="URL for the thumbnail image"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="lessonsCount">Number of Lessons</label>
                            <input
                                type="number"
                                id="lessonsCount"
                                name="lessonsCount"
                                value={formData.lessonsCount}
                                onChange={handleChange}
                                min="1"
                            />
                        </div>

                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="isHot"
                                    checked={formData.isHot}
                                    onChange={handleChange}
                                />
                                Mark as Hot/Featured
                            </label>
                        </div>
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Uploading...' : 'Upload Resource'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UploadResource;
