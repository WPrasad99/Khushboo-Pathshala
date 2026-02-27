import React, { useState } from 'react';
import { useMentorUploads } from '../../../hooks/mentor/useMentorQueries';
import { FileUp, File, Video, Trash2 } from 'lucide-react';

const SessionsList = () => {
    const [uploadType, setUploadType] = useState('SESSION');
    const { data: uploadsData, isLoading } = useMentorUploads(uploadType);

    return (
        <div className="m-section">
            <div className="mentor-page-header">
                <h2 className="mentor-page-title">Learning Resources</h2>
                <div className="mentor-header-actions">
                    <select
                        className="m-select"
                        value={uploadType}
                        onChange={(e) => setUploadType(e.target.value)}
                    >
                        <option value="SESSION">Video Sessions</option>
                        <option value="RESOURCE">Documents / PDFs</option>
                    </select>

                    <button className="m-btn m-btn--primary">
                        <FileUp size={18} /> Upload New
                    </button>
                </div>
            </div>

            <div className="m-grid-3">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="m-skeleton m-skeleton--h200" />
                    ))
                ) : uploadsData?.length > 0 ? (
                    uploadsData.map((resource) => (
                        <div key={resource.id} className="m-card m-card--interactive">
                            <div className="resource-card__head">
                                <div className={`resource-card__icon-wrap ${resource.type !== 'SESSION' ? 'resource-card__icon-wrap--doc' : ''}`}>
                                    {resource.type === 'SESSION' ? <Video /> : <File />}
                                </div>
                                <span className="resource-card__title">{resource.title}</span>
                            </div>
                            <p className="resource-card__desc">{resource.description}</p>
                            <div className="resource-card__footer">
                                <span className="resource-card__date">{new Date(resource.createdAt).toLocaleDateString()}</span>
                                <button className="resource-card__delete" title="Delete">
                                    <Trash2 />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="m-empty-state">
                        <FileUp size={48} />
                        <h3 className="m-empty-state__title">No Resources Uploaded</h3>
                        <p className="m-empty-state__desc">
                            You have not uploaded any {uploadType === 'SESSION' ? 'video sessions' : 'documents'} yet.
                        </p>
                        <button className="m-btn m-btn--primary">Upload First Resource</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SessionsList;
