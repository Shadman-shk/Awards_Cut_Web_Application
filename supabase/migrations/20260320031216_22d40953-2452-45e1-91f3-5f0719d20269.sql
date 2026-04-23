
-- Stream Rooms
CREATE TABLE public.stream_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Main Stage',
  livepeer_stream_id text,
  livepeer_stream_key text,
  livepeer_playback_id text,
  rtmp_url text DEFAULT 'rtmp://rtmp.livepeer.com/live',
  status text NOT NULL DEFAULT 'idle',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.stream_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rooms" ON public.stream_rooms
  FOR SELECT TO authenticated USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can insert own rooms" ON public.stream_rooms
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own rooms" ON public.stream_rooms
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own rooms" ON public.stream_rooms
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Stream Room Members
CREATE TABLE public.stream_room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.stream_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer',
  invited_by uuid REFERENCES auth.users(id),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);

ALTER TABLE public.stream_room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view room members" ON public.stream_room_members
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.stream_room_members m WHERE m.room_id = stream_room_members.room_id AND m.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.stream_rooms r WHERE r.id = stream_room_members.room_id AND r.user_id = auth.uid())
  );

CREATE POLICY "Room owners can insert members" ON public.stream_room_members
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.stream_rooms r WHERE r.id = room_id AND r.user_id = auth.uid())
  );

CREATE POLICY "Room owners can delete members" ON public.stream_room_members
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.stream_rooms r WHERE r.id = room_id AND r.user_id = auth.uid())
  );

-- Room Chat Messages
CREATE TABLE public.room_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.stream_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.room_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view chat" ON public.room_chat_messages
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can insert chat" ON public.room_chat_messages
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own messages" ON public.room_chat_messages
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Session Summaries
CREATE TABLE public.session_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.stream_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stream_start timestamptz,
  stream_end timestamptz,
  peak_viewers integer DEFAULT 0,
  clips_created integer DEFAULT 0,
  moments_detected integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.session_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own summaries" ON public.session_summaries
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own summaries" ON public.session_summaries
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Enable realtime for chat and rooms
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_rooms;
