const https = require('https');

// Helper: Fetch YouTube Playlist Data
const fetchPlaylistData = async (playlistId) => {
    return new Promise((resolve, reject) => {
        const url = `https://www.youtube.com/playlist?list=${playlistId}`;
        console.log('Fetching:', url);

        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    // Extract ytInitialData - Try multiple patterns
                    let jsonMatch = data.match(/var ytInitialData\s*=\s*({.+?});/);
                    if (!jsonMatch) {
                        jsonMatch = data.match(/window\["ytInitialData"\]\s*=\s*({.+?});/);
                    }

                    if (!jsonMatch) {
                        console.log('Failed to match ytInitialData');
                        resolve(null);
                        return;
                    }

                    const json = JSON.parse(jsonMatch[1]);

                    // Traverse robustly
                    const tabs = json.contents?.twoColumnBrowseResultsRenderer?.tabs;
                    const tab = tabs?.find(t => t.tabRenderer?.content);
                    const contents = tab?.tabRenderer?.content?.sectionListRenderer?.contents;
                    const itemSection = contents?.find(c => c.itemSectionRenderer)?.itemSectionRenderer;
                    const playlistContents = itemSection?.contents?.[0]?.playlistVideoListRenderer?.contents;

                    if (!playlistContents) {
                        console.log('Playlist contents structure not found');
                        resolve(null);
                        return;
                    }

                    const lessons = playlistContents
                        .filter(item => item.playlistVideoRenderer)
                        .map(item => {
                            const video = item.playlistVideoRenderer;
                            return {
                                title: video.title?.runs?.[0]?.text || 'Untitled Video',
                                videoId: video.videoId,
                                duration: video.lengthText?.simpleText || '0:00'
                            };
                        });

                    console.log(`Successfully scraped ${lessons.length} videos`);
                    if (lessons.length > 0) {
                        console.log('First video:', lessons[0]);
                        console.log('Last video:', lessons[lessons.length - 1]);
                    }
                    resolve(lessons);

                } catch (e) {
                    console.error('Parse error:', e);
                    resolve(null);
                }
            });
        }).on('error', (e) => {
            console.error('Request error:', e);
            resolve(null);
        });
    });
};

// Test with a known public playlist (e.g., freeCodeCamp or similar)
// Playlist ID: PLWKjhJtqVAbnZtk71d4t7a5n6G3P_tFfC (A Python playlist)
fetchPlaylistData('PLWKjhJtqVAbnZtk71d4t7a5n6G3P_tFfC');
