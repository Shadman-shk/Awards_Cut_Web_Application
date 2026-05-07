
-- Drop the restrictive SELECT policy that filters by deleted_at
DROP POLICY IF EXISTS "Users can view own rooms" ON public.stream_rooms;

-- Recreate SELECT without deleted_at filter (app code already filters)
CREATE POLICY "Users can view own rooms"
ON public.stream_rooms
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Also fix UPDATE policy to not conflict with deleted_at changes
DROP POLICY IF EXISTS "Users can update own rooms" ON public.stream_rooms;

CREATE POLICY "Users can update own rooms"
ON public.stream_rooms
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
