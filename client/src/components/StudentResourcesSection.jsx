import { useState, useEffect } from 'react';
import { userAPI } from '../api';
import { FiFileText, FiDownload, FiFile } from 'react-icons/fi';
import { motion } from 'framer-motion';

const StudentResourcesSection = () => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const response = await userAPI.getStudentResources();
                setResources(response.data || []);
            } catch (error) {
                console.error('Failed to fetch resources:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchResources();
    }, []);

    const getFileIcon = (url) => {
        if (!url) return <FiFile size={24} />;
        const ext = url.split('.').pop().toLowerCase();
        if (['pdf'].includes(ext)) return <FiFileText size={24} color="#ef4444" />;
        if (['doc', 'docx'].includes(ext)) return <FiFileText size={24} color="#3b82f6" />;
        if (['ppt', 'pptx'].includes(ext)) return <FiFileText size={24} color="#f59e0b" />;
        if (['xls', 'xlsx'].includes(ext)) return <FiFileText size={24} color="#10b981" />;
        return <FiFile size={24} color="#64748b" />;
    };

    const getResourceLink = (url) => {
        if (!url) return '#';
        if (url.startsWith('http')) return url;
        return `http://localhost:5000${url}`;
    };

    if (loading) {
        return <div className="loading-spinner"></div>;
    }

    return (
        <div className="resources-section">
            <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', color: '#1e293b' }}>Course Resources & Notes</h2>

            {resources.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {resources.map((resource, index) => (
                        <motion.div
                            key={resource.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-card"
                            style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                        >
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div style={{ padding: '10px', background: '#f1f5f9', borderRadius: '10px' }}>
                                        {getFileIcon(resource.videoUrl)}
                                    </div>
                                    <span style={{ fontSize: '0.75rem', padding: '4px 8px', background: '#dbeafe', color: '#1e40af', borderRadius: '4px', fontWeight: '600' }}>
                                        {resource.batch?.name || 'General'}
                                    </span>
                                </div>

                                <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: '#1e293b' }}>{resource.title}</h3>
                                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '16px', lineHeight: '1.5' }}>
                                    {resource.description || 'No description provided.'}
                                </p>
                            </div>

                            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <img src={resource.uploadedBy?.avatar} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{resource.uploadedBy?.name}</span>
                                </div>
                                <a
                                    href={getResourceLink(resource.videoUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-primary"
                                    style={{
                                        padding: '8px 16px',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        textDecoration: 'none'
                                    }}
                                >
                                    <FiDownload /> Download
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <FiFile size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <p>No resources uploaded for your batch yet.</p>
                </div>
            )}
        </div>
    );
};

export default StudentResourcesSection;
