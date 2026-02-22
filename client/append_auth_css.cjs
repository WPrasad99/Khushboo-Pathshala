const fs = require('fs');
const path = require('path');

const fullPath = '/Users/macbook/Documents/Khushboo-Pathshala/client/src/pages/auth/Auth.css';
if (!fs.existsSync(fullPath)) process.exit(0);

let content = fs.readFileSync(fullPath, 'utf8');

if (!content.includes('[data-theme="dark"] .login-container')) {
    content += `
/* Dark Theme Options */
[data-theme="dark"] .login-container {
    background-color: var(--bg-primary);
}
[data-theme="dark"] .login-card {
    background: var(--bg-secondary);
    border-color: var(--border-subtle);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}
[data-theme="dark"] .login-title {
    color: var(--text-primary);
}
[data-theme="dark"] .login-subtitle {
    color: var(--text-secondary);
}
[data-theme="dark"] .form-input {
    background: var(--bg-tertiary);
    border-color: var(--border-subtle);
    color: var(--text-primary);
}
[data-theme="dark"] .form-input:focus {
    border-color: var(--color-primary);
}
[data-theme="dark"] .input-icon {
    color: var(--text-muted);
}
`;
    fs.writeFileSync(fullPath, content, 'utf8');
}
