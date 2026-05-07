-- Awardee face recognition table
CREATE TABLE IF NOT EXISTS public.awardee_faces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  award_category_id UUID,
  awardee_name TEXT NOT NULL,
  photo_url TEXT,
  descriptor JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.awardee_faces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own faces"
  ON public.awardee_faces FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own faces"
  ON public.awardee_faces FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own faces"
  ON public.awardee_faces FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own faces"
  ON public.awardee_faces FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_awardee_faces_user ON public.awardee_faces(user_id);

CREATE TRIGGER update_awardee_faces_updated_at
  BEFORE UPDATE ON public.awardee_faces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for awardee enrollment photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('awardee-photos', 'awardee-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Awardee photos are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'awardee-photos');

CREATE POLICY "Users can upload own awardee photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'awardee-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own awardee photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'awardee-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own awardee photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'awardee-photos' AND auth.uid()::text = (storage.foldername(name))[1]);