-- Enhanced RLS Policies with Role-Based Access Control
-- DENY UPDATE/DELETE when locked = true
-- Viewer and Finance: SELECT only
-- Export/Import staff: Cannot edit LOCKED data

-- Enable RLS on all relevant tables
ALTER TABLE peb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pib_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE peb_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pib_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supporting_documents ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
  current_role user_role;
BEGIN
  SELECT role INTO current_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  RETURN COALESCE(current_role, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- PEB DOCUMENTS POLICIES
-- =====================================================

-- SELECT: Allow all authenticated users with appropriate roles
DROP POLICY IF EXISTS peb_documents_select ON peb_documents;
CREATE POLICY peb_documents_select ON peb_documents
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND get_user_role() IN ('export_staff', 'import_staff', 'finance', 'viewer', 'super_admin')
  );

-- INSERT: Only export_staff and super_admin
DROP POLICY IF EXISTS peb_documents_insert ON peb_documents;
CREATE POLICY peb_documents_insert ON peb_documents
  FOR INSERT
  WITH CHECK (
    get_user_role() IN ('export_staff', 'super_admin')
  );

-- UPDATE: Only export_staff and super_admin, AND document must NOT be locked
DROP POLICY IF EXISTS peb_documents_update ON peb_documents;
CREATE POLICY peb_documents_update ON peb_documents
  FOR UPDATE
  USING (
    get_user_role() IN ('export_staff', 'super_admin')
    AND (locked = false OR locked IS NULL)
  );

-- DELETE: Only super_admin, AND document must NOT be locked
DROP POLICY IF EXISTS peb_documents_delete ON peb_documents;
CREATE POLICY peb_documents_delete ON peb_documents
  FOR DELETE
  USING (
    get_user_role() = 'super_admin'
    AND (locked = false OR locked IS NULL)
  );

-- =====================================================
-- PIB DOCUMENTS POLICIES
-- =====================================================

-- SELECT: Allow all authenticated users with appropriate roles
DROP POLICY IF EXISTS pib_documents_select ON pib_documents;
CREATE POLICY pib_documents_select ON pib_documents
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND get_user_role() IN ('export_staff', 'import_staff', 'finance', 'viewer', 'super_admin')
  );

-- INSERT: Only import_staff and super_admin
DROP POLICY IF EXISTS pib_documents_insert ON pib_documents;
CREATE POLICY pib_documents_insert ON pib_documents
  FOR INSERT
  WITH CHECK (
    get_user_role() IN ('import_staff', 'super_admin')
  );

-- UPDATE: Only import_staff and super_admin, AND document must NOT be locked
DROP POLICY IF EXISTS pib_documents_update ON pib_documents;
CREATE POLICY pib_documents_update ON pib_documents
  FOR UPDATE
  USING (
    get_user_role() IN ('import_staff', 'super_admin')
    AND (locked = false OR locked IS NULL)
  );

-- DELETE: Only super_admin, AND document must NOT be locked
DROP POLICY IF EXISTS pib_documents_delete ON pib_documents;
CREATE POLICY pib_documents_delete ON pib_documents
  FOR DELETE
  USING (
    get_user_role() = 'super_admin'
    AND (locked = false OR locked IS NULL)
  );

-- =====================================================
-- PEB ITEMS POLICIES
-- =====================================================

-- SELECT: Same as PEB documents
DROP POLICY IF EXISTS peb_items_select ON peb_items;
CREATE POLICY peb_items_select ON peb_items
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND get_user_role() IN ('export_staff', 'import_staff', 'finance', 'viewer', 'super_admin')
  );

-- INSERT: Only export_staff and super_admin
DROP POLICY IF EXISTS peb_items_insert ON peb_items;
CREATE POLICY peb_items_insert ON peb_items
  FOR INSERT
  WITH CHECK (
    get_user_role() IN ('export_staff', 'super_admin')
  );

