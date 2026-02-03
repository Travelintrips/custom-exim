-- Add pelabuhan_tujuan_id column to pib_documents table
-- This column stores the destination port that will be used to lookup customs office

ALTER TABLE public.pib_documents
ADD COLUMN IF NOT EXISTS pelabuhan_tujuan_id UUID REFERENCES public.ports(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_pib_documents_pelabuhan_tujuan_id
ON public.pib_documents(pelabuhan_tujuan_id);

-- Add comment
COMMENT ON COLUMN public.pib_documents.pelabuhan_tujuan_id IS 'Destination port (Indonesia) that determines customs office';
