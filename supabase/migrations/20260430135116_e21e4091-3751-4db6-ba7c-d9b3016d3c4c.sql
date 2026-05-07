-- Delete clips with no real source video (pure placeholders)
DELETE FROM public.generated_clips WHERE source_video_url IS NULL OR source_video_url = '';

-- Delete clips pointing to known seed/demo Livepeer playback IDs
DELETE FROM public.generated_clips
WHERE source_video_url LIKE '%22ff6mv5hyyepm7a%'
   OR source_video_url LIKE '%e6c0s9x6mnl467ms%';

-- Delete orphan detected moments that have no clips referencing them
DELETE FROM public.detected_moments dm
WHERE NOT EXISTS (
  SELECT 1 FROM public.generated_clips gc WHERE gc.moment_id = dm.id
);