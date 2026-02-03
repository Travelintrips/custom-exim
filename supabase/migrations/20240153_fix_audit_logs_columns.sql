-- Fix audit_logs table to ensure all required columns exist
-- This migration handles the 'new_data' column error by ensuring proper column structure

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Check and add entity_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'audit_logs' 
                 AND column_name = 'entity_type') THEN
    ALTER TABLE audit_logs ADD COLUMN entity_type VARCHAR(50);
  END IF;

  -- Check and add entity_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'audit_logs' 
                 AND column_name = 'entity_id') THEN
    ALTER TABLE audit_logs ADD COLUMN entity_id UUID;
  END IF;

  -- Check and add entity_number column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'audit_logs' 
                 AND column_name = 'entity_number') THEN
    ALTER TABLE audit_logs ADD COLUMN entity_number VARCHAR(100);
  END IF;

  -- Check and add actor_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'audit_logs' 
                 AND column_name = 'actor_id') THEN
    ALTER TABLE audit_logs ADD COLUMN actor_id UUID;
  END IF;

  -- Check and add after_data column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'audit_logs' 
                 AND column_name = 'after_data') THEN
    ALTER TABLE audit_logs ADD COLUMN after_data JSONB;
  END IF;

  -- Check and add before_data column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'audit_logs' 
                 AND column_name = 'before_data') THEN
    ALTER TABLE audit_logs ADD COLUMN before_data JSONB;
  END IF;

  -- Check and add notes column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'audit_logs' 
                 AND column_name = 'notes') THEN
    ALTER TABLE audit_logs ADD COLUMN notes TEXT;
  END IF;

END $$;

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_number ON audit_logs(entity_number);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
