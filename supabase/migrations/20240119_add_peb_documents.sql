CREATE TYPE peb_status AS ENUM ('DRAFT', 'SUBMITTED', 'SENT_TO_PPJK', 'CEISA_ACCEPTED', 'CEISA_REJECTED', 'NPE_ISSUED', 'COMPLETED');

CREATE TABLE IF NOT EXISTS peb_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_number VARCHAR(50) UNIQUE,
  registration_number VARCHAR(50),
  registration_date DATE,
  npe_number VARCHAR(50),
  npe_date DATE,
  status peb_status DEFAULT 'DRAFT',
  
  exporter_id UUID REFERENCES companies(id),
  exporter_npwp VARCHAR(50),
  exporter_name VARCHAR(255),
  exporter_address TEXT,
  
  buyer_id UUID REFERENCES buyers(id),
  buyer_name VARCHAR(255),
  buyer_address TEXT,
  buyer_country VARCHAR(100),
  
  ppjk_id UUID REFERENCES ppjk(id),
  ppjk_npwp VARCHAR(50),
  ppjk_name VARCHAR(255),
  
  customs_office_id UUID REFERENCES ports(id),
  customs_office_code VARCHAR(20),
  customs_office_name VARCHAR(255),
  
  loading_port_id UUID REFERENCES ports(id),
  loading_port_code VARCHAR(20),
  loading_port_name VARCHAR(255),
  
  destination_port_id UUID REFERENCES ports(id),
  destination_port_code VARCHAR(20),
  destination_port_name VARCHAR(255),
  destination_country VARCHAR(100),
  
  incoterm_id UUID REFERENCES incoterms(id),
  incoterm_code VARCHAR(10),
  
  currency_id UUID REFERENCES currencies(id),
  currency_code VARCHAR(10),
  exchange_rate DECIMAL(18,6),
  
  transport_mode VARCHAR(20),
  vessel_name VARCHAR(255),
  voyage_number VARCHAR(50),
  
  total_packages INTEGER DEFAULT 0,
  package_unit VARCHAR(20),
  gross_weight DECIMAL(18,4) DEFAULT 0,
  net_weight DECIMAL(18,4) DEFAULT 0,
  
  total_fob_value DECIMAL(18,2) DEFAULT 0,
  total_fob_idr DECIMAL(18,2) DEFAULT 0,
  freight_value DECIMAL(18,2) DEFAULT 0,
  insurance_value DECIMAL(18,2) DEFAULT 0,
  
  notes TEXT,
  xml_content TEXT,
  ceisa_response TEXT,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES auth.users(id),
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS peb_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peb_id UUID NOT NULL REFERENCES peb_documents(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  
  hs_code_id UUID REFERENCES hs_codes(id),
  hs_code VARCHAR(20),
  product_id UUID REFERENCES products(id),
  product_code VARCHAR(50),
  product_description TEXT,
  
  quantity DECIMAL(18,4) NOT NULL DEFAULT 0,
  quantity_unit VARCHAR(20),
  net_weight DECIMAL(18,4) DEFAULT 0,
  gross_weight DECIMAL(18,4) DEFAULT 0,
  
  unit_price DECIMAL(18,4) DEFAULT 0,
  total_price DECIMAL(18,2) DEFAULT 0,
  fob_value DECIMAL(18,2) DEFAULT 0,
  fob_idr DECIMAL(18,2) DEFAULT 0,
  
  country_of_origin VARCHAR(10),
  packaging_id UUID REFERENCES packaging(id),
  packaging_code VARCHAR(20),
  package_count INTEGER DEFAULT 0,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS peb_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peb_id UUID NOT NULL REFERENCES peb_documents(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS peb_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peb_id UUID NOT NULL REFERENCES peb_documents(id) ON DELETE CASCADE,
  from_status peb_status,
  to_status peb_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_by_email VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_peb_documents_status ON peb_documents(status);
CREATE INDEX IF NOT EXISTS idx_peb_documents_exporter ON peb_documents(exporter_id);
CREATE INDEX IF NOT EXISTS idx_peb_documents_created ON peb_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_peb_items_peb ON peb_items(peb_id);
CREATE INDEX IF NOT EXISTS idx_peb_attachments_peb ON peb_attachments(peb_id);
CREATE INDEX IF NOT EXISTS idx_peb_status_history_peb ON peb_status_history(peb_id);
