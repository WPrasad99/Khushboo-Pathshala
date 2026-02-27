import { useState, useEffect } from 'react';
import { userAPI, API_BASE } from '../api';
import { FiFileText, FiDownload, FiFile, FiFolder } from 'react-icons/fi';
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
        if (!url) return <FiFile />;
        const ext = url.split('.').pop().toLowerCase();
        if (['pdf'].includes(ext)) return <FiFileText style={{ color: '#EF4444' }} />;
        if (['doc', 'docx'].includes(ext)) return <FiFileText style={{ color: '#3B82F6' }} />;
        if (['ppt', 'pptx'].includes(ext)) return <FiFileText style={{ color: '#F59E0B' }} />;
        if (['xls', 'xlsx'].includes(ext)) return <FiFileText style={{ color: '#10B981' }} />;
        return <FiFile />;
    };

    const getResourceLink = (url) => {
        if (!url) return '#';
        if (url.startsWith('http')) return url;
        return `${API_BASE}${url}`;
    };

    if (loading) {
        return (
            <div className="stat-card-grid">
                {[1, 2, 3].map(i => <div key={i} className="card skeleton" style={{ height: 200 }} />)}
            </div>
        );
    }

    return (
        <div className="resources-section">
            <header style={{ marginBottom: 'var(--space-24)' }}>
                <h3>Course Resources & Notes</h3>
                <p>Access all materials provided for your batch.</p>
            </header>

            {resources.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-24)' }}>
                    {resources.map((resource, index) => (
                        <motion.div
                            key={resource.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.08 }}
                            className="card"
                            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div className="stat-icon-wrapper" style={{ background: 'var(--color-bg)', fontSize: 'var(--fs-h2)' }}>
                                    {getFileIcon(resource.videoUrl)}
                                </div>
                                <span className="badge badge-primary">
                                    {resource.batch?.name || 'General'}
                                </span>
                            </div>

                            <div>
                                <h4 style={{ fontSize: 'var(--fs-h3)', marginBottom: '8px' }}>{resource.title}</h4>
                                <p style={{ fontSize: 'var(--fs-body)', color: 'var(--color-text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {resource.description || 'No description provided.'}
                                </p>
                            </div>

                            <div style={{ marginTop: 'auto', paddingTop: 'var(--space-16)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <img src={resource.uploadedBy?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${resource.uploadedBy?.name}`} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--color-border)' }} />
                                    <span style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-medium)' }}>{resource.uploadedBy?.name}</span>
                                </div>
                                <a
                                    href={getResourceLink(resource.videoUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary"
                                    style={{ padding: '8px 14px', fontSize: 'var(--fs-small)' }}
                                >
                                    <FiDownload /> Download
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="card" style={{ padding: '64px', textAlign: 'center', background: 'var(--color-bg)', borderStyle: 'dashed' }}>
                    <FiFolder size={48} style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }} />
                    <h4>No resources found</h4>
                    <p>Materials for your batch will appear here once uploaded by your mentor.</p>
                </div>
            )}
        </div>
    );
};

export default StudentResourcesSection;
