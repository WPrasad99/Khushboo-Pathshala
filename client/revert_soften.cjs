const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(file => {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            walk(filepath, callback);
        } else if (filepath.endsWith('.css') || filepath.endsWith('.jsx')) {
            callback(filepath);
        }
    });
}

const themeCJS_reverts = {
    // Light
    "--admin-bg-color: #F1F5F9": "--admin-bg-color: #F8FAFC",
    "--admin-surface: #F8FAFC": "--admin-surface: #FFFFFF",
    "--admin-section-bg: #E2E8F0": "--admin-section-bg: #F1F5F9",
    "--color-bg: #F1F5F9": "--color-bg: #F8FAFC",
    "--color-surface: #F8FAFC": "--color-surface: #FFFFFF",
    "--color-surface-elevated: #F8FAFC": "--color-surface-elevated: #FFFFFF",
    "--bg-primary: #F1F5F9": "--bg-primary: #F8FAFC",
    "--bg-secondary: #F8FAFC": "--bg-secondary: #FFFFFF",
    "--bg-tertiary: #E2E8F0": "--bg-tertiary: #F1F5F9",

    // Dark
    "--admin-bg-color: #1E293B": "--admin-bg-color: #0f172a",
    "--admin-surface: #334155": "--admin-surface: #1e293b",
    "--admin-section-bg: #334155": "--admin-section-bg: #111827",
    "--color-bg: #1E293B": "--color-bg: #0B1220",
    "--color-surface: #334155": "--color-surface: #111827",
    "--bg-primary: #1E293B": "--bg-primary: #0B1220",
    "--bg-secondary: #334155": "--bg-secondary: #111827",
    "--bg-tertiary: #475569": "--bg-tertiary: #1E293B",
};

walk(path.join(__dirname, 'src'), (filepath) => {
    let content = fs.readFileSync(filepath, 'utf8');
    let original = content;

    // Apply exact string reversals for the theme declarations (mainly index.css)
    for (const [newVal, oldVal] of Object.entries(themeCJS_reverts)) {
        content = content.split(newVal).join(oldVal);
    }
    
    // We replaced these static hex codes with variables inside CSS blocks. Revert them for the dark mode blocks specifically.
    // Instead of naive regex, let's look at the affected files.
    // For CSS components (Auth.css, Modal.css, ChatBot.css, etc.), we had background: var(--bg-secondary) replacing #fff.
    // Since we appended the dark mode theme dynamically with append_dark_css.cjs (which added var(--bg-secondary)),
    // the soften_components script replaced `background: white` -> `background: var(--bg-secondary)` in the normal light mode CSS!
    
    // So for light mode, var(--bg-secondary) in `.css` files (NOT index.css data-theme) was originally white/#fff.
    // Let's change light mode background: var(--bg-secondary) back to background: #ffffff.
    if (!filepath.includes('index.css') && !filepath.includes('AdminDashboard.css') && filepath.endsWith('.css')) {
        // Warning: This could affect the appended dark mode CSS! Dark mode CSS has `[data-theme="dark"] .class { background: var(--bg-secondary) }`.
        // We only want to target lines WITHOUT [data-theme="dark"]!
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (!lines[i].includes('[data-theme="dark"]')) {
                // Revert var(--bg-secondary) back to #FFFFFF
                lines[i] = lines[i].replace(/background(-color)?:\s*var\(--bg-secondary\)/gi, "background$1: #ffffff");
                // Revert var(--bg-primary) back to #F8FAFC
                lines[i] = lines[i].replace(/background(-color)?:\s*var\(--bg-primary\)/gi, "background$1: #F8FAFC");
                // Restore text colors:
                lines[i] = lines[i].replace(/color:\s*var\(--text-primary\)/gi, "color: #0F172A");
            }
        }
        content = lines.join('\n');
    }

    // For Auth.css specifically, we changed #1F2937 -> var(--bg-tertiary) and #111827 -> var(--bg-secondary)
    if (filepath.includes('Auth.css')) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (!lines[i].includes('[data-theme="dark"]')) {
                lines[i] = lines[i].replace(/background(-color)?:\s*var\(--bg-tertiary\)/gi, "background$1: #1F2937");
            }
        }
        content = lines.join('\n');
    }

    if (content !== original) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`Reverted soften styles in: ${path.basename(filepath)}`);
    }
});
console.log('Finished reverting softened themes.');
