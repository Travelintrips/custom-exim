-- Fix audit_logs insert policy to allow all authenticated users to insert
-- This resolves RLS policy violation error 42501

-- Drop existing insert policy
DROP POLICY IF EXISTS audit_logs_insert ON audit_logs;

-- Create new insert policy that allows all authenticated users
CREATE POLICY audit_logs_insert ON audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Also ensure select policy is permissive for all authenticated users
DROP POLICY IF EXISTS audit_logs_select ON audit_logs;
CREATE POLICY audit_logs_select ON audit_logs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
