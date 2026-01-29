import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../api';
import { motion } from 'framer-motion';
import './Auth.css';

const AdditionalInfo = () => {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        phoneNumber: '',
        educationLevel: '',
        institutionName: '',
        interests: '',
        bio: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await userAPI.updateProfile(formData);
            // Refresh user data or manually update context
            // For now just navigate
            navigate('/dashboard');
        } catch (error) {
            console.error('Failed to update profile:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-background">
                <div className="auth-bg-shape auth-bg-shape-1"></div>
                <div className="auth-bg-shape auth-bg-shape-2"></div>
                <div className="auth-bg-shape auth-bg-shape-3"></div>
            </div>

            <motion.div
                className="additional-info-page"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="additional-info-container">
                    <div className="info-header">
                        <h2>Complete Your Profile</h2>
                        <p>Help us personalize your learning experience by providing a few more details about yourself.</p>

                        <div style={{ marginTop: '30px' }}>
                            <button
                                className="skip-link"
                                onClick={() => navigate('/dashboard')}
                                style={{ textAlign: 'left', padding: 0 }}
                            >
                                Skip for now →
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="info-form">
                        <div className="input-group">
                            <label>Phone Number</label>
                            <div className="phone-input-group">
                                <select className="select country-code" style={{ paddingRight: '12px', backgroundImage: 'none', textAlign: 'center' }}>
                                    <option>+91</option>
                                    <option>+1</option>
                                </select>
                                <input
                                    type="tel"
                                    className="input"
                                    name="phoneNumber"
                                    placeholder="98765 43210"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Education Level</label>
                            <select
                                className="select"
                                name="educationLevel"
                                value={formData.educationLevel}
                                onChange={handleChange}
                            >
                                <option value="">Select Level</option>
                                <option value="High School">High School</option>
                                <option value="Undergraduate">Undergraduate</option>
                                <option value="Postgraduate">Postgraduate</option>
                                <option value="Professional">Professional</option>
                            </select>
                        </div>

                        <div className="input-group full-width">
                            <label>Institution / Company Name</label>
                            <input
                                type="text"
                                className="input"
                                name="institutionName"
                                placeholder="Where do you study or work?"
                                value={formData.institutionName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-group full-width">
                            <label>Areas of Interest</label>
                            <input
                                type="text"
                                className="input"
                                name="interests"
                                placeholder="e.g. Web Development, Data Science, Design"
                                value={formData.interests}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="input-group full-width" style={{ marginBottom: '20px' }}>
                            <label>Bio (Optional)</label>
                            <textarea
                                className="input"
                                name="bio"
                                rows="3"
                                placeholder="Tell us a bit about yourself..."
                                value={formData.bio}
                                onChange={handleChange}
                                style={{ resize: 'none' }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn full-width"
                            disabled={loading}
                            style={{ marginTop: 0 }}
                        >
                            {loading ? 'Saving Profile...' : 'Complete Profile'}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default AdditionalInfo;
