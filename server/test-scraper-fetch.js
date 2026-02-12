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

        if (!response.ok) {
            console.error(`Fetch failed with status: ${response.status}`);
            return null;
        }

        const html = await response.text();
        console.log(`Received HTML length: ${html.length}`);

        // Robust JSON extractor using brace counting
        let startPattern = 'var ytInitialData = ';
        let startIndex = html.indexOf(startPattern);
        if (startIndex === -1) {
            startPattern = 'window["ytInitialData"] = ';
            startIndex = html.indexOf(startPattern);
        }

        if (startIndex === -1) {
            console.log('ytInitialData marker not found');
            return null;
        }

        startIndex += startPattern.length;

        // Find the first '{'
        while (startIndex < html.length && html[startIndex] !== '{') {
            startIndex++;
        }

        if (startIndex >= html.length) {
            console.log('Start brace not found');
            return null;
        }

        let braceCount = 0;
        let endIndex = startIndex;
        let found = false;

        for (let i = startIndex; i < html.length; i++) {
            if (html[i] === '{') {
                braceCount++;
            } else if (html[i] === '}') {
                braceCount--;
            }

            if (braceCount === 0) {
                endIndex = i + 1;
                found = true;
                break;
            }
        }

        if (!found) {
            console.log('End brace not found');
            return null;
        }

        const jsonString = html.substring(startIndex, endIndex);
        let data;
        try {
            data = JSON.parse(jsonString);
        } catch (e) {
            console.error('JSON Parse error:', e.message);
            // console.log('Snippet:', jsonString.substring(0, 100) + ' ... ' + jsonString.substring(jsonString.length - 100));
            return null;
        }

        // Navigate to playlist contents
        const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs;
        const tab = tabs?.find(t => t.tabRenderer?.content);
        const contents = tab?.tabRenderer?.content?.sectionListRenderer?.contents;
        const itemSection = contents?.find(c => c.itemSectionRenderer)?.itemSectionRenderer;
        const playlistContents = itemSection?.contents?.[0]?.playlistVideoListRenderer?.contents;

        if (!playlistContents) {
            console.log('Playlist contents structure not found');
            // console.log('Available keys in data:', Object.keys(data));
            return null;
        }

        const lessons = playlistContents
            .filter(item => item.playlistVideoRenderer)
            .map(item => {
                const video = item.playlistVideoRenderer;
                const thumbnails = video.thumbnail?.thumbnails;
                const thumb = thumbnails?.[thumbnails.length - 1]?.url;

                return {
                    title: video.title?.runs?.[0]?.text || 'Untitled Video',
                    videoId: video.videoId,
                    duration: video.lengthText?.simpleText || '0:00',
                    thumbnailUrl: thumb
                };
            });

        console.log(`Successfully scraped ${lessons.length} videos from playlist`);
        if (lessons.length > 0) {
            console.log('First Lesson:', lessons[0]);
        }
        return lessons;
    } catch (error) {
        console.error('Error fetching playlist data:', error);
        return null;
    }
};

// Test with a known public playlist
fetchPlaylistData('PLWKjhJtqVAbnZtk71d4t7a5n6G3P_tFfC');
