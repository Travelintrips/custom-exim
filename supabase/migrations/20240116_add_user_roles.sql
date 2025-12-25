CREATE TYPE user_role AS ENUM ('export_staff', 'import_staff', 'finance', 'viewer', 'super_admin');

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'viewer';