-- UPDATE: Only export_staff/super_admin, parent PEB must NOT be locked
DROP POLICY IF EXISTS peb_items_update ON peb_items;
CREATE POLICY peb_items_update ON peb_items
  FOR UPDATE
  USING (
    get_user_role() IN ('export_staff', 'super_admin')
    AND NOT EXISTS (
      SELECT 1 FROM peb_documents 
      WHERE peb_documents.id = peb_items.peb_id 
      AND peb_documents.locked = true
    )
  );

-- DELETE: Only super_admin, parent PEB must NOT be locked
DROP POLICY IF EXISTS peb_items_delete ON peb_items;
CREATE POLICY peb_items_delete ON peb_items
  FOR DELETE
  USING (
    get_user_role() = 'super_admin'
    AND NOT EXISTS (
      SELECT 1 FROM peb_documents 
      WHERE peb_documents.id = peb_items.peb_id 
      AND peb_documents.locked = true
    )
  );

-- =====================================================
-- PIB ITEMS POLICIES
-- =====================================================

-- SELECT: Same as PIB documents
DROP POLICY IF EXISTS pib_items_select ON pib_items;
CREATE POLICY pib_items_select ON pib_items
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND get_user_role() IN ('export_staff', 'import_staff', 'finance', 'viewer', 'super_admin')
  );

-- INSERT: Only import_staff and super_admin
DROP POLICY IF EXISTS pib_items_insert ON pib_items;
CREATE POLICY pib_items_insert ON pib_items
  FOR INSERT
  WITH CHECK (
    get_user_role() IN ('import_staff', 'super_admin')
  );

-- UPDATE: Only import_staff/super_admin, parent PIB must NOT be locked
DROP POLICY IF EXISTS pib_items_update ON pib_items;
CREATE POLICY pib_items_update ON pib_items
  FOR UPDATE
  USING (
    get_user_role() IN ('import_staff', 'super_admin')
    AND NOT EXISTS (
      SELECT 1 FROM pib_documents 
      WHERE pib_documents.id = pib_items.pib_id 
      AND pib_documents.locked = true
    )
  );

-- DELETE: Only super_admin, parent PIB must NOT be locked
DROP POLICY IF EXISTS pib_items_delete ON pib_items;
CREATE POLICY pib_items_delete ON pib_items
  FOR DELETE
  USING (
    get_user_role() = 'super_admin'
    AND NOT EXISTS (
      SELECT 1 FROM pib_documents 
      WHERE pib_documents.id = pib_items.pib_id 
      AND pib_documents.locked = true
    )
  );

-- =====================================================
-- SUPPORTING DOCUMENTS POLICIES
-- =====================================================

-- SELECT: All authenticated users with roles
DROP POLICY IF EXISTS supporting_documents_select ON supporting_documents;
CREATE POLICY supporting_documents_select ON supporting_documents
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND get_user_role() IN ('export_staff', 'import_staff', 'finance', 'viewer', 'super_admin')
  );

-- INSERT: export_staff for PEB, import_staff for PIB, super_admin for all
DROP POLICY IF EXISTS supporting_documents_insert ON supporting_documents;
CREATE POLICY supporting_documents_insert ON supporting_documents
  FOR INSERT
  WITH CHECK (
    get_user_role() = 'super_admin'
    OR (ref_type = 'PEB' AND get_user_role() = 'export_staff')
    OR (ref_type = 'PIB' AND get_user_role() = 'import_staff')
  );

