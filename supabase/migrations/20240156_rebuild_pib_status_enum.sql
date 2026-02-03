-- Rebuild pib_status enum to only use UPPERCASE values
-- This resolves the conflict between 'APPROVED' and 'approved'

-- Step 1: Create new enum with all uppercase values
CREATE TYPE pib_status_new AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'VALIDATED',
  'APPROVED',
  'SENT_TO_PPJK',
  'CEISA_ACCEPTED',
  'CEISA_REJECTED',
  'SPPB_ISSUED',
  'COMPLETED',
  'SYNCED'
);

-- Step 2: Alter pib_documents to use new enum
ALTER TABLE pib_documents
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE pib_documents
  ALTER COLUMN status TYPE pib_status_new
  USING UPPER(status::text)::pib_status_new;

ALTER TABLE pib_documents
  ALTER COLUMN status SET DEFAULT 'DRAFT'::pib_status_new;

-- Step 3: Alter pib_status_history to use new enum (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pib_status_history') THEN
    ALTER TABLE pib_status_history
      ALTER COLUMN to_status TYPE pib_status_new
      USING UPPER(to_status::text)::pib_status_new;
    
    ALTER TABLE pib_status_history
      ALTER COLUMN from_status TYPE pib_status_new
      USING UPPER(from_status::text)::pib_status_new;
  END IF;
END $$;

-- Step 4: Drop old enum and rename new one
DROP TYPE IF EXISTS pib_status CASCADE;
ALTER TYPE pib_status_new RENAME TO pib_status;
