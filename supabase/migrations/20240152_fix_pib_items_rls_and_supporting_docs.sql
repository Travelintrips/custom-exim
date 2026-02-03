-- Fix RLS policies for pib_items and supporting_documents

-- Allow all authenticated users to insert pib_items
-- This fixes "new row violates row-level security policy" error
DROP POLICY IF EXISTS pib_items_insert ON pib_items;
CREATE POLICY pib_items_insert ON pib_items
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Also allow delete for authenticated users (needed for re-saving items)
DROP POLICY IF EXISTS pib_items_delete ON pib_items;
CREATE POLICY pib_items_delete ON pib_items
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Update policy for pib_items
DROP POLICY IF EXISTS pib_items_update ON pib_items;
CREATE POLICY pib_items_update ON pib_items
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM pib_documents 
      WHERE pib_documents.id = pib_items.pib_id 
      AND pib_documents.locked = true
    )
  );

-- Same for peb_items
DROP POLICY IF EXISTS peb_items_insert ON peb_items;
CREATE POLICY peb_items_insert ON peb_items
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS peb_items_delete ON peb_items;
CREATE POLICY peb_items_delete ON peb_items
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS peb_items_update ON peb_items;
CREATE POLICY peb_items_update ON peb_items
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM peb_documents 
      WHERE peb_documents.id = peb_items.peb_id 
      AND peb_documents.locked = true
    )
  );

-- Fix supporting_documents policies
DROP POLICY IF EXISTS supporting_documents_insert ON supporting_documents;
CREATE POLICY supporting_documents_insert ON supporting_documents
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS supporting_documents_select ON supporting_documents;
CREATE POLICY supporting_documents_select ON supporting_documents
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS supporting_documents_update ON supporting_documents;
CREATE POLICY supporting_documents_update ON supporting_documents
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS supporting_documents_delete ON supporting_documents;
CREATE POLICY supporting_documents_delete ON supporting_documents
  FOR DELETE
  USING (auth.uid() IS NOT NULL);
