-- Add APPROVED and VALIDATED to pib_status enum
-- This resolves the error: invalid input value for enum pib_status: "APPROVED"

-- Add APPROVED to enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'APPROVED' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'pib_status')
  ) THEN
    ALTER TYPE pib_status ADD VALUE 'APPROVED';
  END IF;
END $$;

-- Add VALIDATED to enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'VALIDATED' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'pib_status')
  ) THEN
    ALTER TYPE pib_status ADD VALUE 'VALIDATED';
  END IF;
END $$;

-- Add SYNCED to enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'SYNCED' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'pib_status')
  ) THEN
    ALTER TYPE pib_status ADD VALUE 'SYNCED';
  END IF;
END $$;
