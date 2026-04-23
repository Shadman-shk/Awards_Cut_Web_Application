-- Create a secure function that auto-assigns the first user as owner
-- This runs with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.assign_first_user_owner(_user_id uuid, _email text)
RETURNS app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing_role app_role;
  _has_any_roles boolean;
BEGIN
  -- First check if user already has a role
  SELECT role INTO _existing_role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
  
  IF _existing_role IS NOT NULL THEN
    RETURN _existing_role;
  END IF;
  
  -- Check if there are ANY roles in the system
  SELECT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) INTO _has_any_roles;
  
  -- If no roles exist, this is the first user - make them owner
  IF NOT _has_any_roles THEN
    INSERT INTO public.user_roles (user_id, role, invited_email)
    VALUES (_user_id, 'owner', _email)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN 'owner';
  END IF;
  
  -- Otherwise, user has no role and isn't first user
  RETURN NULL;
END;
$$;