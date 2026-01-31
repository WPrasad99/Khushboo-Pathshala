import re
import urllib.request
import json
import ssl

def extract_playlist_videos(playlist_url):
    try:
        # Bypass SSL verification for legacy python environments if needed
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        response = urllib.request.urlopen(playlist_url, context=ctx)
        html = response.read().decode('utf-8')
        
        # Regex to extract video data from ytInitialData
        # This is a bit brittle but often works for simple extraction
        # Look for "videoRenderer" blocks
        
        videos = []
        
        # Pattern for video ID and Title
        # "videoId":"(.*?)"
        # "title":{"runs":[{"text":"(.*?)"}]}
        
        # It's better to find the big JSON blob `var ytInitialData = {...};`
        json_pattern = re.compile(r'var ytInitialData = ({.*?});</script>')
        match = json_pattern.search(html)
        
        if match:
            data_str = match.group(1)
            data = json.loads(data_str)
            
            # Navigate nicely if possible, or search recursively
            def find_videos(obj, list_out):
                if isinstance(obj, dict):
                    if 'playlistVideoRenderer' in obj:
                        v = obj['playlistVideoRenderer']
                        title = v.get('title', {}).get('runs', [{}])[0].get('text', 'Unknown Video')
                        video_id = v.get('videoId')
                        duration_str = v.get('lengthText', {}).get('simpleText', '0:00')
                        
                        if video_id and title:
                            # Convert duration to seconds
                            parts = duration_str.split(':')
                            duration = 0
                            if len(parts) == 2:
                                duration = int(parts[0]) * 60 + int(parts[1])
                            elif len(parts) == 3:
                                duration = int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
                                
                            list_out.append({
                                'title': title,
                                'videoId': video_id,
                                'duration': duration,
                                'durationStr': duration_str
                            })
                    
                    for k, v in obj.items():
                        find_videos(v, list_out)
                elif isinstance(obj, list):
                    for item in obj:
                        find_videos(item, list_out)
            
            find_videos(data, videos)
            
        return videos[:40] # Limit to 40 videos
    except Exception as e:
        print(f"Error scraping {playlist_url}: {e}")
        return []

playlists = {
    'Python': 'https://www.youtube.com/playlist?list=PLsyeobzWxl7oa1WO9n4cP3OY9nOtUcZIg',
    'Java': 'https://www.youtube.com/playlist?list=PLsyeobzWxl7qbKoSgR5ub6jolI8-ocxCF',
    'WebDev': 'https://www.youtube.com/playlist?list=PLsyeobzWxl7r566kReuTnjnINHqaRuRFn',
    'DSA': 'https://www.youtube.com/playlist?list=PLfqMhTWNBTe3LtFWcvwpqTkUSlB32kJop',
    'SoftSkills': 'https://www.youtube.com/playlist?list=PL6ZdH9C1KeueFazoYwshjYuao2pL9ihqY',
    'Career': 'https://www.youtube.com/playlist?list=PLOaeOd121eBEEWP14TYgSnFsvaTIjPD22'
}

results = {}
for name, url in playlists.items():
    print(f"Scraping {name}...")
    videos = extract_playlist_videos(url)
    results[name] = videos
    print(f"Found {len(videos)} videos for {name}")

with open('playlist_data.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)

print("Done! Data saved to playlist_data.json")
