
-- Detected moments table
CREATE TABLE public.detected_moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ceremony_id text,
  video_filename text,
  timestamp text NOT NULL,
  moment_type text NOT NULL,
  winner_name text,
  award_name text,
  confidence_score integer NOT NULL DEFAULT 85,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.detected_moments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own moments" ON public.detected_moments
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own moments" ON public.detected_moments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own moments" ON public.detected_moments
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Generated clips table
CREATE TABLE public.generated_clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  moment_id uuid REFERENCES public.detected_moments(id) ON DELETE CASCADE,
  winner_name text NOT NULL,
  category text NOT NULL,
  format text NOT NULL,
  dimensions text NOT NULL,
  format_label text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  duration_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clips" ON public.generated_clips
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own clips" ON public.generated_clips
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own clips" ON public.generated_clips
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own clips" ON public.generated_clips
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.generated_clips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.detected_moments;
