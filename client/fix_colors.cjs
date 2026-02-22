const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(file => {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            walk(filepath, callback);
        } else if (filepath.endsWith('.jsx')) {
            callback(filepath);
        }
    });
}

let modifiedFiles = 0;

walk(path.join(__dirname, 'src'), (filepath) => {
    let content = fs.readFileSync(filepath, 'utf8');
    let original = content;

    // Replace background: 'white' or '#fff' or '#FFFFFF' with 'var(--bg-secondary)'
    content = content.replace(/background:\s*['"](?:white|#fff|#ffffff|#FFFFFF)['"]/g, "background: 'var(--bg-secondary)'");

    // Replace color: '#1e293b' with 'var(--text-primary)'
    content = content.replace(/color:\s*['"]#1e293b['"]/g, "color: 'var(--text-primary)'");

    // Replace color: '#64748B' or '#475569' or '#9ca3af' or '#6b7280' with 'var(--text-secondary)'
    content = content.replace(/color:\s*['"](?:#64748B|#475569|#9ca3af|#6b7280)['"]/gi, "color: 'var(--text-secondary)'");

    // Replace background: '#f8fafc' or '#f1f5f9' with 'var(--bg-tertiary)'
    content = content.replace(/background:\s*['"](?:#f8fafc|#f1f5f9)['"]/g, "background: 'var(--bg-tertiary)'");

    if (content !== original) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`Updated: ${filepath}`);
        modifiedFiles++;
    }
});

console.log(`Total files modified: ${modifiedFiles}`);
