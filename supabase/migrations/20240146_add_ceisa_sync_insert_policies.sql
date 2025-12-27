DROP POLICY IF EXISTS peb_documents_insert ON peb_documents;
CREATE POLICY peb_documents_insert ON peb_documents
  FOR INSERT
  WITH CHECK (
    get_user_role() IN ('export_staff', 'super_admin')
    OR auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS pib_documents_insert ON pib_documents;
CREATE POLICY pib_documents_insert ON pib_documents
  FOR INSERT
  WITH CHECK (
    get_user_role() IN ('import_staff', 'super_admin')
    OR auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS peb_documents_update ON peb_documents;
CREATE POLICY peb_documents_update ON peb_documents
  FOR UPDATE
  USING (
    (get_user_role() IN ('export_staff', 'super_admin') OR auth.uid() IS NOT NULL)
    AND (locked = false OR locked IS NULL)
  );

DROP POLICY IF EXISTS pib_documents_update ON pib_documents;
CREATE POLICY pib_documents_update ON pib_documents
  FOR UPDATE
  USING (
    (get_user_role() IN ('import_staff', 'super_admin') OR auth.uid() IS NOT NULL)
    AND (locked = false OR locked IS NULL)
  );
