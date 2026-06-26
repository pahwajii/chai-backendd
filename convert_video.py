from moviepy import VideoFileClip
import requests
import os
import sys
import tempfile
import urllib.parse

def convert_video_to_audio(video_url, output_path):
    """
    Convert video from URL to audio MP3 file
    """
    try:
        print(f"Starting conversion for URL: {video_url}", file=sys.stderr)

        # Check if it's a Cloudinary URL and add authentication if needed
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'video/mp4,video/*,*/*',
            'Accept-Language': 'en-US,en;q=0.9',
        }

        # For Cloudinary URLs, try without additional headers first
        if 'cloudinary.com' in video_url:
            print("Detected Cloudinary URL, using direct access", file=sys.stderr)
            # Cloudinary URLs are usually publicly accessible, so no special headers needed
            pass
        else:
            headers['Referer'] = 'https://www.google.com/'

        # Download video to temporary file
        print("Downloading video...", file=sys.stderr)
        response = requests.get(video_url, stream=True, headers=headers, timeout=60)
        response.raise_for_status()

        # Check content type
        content_type = response.headers.get('content-type', '').lower()
        print(f"Content-Type: {content_type}", file=sys.stderr)

        if not content_type.startswith('video/') and content_type != 'application/octet-stream':
            print(f"Warning: Content type is {content_type}, expected video/*", file=sys.stderr)

        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as temp_video:
            downloaded_size = 0
            for chunk in response.iter_content(chunk_size=8192):
                temp_video.write(chunk)
                downloaded_size += len(chunk)
            temp_video_path = temp_video.name

        print(f"Downloaded {downloaded_size} bytes to {temp_video_path}", file=sys.stderr)

        # Verify file size
        if downloaded_size < 1000:  # Less than 1KB
            raise Exception(f"Downloaded file too small ({downloaded_size} bytes), likely not a valid video")

        # Convert video to audio
        print("Converting to audio...", file=sys.stderr)
        try:
            video = VideoFileClip(temp_video_path)
            print(f"Video duration: {video.duration} seconds", file=sys.stderr)

            if video.audio is None:
                raise Exception("Video has no audio track")

            audio = video.audio
            audio.write_audiofile(output_path)

            # Clean up
            video.close()
            audio.close()

        except Exception as conv_error:
            print(f"MoviePy conversion error: {str(conv_error)}", file=sys.stderr)
            raise

        # Clean up temp file
        os.unlink(temp_video_path)

        # Verify output file
        if not os.path.exists(output_path) or os.path.getsize(output_path) < 1000:
            raise Exception("Audio conversion failed - output file is too small or missing")

        print(f"Conversion completed successfully: {output_path} ({os.path.getsize(output_path)} bytes)", file=sys.stderr)
        return True

    except requests.exceptions.RequestException as req_error:
        print(f"Network error downloading video: {str(req_error)}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"Error converting video: {str(e)}", file=sys.stderr)
        # Clean up any temp files
        try:
            if 'temp_video_path' in locals() and os.path.exists(temp_video_path):
                os.unlink(temp_video_path)
        except:
            pass
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert_video.py <video_url> <output_path>")
        sys.exit(1)

    video_url = sys.argv[1]
    output_path = sys.argv[2]

    success = convert_video_to_audio(video_url, output_path)
    sys.exit(0 if success else 1)