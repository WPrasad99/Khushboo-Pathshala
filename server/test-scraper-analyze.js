const fs = require('fs');

try {
    const html = fs.readFileSync('debug_html.txt', 'utf8');
    const index = html.indexOf('ytInitialData');

    if (index !== -1) {
        console.log('Found ytInitialData at index:', index);
        console.log('Snippet:', html.substring(index - 50, index + 100));
    } else {
        console.log('ytInitialData NOT found');
    }
} catch (e) {
    console.error('Error:', e);
}
