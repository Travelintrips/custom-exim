ALTER TABLE public.ports
DROP CONSTRAINT IF EXISTS ports_customs_office_id_fkey;

DROP INDEX IF EXISTS idx_ports_customs;

ALTER TABLE public.ports
DROP COLUMN IF EXISTS customs_office,
DROP COLUMN IF EXISTS customs_office_code,
DROP COLUMN IF EXISTS customs_office_id;
