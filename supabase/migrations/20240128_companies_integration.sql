-- Migration: Companies Master Data Integration
-- Purpose: Add constraints, triggers and proper column for FK country reference

-- 1. Add CHECK constraint for companies.type
ALTER TABLE companies DROP CONSTRAINT IF EXISTS chk_companies_type;
ALTER TABLE companies ADD CONSTRAINT chk_companies_type 
  CHECK (type IN ('exporter', 'importer', 'both'));

-- 2. Add country_id FK column and migrate existing data
ALTER TABLE companies ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS effective_date DATE DEFAULT CURRENT_DATE;

-- 3. Create trigger function for companies audit trail
CREATE OR REPLACE FUNCTION log_companies_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  v_user_id := auth.uid();
  
  SELECT email INTO v_user_email 
  FROM auth.users 
  WHERE id = v_user_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO master_data_history (
      table_name, record_id, action, before_data, after_data, 
      changed_by, changed_by_email, changed_at
    ) VALUES (
      'companies', NEW.id, 'CREATE', NULL, to_jsonb(NEW),
      v_user_id, v_user_email, NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO master_data_history (
      table_name, record_id, action, before_data, after_data, 
      changed_by, changed_by_email, changed_at
    ) VALUES (
      'companies', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW),
      v_user_id, v_user_email, NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO master_data_history (
      table_name, record_id, action, before_data, after_data, 
      changed_by, changed_by_email, changed_at
    ) VALUES (
      'companies', OLD.id, 'DELETE', to_jsonb(OLD), NULL,
      v_user_id, v_user_email, NOW()
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger for companies
DROP TRIGGER IF EXISTS trg_companies_audit ON companies;
CREATE TRIGGER trg_companies_audit
  AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION log_companies_changes();

-- 5. Create function to prevent deletion of referenced companies
CREATE OR REPLACE FUNCTION prevent_company_deletion()
RETURNS TRIGGER AS $$
DECLARE
  peb_count INTEGER;
  pib_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO peb_count FROM peb_documents WHERE exporter_id = OLD.id;
  SELECT COUNT(*) INTO pib_count FROM pib_documents WHERE importer_id = OLD.id;
  
  IF peb_count > 0 OR pib_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete company: referenced by % PEB and % PIB documents. Use soft delete (is_active = false) instead.', peb_count, pib_count;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to prevent deletion
DROP TRIGGER IF EXISTS trg_prevent_company_deletion ON companies;
CREATE TRIGGER trg_prevent_company_deletion
  BEFORE DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION prevent_company_deletion();

-- 7. Create function to auto-fill metadata on insert
CREATE OR REPLACE FUNCTION set_companies_metadata()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := COALESCE(NEW.created_at, NOW());
    NEW.created_by := COALESCE(NEW.created_by, auth.uid());
    NEW.source := COALESCE(NEW.source, 'manual');
    NEW.effective_date := COALESCE(NEW.effective_date, CURRENT_DATE);
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := NOW();
    NEW.updated_by := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create trigger for metadata
DROP TRIGGER IF EXISTS trg_companies_metadata ON companies;
CREATE TRIGGER trg_companies_metadata
  BEFORE INSERT OR UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION set_companies_metadata();

-- 9. Create index for company type filtering
CREATE INDEX IF NOT EXISTS idx_companies_type ON companies(type);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_country_id ON companies(country_id);
