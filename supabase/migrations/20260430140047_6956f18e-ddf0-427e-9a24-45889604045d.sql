-- Hard delete all stale March-2026 demo clips that share the same live HLS URL.
-- These were never real per-clip Livepeer assets; they all point to a single
-- continuous live HLS index, which is why the player shows an empty video.
DELETE FROM public.generated_clips
WHERE created_at < '2026-04-30'::timestamptz
   OR source_video_url LIKE 'https://livepeercdn.studio/hls/%/index.m3u8';

-- Also wipe orphaned moments from the old demo so the UI counts are accurate.
DELETE FROM public.detected_moments
WHERE created_at < '2026-04-30'::timestamptz;