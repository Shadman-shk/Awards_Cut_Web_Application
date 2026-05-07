-- Create ceremony-videos storage bucket (public so clips can be played)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ceremony-videos', 'ceremony-videos', true);

-- Allow authenticated users to upload to ceremony-videos
CREATE POLICY "Authenticated users can upload ceremony videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ceremony-videos');

-- Allow anyone to read ceremony videos (public bucket)
CREATE POLICY "Anyone can read ceremony videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'ceremony-videos');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own ceremony videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ceremony-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add source_video_url to detected_moments
ALTER TABLE public.detected_moments ADD COLUMN IF NOT EXISTS source_video_url text;
ALTER TABLE public.detected_moments ADD COLUMN IF NOT EXISTS clip_start integer DEFAULT 0;
ALTER TABLE public.detected_moments ADD COLUMN IF NOT EXISTS clip_end integer DEFAULT 30;

-- Add source_video_url to generated_clips  
ALTER TABLE public.generated_clips ADD COLUMN IF NOT EXISTS source_video_url text;