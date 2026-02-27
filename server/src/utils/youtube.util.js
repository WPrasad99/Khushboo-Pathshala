const fetchPlaylistData = async (playlistId) => {
    try {
        const response = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });
        const html = await response.text();

        const marker = 'ytInitialData =';
        let startIndex = html.indexOf(marker);
        if (startIndex === -1) return null;

        startIndex += marker.length;

        while (startIndex < html.length && html[startIndex] !== '{') {
            startIndex++;
        }

        if (startIndex >= html.length) return null;

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

        if (!found) return null;

        const jsonString = html.substring(startIndex, endIndex);
        const data = JSON.parse(jsonString);

        const contents = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents;

        if (!contents) return null;

        const lessons = contents
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

        return lessons;
    } catch (error) {
        console.error('Error fetching playlist data:', error);
        return null;
    }
};

module.exports = { fetchPlaylistData };
