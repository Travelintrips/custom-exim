-- Fix the foreign key constraint on pib_documents.customs_office_id
-- Currently it references ports(id) but should reference customs_offices(id)

-- Drop the existing foreign key constraint on pib_documents
ALTER TABLE public.pib_documents 
DROP CONSTRAINT IF EXISTS pib_documents_customs_office_id_fkey;

-- Drop the existing foreign key constraint on peb_documents  
ALTER TABLE public.peb_documents 
DROP CONSTRAINT IF EXISTS peb_documents_customs_office_id_fkey;

-- Add the correct foreign key constraint for pib_documents
-- Using customs_offices table
ALTER TABLE public.pib_documents
ADD CONSTRAINT pib_documents_customs_office_id_fkey 
FOREIGN KEY (customs_office_id) REFERENCES public.customs_offices(id);

-- Add the correct foreign key constraint for peb_documents
ALTER TABLE public.peb_documents
ADD CONSTRAINT peb_documents_customs_office_id_fkey 
FOREIGN KEY (customs_office_id) REFERENCES public.customs_offices(id);

-- Add comments
COMMENT ON COLUMN public.pib_documents.customs_office_id IS 'References customs_offices table (Kantor Pabean)';
COMMENT ON COLUMN public.peb_documents.customs_office_id IS 'References customs_offices table (Kantor Pabean)';
