
CREATE TABLE public.detection_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sensitivity_mode text NOT NULL DEFAULT 'balanced',
  confidence_threshold integer NOT NULL DEFAULT 80,
  detection_interval_seconds integer NOT NULL DEFAULT 10,
  clip_duration_seconds integer NOT NULL DEFAULT 30,
  clip_before_seconds integer NOT NULL DEFAULT 15,
  clip_after_seconds integer NOT NULL DEFAULT 15,
  max_clips_per_stream integer NOT NULL DEFAULT 50,
  auto_clip_enabled boolean NOT NULL DEFAULT true,
  layers_enabled jsonb NOT NULL DEFAULT '{"speech": true, "audio_energy": true, "visual": true, "watchlist": true}'::jsonb,
  moment_types_enabled jsonb NOT NULL DEFAULT '["Award Announcement","Lifetime Achievement","Rising Star","Acceptance Speech","Trophy Moment","Crowd Reaction","Leadership Excellence","Innovation Award","Grand Prize","Presentation","Dramatic Moment","Community Impact","Standing Ovation"]'::jsonb,
  clip_duration_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.detection_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON public.detection_settings
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings" ON public.detection_settings
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings" ON public.detection_settings
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER update_detection_settings_updated_at
  BEFORE UPDATE ON public.detection_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
