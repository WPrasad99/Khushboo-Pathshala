const fs = require('fs');

// Helper: Fetch YouTube Playlist Data using global fetch
const fetchPlaylistData = async (playlistId) => {
    try {
        const url = `https://www.youtube.com/playlist?list=${playlistId}`;
        console.log('Fetching:', url);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        const html = await response.text();
        console.log(`Received HTML length: ${html.length}`);

        // Write to file for debugging
        fs.writeFileSync('debug_html.txt', html);
        console.log('Wrote HTML to debug_html.txt');

    } catch (error) {
        console.error('Error fetching playlist data:', error);
    }
};

fetchPlaylistData('PLWKjhJtqVAbnZtk71d4t7a5n6G3P_tFfC');
