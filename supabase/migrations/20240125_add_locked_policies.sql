-- RLS Policies for Locked Documents
-- Prevent UPDATE and DELETE when locked = true

-- PEB Documents - Prevent UPDATE when locked
DROP POLICY IF EXISTS peb_documents_no_update_when_locked ON peb_documents;
CREATE POLICY peb_documents_no_update_when_locked ON peb_documents
  FOR UPDATE
  USING (locked = false OR locked IS NULL);

-- PEB Documents - Prevent DELETE when locked
DROP POLICY IF EXISTS peb_documents_no_delete_when_locked ON peb_documents;
CREATE POLICY peb_documents_no_delete_when_locked ON peb_documents
  FOR DELETE
  USING (locked = false OR locked IS NULL);

-- PIB Documents - Prevent UPDATE when locked  
DROP POLICY IF EXISTS pib_documents_no_update_when_locked ON pib_documents;
CREATE POLICY pib_documents_no_update_when_locked ON pib_documents
  FOR UPDATE
  USING (locked = false OR locked IS NULL);

-- PIB Documents - Prevent DELETE when locked
DROP POLICY IF EXISTS pib_documents_no_delete_when_locked ON pib_documents;
CREATE POLICY pib_documents_no_delete_when_locked ON pib_documents
  FOR DELETE
  USING (locked = false OR locked IS NULL);

-- PEB Items - Prevent UPDATE when parent PEB is locked
DROP POLICY IF EXISTS peb_items_no_update_when_parent_locked ON peb_items;
CREATE POLICY peb_items_no_update_when_parent_locked ON peb_items
  FOR UPDATE
  USING (
    NOT EXISTS (
      SELECT 1 FROM peb_documents 
      WHERE peb_documents.id = peb_items.peb_id 
      AND peb_documents.locked = true
    )
  );

-- PEB Items - Prevent DELETE when parent PEB is locked
DROP POLICY IF EXISTS peb_items_no_delete_when_parent_locked ON peb_items;
CREATE POLICY peb_items_no_delete_when_parent_locked ON peb_items
  FOR DELETE
  USING (
    NOT EXISTS (
      SELECT 1 FROM peb_documents 
      WHERE peb_documents.id = peb_items.peb_id 
      AND peb_documents.locked = true
    )
  );

-- PIB Items - Prevent UPDATE when parent PIB is locked
DROP POLICY IF EXISTS pib_items_no_update_when_parent_locked ON pib_items;
CREATE POLICY pib_items_no_update_when_parent_locked ON pib_items
  FOR UPDATE
  USING (
    NOT EXISTS (
      SELECT 1 FROM pib_documents 
      WHERE pib_documents.id = pib_items.pib_id 
      AND pib_documents.locked = true
    )
  );

-- PIB Items - Prevent DELETE when parent PIB is locked  
DROP POLICY IF EXISTS pib_items_no_delete_when_parent_locked ON pib_items;
CREATE POLICY pib_items_no_delete_when_parent_locked ON pib_items
  FOR DELETE
  USING (
    NOT EXISTS (
      SELECT 1 FROM pib_documents 
      WHERE pib_documents.id = pib_items.pib_id 
      AND pib_documents.locked = true
    )
  );

-- Supporting Documents - Prevent UPDATE when parent is locked
DROP POLICY IF EXISTS supporting_documents_no_update_when_parent_locked ON supporting_documents;
CREATE POLICY supporting_documents_no_update_when_parent_locked ON supporting_documents
  FOR UPDATE
  USING (
    NOT (
      (ref_type = 'PEB' AND EXISTS (
        SELECT 1 FROM peb_documents 
        WHERE peb_documents.id = supporting_documents.ref_id 
        AND peb_documents.locked = true
      ))
      OR
      (ref_type = 'PIB' AND EXISTS (
        SELECT 1 FROM pib_documents 
        WHERE pib_documents.id = supporting_documents.ref_id 
        AND pib_documents.locked = true
      ))
    )
  );

-- Supporting Documents - Prevent DELETE when parent is locked
DROP POLICY IF EXISTS supporting_documents_no_delete_when_parent_locked ON supporting_documents;
CREATE POLICY supporting_documents_no_delete_when_parent_locked ON supporting_documents
  FOR DELETE
  USING (
    NOT (
      (ref_type = 'PEB' AND EXISTS (
        SELECT 1 FROM peb_documents 
        WHERE peb_documents.id = supporting_documents.ref_id 
        AND peb_documents.locked = true
      ))
      OR
      (ref_type = 'PIB' AND EXISTS (
        SELECT 1 FROM pib_documents 
        WHERE pib_documents.id = supporting_documents.ref_id 
        AND pib_documents.locked = true
      ))
    )
  );
