const fs = require('fs');
const path = require('path');

const cssPaths = [
    'src/components/messaging/MessageSearch.css',
    'src/components/messaging/GroupInfoPanel.css',
    'src/components/messaging/FileUpload.css',
    'src/components/messaging/CreateGroupModal.css',
    'src/components/messaging/ReactionPicker.css',
    'src/components/ChatBot.css',
    'src/components/admin/Modal.css'
];

const basePath = '/Users/macbook/Documents/Khushboo-Pathshala/client';

const darkThemeAdditions = {
    'MessageSearch.css': `
/* Dark Theme */
[data-theme="dark"] .message-search {
    background: var(--bg-secondary);
    border-color: var(--border-subtle);
}
[data-theme="dark"] .search-header {
    border-color: var(--border-subtle);
}
[data-theme="dark"] .search-header h3 {
    color: var(--text-primary);
}
[data-theme="dark"] .search-input {
    background: var(--bg-tertiary);
}
[data-theme="dark"] .search-input input {
    color: var(--text-primary);
}
[data-theme="dark"] .search-result-item:hover {
    background: var(--bg-tertiary);
}
[data-theme="dark"] .result-name {
    color: var(--text-primary);
}
`,
    'GroupInfoPanel.css': `
/* Dark Theme */
[data-theme="dark"] .group-info-panel,
[data-theme="dark"] .group-info-mobile-modal {
    background: var(--bg-secondary);
    border-color: var(--border-subtle);
    color: var(--text-primary);
}
[data-theme="dark"] .panel-header {
    border-color: var(--border-subtle);
}
[data-theme="dark"] .panel-header h3 {
    color: var(--text-primary);
}
[data-theme="dark"] .group-basic-info h4 {
    color: var(--text-primary);
}
[data-theme="dark"] .panel-section {
    border-color: var(--border-subtle);
}
[data-theme="dark"] .panel-section h5 {
    color: var(--text-secondary);
}
[data-theme="dark"] .member-item:hover {
    background: var(--bg-tertiary);
}
[data-theme="dark"] .member-name {
    color: var(--text-primary);
}
[data-theme="dark"] .media-item {
    background: var(--bg-tertiary);
}
`,
    'FileUpload.css': `
/* Dark Theme */
[data-theme="dark"] .file-upload-container,
[data-theme="dark"] .attachment-preview {
    background: var(--bg-secondary);
    border-color: var(--border-subtle);
}
[data-theme="dark"] .upload-actions button {
    color: var(--text-secondary);
}
[data-theme="dark"] .upload-actions button:hover {
    background: var(--bg-tertiary);
}
[data-theme="dark"] .file-info {
    color: var(--text-primary);
}
[data-theme="dark"] .file-name {
    color: var(--text-primary);
}
`,
    'CreateGroupModal.css': `
/* Dark Theme */
[data-theme="dark"] .modal-content {
    background: var(--bg-secondary);
}
[data-theme="dark"] .modal-header {
    border-color: var(--border-subtle);
}
[data-theme="dark"] .modal-header h2 {
    color: var(--text-primary);
}
[data-theme="dark"] .form-group label {
    color: var(--text-secondary);
}
[data-theme="dark"] .form-group input {
    background: var(--bg-tertiary);
    border-color: var(--border-subtle);
    color: var(--text-primary);
}
[data-theme="dark"] .user-list-item {
    border-color: var(--border-subtle);
}
[data-theme="dark"] .user-list-item:hover {
    background: var(--bg-tertiary);
}
[data-theme="dark"] .user-name {
    color: var(--text-primary);
}
`,
    'ReactionPicker.css': `
/* Dark Theme */
[data-theme="dark"] .reaction-picker-container {
    background: var(--bg-secondary);
    border-color: var(--border-subtle);
}
[data-theme="dark"] .reaction-btn:hover {
    background: var(--bg-tertiary);
}
`,
    'ChatBot.css': `
/* Dark Theme */
[data-theme="dark"] .chatbot-window {
    background: var(--bg-secondary);
    border-color: var(--border-subtle);
}
[data-theme="dark"] .chatbot-messages {
    background: var(--bg-primary);
}
[data-theme="dark"] .message.bot .message-content {
    background: var(--bg-tertiary);
    color: var(--text-primary);
}
[data-theme="dark"] .chatbot-input {
    background: var(--bg-secondary);
    border-color: var(--border-subtle);
}
[data-theme="dark"] .chatbot-input input {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border-color: var(--border-subtle);
}
`,
    'Modal.css': `
/* Dark Theme */
[data-theme="dark"] .glass-modal,
[data-theme="dark"] .modal-header,
[data-theme="dark"] .modal-actions {
    background: var(--bg-secondary);
    border-color: var(--border-subtle);
}
[data-theme="dark"] .modal-header h2 {
    color: var(--text-primary);
}
[data-theme="dark"] .glass-input {
    background: var(--bg-tertiary);
    border-color: var(--border-subtle);
    color: var(--text-primary);
}
[data-theme="dark"] .btn-glass-secondary {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border-color: var(--border-subtle);
}
[data-theme="dark"] .btn-glass-secondary:hover {
    background: var(--bg-primary);
}
[data-theme="dark"] .role-select-container {
    background: var(--bg-tertiary);
}
[data-theme="dark"] .role-option.active,
[data-theme="dark"] .user-card-select,
[data-theme="dark"] .step-circle {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border-color: var(--border-subtle);
}
[data-theme="dark"] .user-card-select:hover {
    background: var(--bg-tertiary);
}
[data-theme="dark"] .user-card-select.selected {
    background: rgba(99, 102, 241, 0.2);
    border-color: #6366f1;
}
[data-theme="dark"] .selection-check {
    border-color: var(--border-subtle);
}
[data-theme="dark"] .wizard-progress {
    background: var(--bg-secondary);
    border-color: var(--border-subtle);
}
`
};

cssPaths.forEach(relPath => {
    const fullPath = path.join(basePath, relPath);
    if (!fs.existsSync(fullPath)) return;

    let content = fs.readFileSync(fullPath, 'utf8');
    const fileName = path.basename(relPath);
    const cssToAdd = darkThemeAdditions[fileName];

    // Check if the file already has dark theme additions
    if (cssToAdd && !content.includes('[data-theme="dark"]')) {
        content += '\n' + cssToAdd;
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Appended dark theme to:', fileName);
    }
});
