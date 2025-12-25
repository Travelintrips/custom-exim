CREATE TYPE pib_status AS ENUM ('DRAFT', 'SUBMITTED', 'SENT_TO_PPJK', 'CEISA_ACCEPTED', 'CEISA_REJECTED', 'SPPB_ISSUED', 'COMPLETED');
CREATE TYPE pib_lane AS ENUM ('GREEN', 'YELLOW', 'RED');

CREATE TABLE IF NOT EXISTS pib_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_number VARCHAR(50) UNIQUE,
  registration_number VARCHAR(50),
  registration_date DATE,
  sppb_number VARCHAR(50),
  sppb_date DATE,
  status pib_status DEFAULT 'DRAFT',
  lane pib_lane,
  
  importer_id UUID REFERENCES companies(id),
  importer_npwp VARCHAR(50),
  importer_name VARCHAR(255),
  importer_address TEXT,
  importer_api VARCHAR(50),
  
  supplier_id UUID REFERENCES suppliers(id),
  supplier_name VARCHAR(255),
  supplier_address TEXT,
  supplier_country VARCHAR(100),
  
  ppjk_id UUID REFERENCES ppjk(id),
  ppjk_npwp VARCHAR(50),
  ppjk_name VARCHAR(255),
  
  customs_office_id UUID REFERENCES ports(id),
  customs_office_code VARCHAR(20),
  customs_office_name VARCHAR(255),
  
  loading_port_id UUID REFERENCES ports(id),
  loading_port_code VARCHAR(20),
  loading_port_name VARCHAR(255),
  loading_country VARCHAR(100),
  
  discharge_port_id UUID REFERENCES ports(id),
  discharge_port_code VARCHAR(20),
  discharge_port_name VARCHAR(255),
  
  incoterm_id UUID REFERENCES incoterms(id),
  incoterm_code VARCHAR(10),
  
  currency_id UUID REFERENCES currencies(id),
  currency_code VARCHAR(10),
  exchange_rate DECIMAL(18,6),
  
  transport_mode VARCHAR(20),
  vessel_name VARCHAR(255),
  voyage_number VARCHAR(50),
  bl_awb_number VARCHAR(100),
  bl_awb_date DATE,
  
  total_packages INTEGER DEFAULT 0,
  package_unit VARCHAR(20),
  gross_weight DECIMAL(18,4) DEFAULT 0,
  net_weight DECIMAL(18,4) DEFAULT 0,
  
  total_cif_value DECIMAL(18,2) DEFAULT 0,
  total_cif_idr DECIMAL(18,2) DEFAULT 0,
  fob_value DECIMAL(18,2) DEFAULT 0,
  freight_value DECIMAL(18,2) DEFAULT 0,
  insurance_value DECIMAL(18,2) DEFAULT 0,
  
  total_bm DECIMAL(18,2) DEFAULT 0,
  total_ppn DECIMAL(18,2) DEFAULT 0,
  total_pph DECIMAL(18,2) DEFAULT 0,
  total_tax DECIMAL(18,2) DEFAULT 0,
  
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

CREATE TABLE IF NOT EXISTS pib_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pib_id UUID NOT NULL REFERENCES pib_documents(id) ON DELETE CASCADE,
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
  cif_value DECIMAL(18,2) DEFAULT 0,
  cif_idr DECIMAL(18,2) DEFAULT 0,
  
  bm_rate DECIMAL(10,4) DEFAULT 0,
  bm_amount DECIMAL(18,2) DEFAULT 0,
  ppn_rate DECIMAL(10,4) DEFAULT 11,
  ppn_amount DECIMAL(18,2) DEFAULT 0,
  pph_rate DECIMAL(10,4) DEFAULT 0,
  pph_amount DECIMAL(18,2) DEFAULT 0,
  total_tax DECIMAL(18,2) DEFAULT 0,
  
  country_of_origin VARCHAR(10),
  packaging_id UUID REFERENCES packaging(id),
  packaging_code VARCHAR(20),
  package_count INTEGER DEFAULT 0,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pib_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pib_id UUID NOT NULL REFERENCES pib_documents(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pib_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pib_id UUID NOT NULL REFERENCES pib_documents(id) ON DELETE CASCADE,
  from_status pib_status,
  to_status pib_status NOT NULL,
  lane pib_lane,
  changed_by UUID REFERENCES auth.users(id),
  changed_by_email VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pib_documents_status ON pib_documents(status);
CREATE INDEX IF NOT EXISTS idx_pib_documents_importer ON pib_documents(importer_id);
CREATE INDEX IF NOT EXISTS idx_pib_documents_lane ON pib_documents(lane);
CREATE INDEX IF NOT EXISTS idx_pib_documents_created ON pib_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pib_items_pib ON pib_items(pib_id);
CREATE INDEX IF NOT EXISTS idx_pib_attachments_pib ON pib_attachments(pib_id);
CREATE INDEX IF NOT EXISTS idx_pib_status_history_pib ON pib_status_history(pib_id);
