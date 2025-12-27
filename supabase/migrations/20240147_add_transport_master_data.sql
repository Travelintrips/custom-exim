-- =====================================================
-- STEP 2: TRANSPORT MASTER DATA SEEDING
-- Customs Offices, Ports, Incoterms, Currencies
-- DJBC & CEISA Ready
-- =====================================================

-- A. CUSTOMS OFFICES TABLE
CREATE TABLE IF NOT EXISTS customs_offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('AIR', 'SEA', 'LAND', 'MIXED')),
  address TEXT,
  city VARCHAR(100),
  province VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  source VARCHAR(50) DEFAULT 'seed_djbc',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- B. UPDATE PORTS TABLE - Add customs_office_id and country_id
ALTER TABLE ports ADD COLUMN IF NOT EXISTS customs_office_id UUID REFERENCES customs_offices(id);
ALTER TABLE ports ADD COLUMN IF NOT EXISTS country_id UUID REFERENCES countries(id);
ALTER TABLE ports ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'seed_unlocode';

-- C. TRANSPORT MODES TABLE
CREATE TABLE IF NOT EXISTS transport_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  requires_vessel BOOLEAN DEFAULT false,
  requires_voyage BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  source VARCHAR(50) DEFAULT 'seed_djbc',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SEED DATA: CUSTOMS OFFICES (DJBC Indonesia)
-- =====================================================
INSERT INTO customs_offices (code, name, type, city, province, source) VALUES
  ('IDCGK', 'KPU Bea Cukai Soekarno-Hatta', 'AIR', 'Tangerang', 'Banten', 'seed_djbc'),
  ('IDTPP', 'KPU Bea Cukai Tanjung Priok', 'SEA', 'Jakarta', 'DKI Jakarta', 'seed_djbc'),
  ('IDSUB', 'KPU Bea Cukai Tanjung Perak', 'SEA', 'Surabaya', 'Jawa Timur', 'seed_djbc'),
  ('IDJKT', 'Kanwil DJBC Jakarta', 'MIXED', 'Jakarta', 'DKI Jakarta', 'seed_djbc'),
  ('IDBPN', 'KPU Bea Cukai Balikpapan', 'SEA', 'Balikpapan', 'Kalimantan Timur', 'seed_djbc'),
  ('IDMES', 'KPU Bea Cukai Belawan', 'SEA', 'Medan', 'Sumatera Utara', 'seed_djbc'),
  ('IDDPS', 'KPU Bea Cukai Ngurah Rai', 'AIR', 'Denpasar', 'Bali', 'seed_djbc'),
  ('IDUPG', 'KPU Bea Cukai Makassar', 'SEA', 'Makassar', 'Sulawesi Selatan', 'seed_djbc')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  city = EXCLUDED.city,
  province = EXCLUDED.province,
  source = EXCLUDED.source,
  updated_at = NOW();

-- =====================================================
-- SEED DATA: TRANSPORT MODES
-- =====================================================
INSERT INTO transport_modes (code, name, requires_vessel, requires_voyage, source) VALUES
  ('SEA', 'Sea Freight', true, true, 'seed_djbc'),
  ('AIR', 'Air Freight', false, false, 'seed_djbc'),
  ('LAND', 'Land Transport', false, false, 'seed_djbc'),
  ('RAIL', 'Rail Freight', false, false, 'seed_djbc'),
  ('MULTI', 'Multimodal Transport', true, true, 'seed_djbc')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  requires_vessel = EXCLUDED.requires_vessel,
  requires_voyage = EXCLUDED.requires_voyage,
  source = EXCLUDED.source;

