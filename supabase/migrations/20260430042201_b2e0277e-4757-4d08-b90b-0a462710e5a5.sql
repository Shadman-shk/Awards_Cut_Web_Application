ALTER TABLE public.generated_clips
  ADD COLUMN IF NOT EXISTS music_track text,
  ADD COLUMN IF NOT EXISTS editor_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;