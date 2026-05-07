-- 1. Extend stream_rooms (acts as "events")
ALTER TABLE public.stream_rooms
  ADD COLUMN IF NOT EXISTS event_date timestamptz,
  ADD COLUMN IF NOT EXISTS venue text,
  ADD COLUMN IF NOT EXISTS branding_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS template_id uuid;

-- 2. Extend generated_clips (acts as "clips")
ALTER TABLE public.generated_clips
  ADD COLUMN IF NOT EXISTS event_id uuid,
  ADD COLUMN IF NOT EXISTS award_category_id uuid,
  ADD COLUMN IF NOT EXISTS trigger_timestamp timestamptz,
  ADD COLUMN IF NOT EXISTS start_offset_seconds integer,
  ADD COLUMN IF NOT EXISTS end_offset_seconds integer,
  ADD COLUMN IF NOT EXISTS livepeer_asset_id text,
  ADD COLUMN IF NOT EXISTS livepeer_playback_id text,
  ADD COLUMN IF NOT EXISTS preview_url text,
  ADD COLUMN IF NOT EXISTS download_url text,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_generated_clips_event_id ON public.generated_clips(event_id);
CREATE INDEX IF NOT EXISTS idx_generated_clips_award_category_id ON public.generated_clips(award_category_id);

-- 3. New table: award_categories
CREATE TABLE IF NOT EXISTS public.award_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  recipient_name text,
  recipient_email text,
  recipient_phone text,
  scheduled_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  triggered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_award_categories_event_order
  ON public.award_categories(event_id, scheduled_order);

ALTER TABLE public.award_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own award categories"
  ON public.award_categories FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own award categories"
  ON public.award_categories FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own award categories"
  ON public.award_categories FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own award categories"
  ON public.award_categories FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER update_award_categories_updated_at
  BEFORE UPDATE ON public.award_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();