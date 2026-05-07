-- A. transcripts table
CREATE TABLE IF NOT EXISTS public.transcripts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_room_id  uuid NOT NULL,
  user_id         uuid NOT NULL,
  start_seconds   numeric NOT NULL,
  end_seconds     numeric NOT NULL,
  text            text NOT NULL,
  words_json      jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_transcripts_room_time ON public.transcripts(stream_room_id, start_seconds);
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transcripts" ON public.transcripts
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own transcripts" ON public.transcripts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own transcripts" ON public.transcripts
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- B. detected_moments additions
ALTER TABLE public.detected_moments
  ADD COLUMN IF NOT EXISTS stream_room_id            uuid,
  ADD COLUMN IF NOT EXISTS timestamp_seconds         numeric,
  ADD COLUMN IF NOT EXISTS matched_phrase            text,
  ADD COLUMN IF NOT EXISTS matched_award_category_id uuid,
  ADD COLUMN IF NOT EXISTS status                    text NOT NULL DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS confidence                numeric(3,2),
  ADD COLUMN IF NOT EXISTS confirmed_at              timestamptz,
  ADD COLUMN IF NOT EXISTS dismissed_at              timestamptz;
CREATE INDEX IF NOT EXISTS idx_moments_room_status ON public.detected_moments(stream_room_id, status);

DO $$ BEGIN
  CREATE POLICY "Users can update own moments" ON public.detected_moments
    FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- C. generated_clips additions
ALTER TABLE public.generated_clips
  ADD COLUMN IF NOT EXISTS template_id        uuid,
  ADD COLUMN IF NOT EXISTS parent_clip_id     uuid REFERENCES public.generated_clips(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS recipient_name     text,
  ADD COLUMN IF NOT EXISTS recipient_email    text,
  ADD COLUMN IF NOT EXISTS recipient_phone    text,
  ADD COLUMN IF NOT EXISTS branding_applied   boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_clips_parent ON public.generated_clips(parent_clip_id);
CREATE INDEX IF NOT EXISTS idx_clips_award_cat ON public.generated_clips(award_category_id);

-- D. Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.transcripts;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.detected_moments;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;