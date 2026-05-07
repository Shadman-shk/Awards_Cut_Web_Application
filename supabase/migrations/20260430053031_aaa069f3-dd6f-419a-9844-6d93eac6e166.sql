UPDATE public.generated_clips
SET source_video_url = 'https://download.samplelib.com/mp4/sample-30s.mp4'
WHERE source_video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

UPDATE public.detected_moments
SET source_video_url = 'https://download.samplelib.com/mp4/sample-30s.mp4'
WHERE source_video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';