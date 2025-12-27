CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
  current_role user_role;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN 'viewer'::user_role;
  END IF;
  
  SELECT role INTO current_role 
  FROM public.users 
  WHERE id = current_user_id;
  
  RETURN COALESCE(current_role, 'viewer'::user_role);
EXCEPTION
  WHEN others THEN
    RETURN 'viewer'::user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS audit_logs_select ON audit_logs;
CREATE POLICY audit_logs_select ON audit_logs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