-- UPDATE: Based on ref_type and parent not locked
DROP POLICY IF EXISTS supporting_documents_update ON supporting_documents;
CREATE POLICY supporting_documents_update ON supporting_documents
  FOR UPDATE
  USING (
    (
      get_user_role() = 'super_admin'
      OR (ref_type = 'PEB' AND get_user_role() = 'export_staff')
      OR (ref_type = 'PIB' AND get_user_role() = 'import_staff')
    )
    AND NOT (
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

-- DELETE: Only super_admin, parent not locked
DROP POLICY IF EXISTS supporting_documents_delete ON supporting_documents;
CREATE POLICY supporting_documents_delete ON supporting_documents
  FOR DELETE
  USING (
    get_user_role() = 'super_admin'
    AND NOT (
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

-- =====================================================
-- EDI XML METADATA POLICIES
-- =====================================================

ALTER TABLE edi_xml_metadata ENABLE ROW LEVEL SECURITY;

-- SELECT: All authorized roles
DROP POLICY IF EXISTS edi_xml_metadata_select ON edi_xml_metadata;
CREATE POLICY edi_xml_metadata_select ON edi_xml_metadata
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND get_user_role() IN ('export_staff', 'import_staff', 'finance', 'viewer', 'super_admin')
  );

-- INSERT: export_staff for PEB, import_staff for PIB, super_admin for all
DROP POLICY IF EXISTS edi_xml_metadata_insert ON edi_xml_metadata;
CREATE POLICY edi_xml_metadata_insert ON edi_xml_metadata
  FOR INSERT
  WITH CHECK (
    get_user_role() = 'super_admin'
    OR (ref_type = 'PEB' AND get_user_role() = 'export_staff')
    OR (ref_type = 'PIB' AND get_user_role() = 'import_staff')
  );

-- UPDATE: Only super_admin
DROP POLICY IF EXISTS edi_xml_metadata_update ON edi_xml_metadata;
CREATE POLICY edi_xml_metadata_update ON edi_xml_metadata
  FOR UPDATE
  USING (get_user_role() = 'super_admin');

-- DELETE: Only super_admin
DROP POLICY IF EXISTS edi_xml_metadata_delete ON edi_xml_metadata;
CREATE POLICY edi_xml_metadata_delete ON edi_xml_metadata
  FOR DELETE
  USING (get_user_role() = 'super_admin');

-- =====================================================
-- AUDIT LOGS POLICIES (Read-only for most)
-- =====================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: All authorized roles
DROP POLICY IF EXISTS audit_logs_select ON audit_logs;
CREATE POLICY audit_logs_select ON audit_logs
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND get_user_role() IN ('export_staff', 'import_staff', 'finance', 'viewer', 'super_admin')
  );

-- INSERT: All staff roles (for logging purposes)
DROP POLICY IF EXISTS audit_logs_insert ON audit_logs;
CREATE POLICY audit_logs_insert ON audit_logs
  FOR INSERT
  WITH CHECK (
    get_user_role() IN ('export_staff', 'import_staff', 'super_admin')
  );

-- UPDATE: Deny all (audit logs are immutable)
DROP POLICY IF EXISTS audit_logs_update ON audit_logs;
CREATE POLICY audit_logs_update ON audit_logs
  FOR UPDATE
  USING (false);

-- DELETE: Deny all (audit logs are immutable)
DROP POLICY IF EXISTS audit_logs_delete ON audit_logs;
CREATE POLICY audit_logs_delete ON audit_logs
  FOR DELETE
  USING (false);

-- Drop old policies that are now replaced
DROP POLICY IF EXISTS peb_documents_no_update_when_locked ON peb_documents;
DROP POLICY IF EXISTS peb_documents_no_delete_when_locked ON peb_documents;
DROP POLICY IF EXISTS pib_documents_no_update_when_locked ON pib_documents;
DROP POLICY IF EXISTS pib_documents_no_delete_when_locked ON pib_documents;
DROP POLICY IF EXISTS peb_items_no_update_when_parent_locked ON peb_items;
DROP POLICY IF EXISTS peb_items_no_delete_when_parent_locked ON peb_items;
DROP POLICY IF EXISTS pib_items_no_update_when_parent_locked ON pib_items;
DROP POLICY IF EXISTS pib_items_no_delete_when_parent_locked ON pib_items;
DROP POLICY IF EXISTS supporting_documents_no_update_when_parent_locked ON supporting_documents;
DROP POLICY IF EXISTS supporting_documents_no_delete_when_parent_locked ON supporting_documents;