-- =====================================================
-- SEED DATA: PORTS (UN/LOCODE)
-- =====================================================
INSERT INTO ports (code, name, country_code, type, customs_office, source) VALUES
  ('IDCGK', 'Soekarno-Hatta International Airport', 'ID', 'AIR', 'IDCGK', 'seed_unlocode'),
  ('IDTPP', 'Tanjung Priok Port', 'ID', 'SEA', 'IDTPP', 'seed_unlocode'),
  ('IDSUB', 'Tanjung Perak Port', 'ID', 'SEA', 'IDSUB', 'seed_unlocode'),
  ('IDJKT', 'Jakarta', 'ID', 'SEA', 'IDJKT', 'seed_unlocode'),
  ('IDBPN', 'Balikpapan Port', 'ID', 'SEA', 'IDBPN', 'seed_unlocode'),
  ('IDMES', 'Belawan Port', 'ID', 'SEA', 'IDMES', 'seed_unlocode'),
  ('IDDPS', 'Ngurah Rai International Airport', 'ID', 'AIR', 'IDDPS', 'seed_unlocode'),
  ('IDUPG', 'Makassar Port', 'ID', 'SEA', 'IDUPG', 'seed_unlocode'),
  ('USLAX', 'Los Angeles Port', 'US', 'SEA', NULL, 'seed_unlocode'),
  ('USNYC', 'New York Port', 'US', 'SEA', NULL, 'seed_unlocode'),
  ('USJFK', 'JFK International Airport', 'US', 'AIR', NULL, 'seed_unlocode'),
  ('CNSHA', 'Shanghai Port', 'CN', 'SEA', NULL, 'seed_unlocode'),
  ('CNPVG', 'Shanghai Pudong Airport', 'CN', 'AIR', NULL, 'seed_unlocode'),
  ('SGSIN', 'Singapore Port', 'SG', 'SEA', NULL, 'seed_unlocode'),
  ('SGCHA', 'Singapore Changi Airport', 'SG', 'AIR', NULL, 'seed_unlocode'),
  ('JPTYO', 'Tokyo Port', 'JP', 'SEA', NULL, 'seed_unlocode'),
  ('JPNRT', 'Narita International Airport', 'JP', 'AIR', NULL, 'seed_unlocode'),
  ('NLRTM', 'Rotterdam Port', 'NL', 'SEA', NULL, 'seed_unlocode'),
  ('DEHAM', 'Hamburg Port', 'DE', 'SEA', NULL, 'seed_unlocode'),
  ('AUBNE', 'Brisbane Port', 'AU', 'SEA', NULL, 'seed_unlocode'),
  ('AUSYD', 'Sydney Port', 'AU', 'SEA', NULL, 'seed_unlocode'),
  ('MYKEL', 'Port Klang', 'MY', 'SEA', NULL, 'seed_unlocode'),
  ('MYKUL', 'Kuala Lumpur Airport', 'MY', 'AIR', NULL, 'seed_unlocode'),
  ('THBKK', 'Bangkok Port', 'TH', 'SEA', NULL, 'seed_unlocode'),
  ('VNSGN', 'Ho Chi Minh City Port', 'VN', 'SEA', NULL, 'seed_unlocode'),
  ('PHMNL', 'Manila Port', 'PH', 'SEA', NULL, 'seed_unlocode'),
  ('KRPUS', 'Busan Port', 'KR', 'SEA', NULL, 'seed_unlocode'),
  ('KRICN', 'Incheon Airport', 'KR', 'AIR', NULL, 'seed_unlocode'),
  ('AEDXB', 'Dubai Port', 'AE', 'SEA', NULL, 'seed_unlocode'),
  ('GBFXT', 'Felixstowe Port', 'GB', 'SEA', NULL, 'seed_unlocode'),
  ('GBLHR', 'London Heathrow Airport', 'GB', 'AIR', NULL, 'seed_unlocode')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  country_code = EXCLUDED.country_code,
  type = EXCLUDED.type,
  customs_office = EXCLUDED.customs_office,
  source = EXCLUDED.source;

