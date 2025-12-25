-- Add anon read access for dashboard counts
-- This allows the dashboard to show counts even without full authentication

DROP POLICY IF EXISTS peb_documents_anon_select ON peb_documents;
CREATE POLICY peb_documents_anon_select ON peb_documents
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS pib_documents_anon_select ON pib_documents;
CREATE POLICY pib_documents_anon_select ON pib_documents
  FOR SELECT
  USING (true);
