-- Create a validation trigger to restrict activity_logs inserts to admins only
CREATE OR REPLACE FUNCTION public.validate_activity_log_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can insert activity logs';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_admin_activity_log_insert
BEFORE INSERT ON public.activity_logs
FOR EACH ROW
EXECUTE FUNCTION public.validate_activity_log_insert();