-- =====================================================
-- SEED DATA: INCOTERMS (ICC 2020)
-- =====================================================
INSERT INTO incoterms (code, name, description, is_active) VALUES
  ('EXW', 'Ex Works', 'Seller makes goods available at their premises. Buyer bears all costs and risks.', true),
  ('FCA', 'Free Carrier', 'Seller delivers goods to carrier nominated by buyer.', true),
  ('CPT', 'Carriage Paid To', 'Seller pays for carriage to named destination.', true),
  ('CIP', 'Carriage and Insurance Paid To', 'Seller pays carriage and insurance to named destination.', true),
  ('DAP', 'Delivered at Place', 'Seller delivers when goods are placed at buyers disposal at named destination.', true),
  ('DPU', 'Delivered at Place Unloaded', 'Seller delivers when goods are unloaded at named destination.', true),
  ('DDP', 'Delivered Duty Paid', 'Seller delivers goods cleared for import with all duties paid.', true),
  ('FAS', 'Free Alongside Ship', 'Seller delivers goods alongside vessel at named port.', true),
  ('FOB', 'Free On Board', 'Seller delivers goods on board vessel at named port of shipment.', true),
  ('CFR', 'Cost and Freight', 'Seller pays costs and freight to bring goods to port of destination.', true),
  ('CIF', 'Cost, Insurance and Freight', 'Seller pays costs, insurance and freight to port of destination.', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- =====================================================
-- SEED DATA: CURRENCIES
-- =====================================================
INSERT INTO currencies (code, name, symbol, exchange_rate, rate_date, is_active) VALUES
  ('IDR', 'Indonesian Rupiah', 'Rp', 1, CURRENT_DATE, true),
  ('USD', 'US Dollar', '$', 15500, CURRENT_DATE, true),
  ('EUR', 'Euro', '€', 16800, CURRENT_DATE, true),
  ('JPY', 'Japanese Yen', '¥', 103, CURRENT_DATE, true),
  ('SGD', 'Singapore Dollar', 'S$', 11500, CURRENT_DATE, true),
  ('CNY', 'Chinese Yuan', '¥', 2150, CURRENT_DATE, true),
  ('AUD', 'Australian Dollar', 'A$', 10200, CURRENT_DATE, true),
  ('GBP', 'British Pound', '£', 19500, CURRENT_DATE, true),
  ('MYR', 'Malaysian Ringgit', 'RM', 3300, CURRENT_DATE, true),
  ('THB', 'Thai Baht', '฿', 435, CURRENT_DATE, true),
  ('KRW', 'South Korean Won', '₩', 11.5, CURRENT_DATE, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  symbol = EXCLUDED.symbol,
  exchange_rate = EXCLUDED.exchange_rate,
  rate_date = EXCLUDED.rate_date,
  is_active = EXCLUDED.is_active;

-- =====================================================
-- UPDATE PORTS: Link to customs_offices and countries
-- =====================================================
UPDATE ports p SET 
  customs_office_id = co.id 
FROM customs_offices co 
WHERE p.customs_office = co.code AND p.customs_office IS NOT NULL;

UPDATE ports p SET 
  country_id = c.id 
FROM countries c 
WHERE p.country_code = c.code AND p.country_code IS NOT NULL;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_customs_offices_code ON customs_offices(code);
CREATE INDEX IF NOT EXISTS idx_customs_offices_type ON customs_offices(type);
CREATE INDEX IF NOT EXISTS idx_customs_offices_active ON customs_offices(is_active);

CREATE INDEX IF NOT EXISTS idx_ports_type ON ports(type);
CREATE INDEX IF NOT EXISTS idx_ports_country ON ports(country_code);
CREATE INDEX IF NOT EXISTS idx_ports_customs ON ports(customs_office_id);

CREATE INDEX IF NOT EXISTS idx_transport_modes_code ON transport_modes(code);
CREATE INDEX IF NOT EXISTS idx_incoterms_code ON incoterms(code);
CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(code);
