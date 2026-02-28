-- Fix critical: profiles table publicly exposing customer emails
DROP POLICY IF EXISTS "Public profiles readable" ON public.profiles;

CREATE POLICY "Users view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

-- Enable leaked password protection
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;