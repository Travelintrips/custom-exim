export interface BaseMasterData {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface Company extends BaseMasterData {
  type: 'exporter' | 'importer' | 'both';
  npwp: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  country_id: string | null;
  phone: string | null;
  email: string | null;
  source?: string;
  effective_date?: string;
}

export interface Warehouse extends BaseMasterData {
  type: 'TPS' | 'PLB' | 'KB' | 'OTHER';
  address: string | null;
  city: string | null;
  customs_office: string | null;
}

export interface Supplier extends BaseMasterData {
  country: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export interface Buyer extends BaseMasterData {
  country: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export interface HSCode extends BaseMasterData {
  description: string;
  description_id: string | null;
  bm_rate: number;
  ppn_rate: number;
  pph_rate: number;
  unit: string;
  is_restricted: boolean;
}

export interface Product extends BaseMasterData {
  description: string | null;
  hs_code_id: string | null;
  unit: string;
}

export interface Packaging extends BaseMasterData {
  description: string | null;
}

export interface Country extends BaseMasterData {
  iso_alpha3: string | null;
  iso_numeric: string | null;
  name_en: string | null;
  name_local: string | null;
  region: string | null;
  sub_region: string | null;
  source: string | null;
  effective_date: string | null;
}

export interface Port extends BaseMasterData {
  country_code: string | null;
  type: 'SEA' | 'AIR' | 'LAND';
  customs_office: string | null;
}

export interface Incoterm extends BaseMasterData {
  description: string | null;
}

export interface Currency extends BaseMasterData {
  symbol: string | null;
  exchange_rate: number;
  rate_date: string | null;
}

export interface PPJK extends BaseMasterData {
  npwp: string | null;
  nib: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  license_number: string | null;
  license_expiry: string | null;
}

export interface MasterDataHistory {
  id: string;
  table_name: string;
  record_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  changed_by: string | null;
  changed_by_email: string | null;
  changed_at: string;
}

export type MasterDataType = 
  | 'companies' 
  | 'warehouses' 
  | 'suppliers' 
  | 'buyers' 
  | 'hs_codes' 
  | 'products' 
  | 'packaging' 
  | 'countries' 
  | 'ports' 
  | 'incoterms' 
  | 'currencies' 
  | 'ppjk';

export const masterDataConfig: Record<MasterDataType, { 
  label: string; 
  singularLabel: string;
  fields: { key: string; label: string; type: string; required?: boolean }[];
}> = {
  companies: {
    label: 'Exporters/Importers',
    singularLabel: 'Company',
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'type', label: 'Type', type: 'select', required: true },
      { key: 'npwp', label: 'NPWP', type: 'text' },
      { key: 'address', label: 'Address', type: 'textarea' },
      { key: 'city', label: 'City', type: 'text' },
      { key: 'country_id', label: 'Country', type: 'country_select' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'email', label: 'Email', type: 'email' },
    ],
  },
  warehouses: {
    label: 'Warehouses / TPS',
    singularLabel: 'Warehouse',
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'type', label: 'Type', type: 'select', required: true },
      { key: 'address', label: 'Address', type: 'textarea' },
      { key: 'city', label: 'City', type: 'text' },
      { key: 'customs_office', label: 'Customs Office', type: 'text' },
    ],
  },
  suppliers: {
    label: 'Suppliers',
    singularLabel: 'Supplier',
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'country', label: 'Country', type: 'text' },
      { key: 'address', label: 'Address', type: 'textarea' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'email', label: 'Email', type: 'email' },
    ],
  },
  buyers: {
    label: 'Buyers',
    singularLabel: 'Buyer',
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'country', label: 'Country', type: 'text' },
      { key: 'address', label: 'Address', type: 'textarea' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'email', label: 'Email', type: 'email' },
    ],
  },
  hs_codes: {
    label: 'HS Codes',
    singularLabel: 'HS Code',
    fields: [
      { key: 'code', label: 'HS Code', type: 'text', required: true },
      { key: 'description', label: 'Description (EN)', type: 'textarea', required: true },
      { key: 'description_id', label: 'Description (ID)', type: 'textarea' },
      { key: 'bm_rate', label: 'BM Rate (%)', type: 'number' },
      { key: 'ppn_rate', label: 'PPN Rate (%)', type: 'number' },
      { key: 'pph_rate', label: 'PPh Rate (%)', type: 'number' },
      { key: 'unit', label: 'Unit', type: 'text' },
      { key: 'is_restricted', label: 'Restricted', type: 'checkbox' },
    ],
  },
  products: {
    label: 'Products',
    singularLabel: 'Product',
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'hs_code_id', label: 'HS Code', type: 'select' },
      { key: 'unit', label: 'Unit', type: 'text' },
    ],
  },
  packaging: {
    label: 'Packaging',
    singularLabel: 'Packaging',
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  countries: {
    label: 'Countries',
    singularLabel: 'Country',
    fields: [
      { key: 'code', label: 'ISO Alpha-2', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'name_en', label: 'Name (English)', type: 'text' },
      { key: 'iso_alpha3', label: 'ISO Alpha-3', type: 'text' },
      { key: 'iso_numeric', label: 'ISO Numeric', type: 'text' },
      { key: 'region', label: 'Region', type: 'text' },
      { key: 'sub_region', label: 'Sub Region', type: 'text' },
      { key: 'source', label: 'Source', type: 'text' },
    ],
  },
  ports: {
    label: 'Ports & Customs',
    singularLabel: 'Port',
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'country_code', label: 'Country Code', type: 'text' },
      { key: 'type', label: 'Type', type: 'select', required: true },
      { key: 'customs_office', label: 'Customs Office', type: 'text' },
    ],
  },
  incoterms: {
    label: 'Incoterms',
    singularLabel: 'Incoterm',
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  currencies: {
    label: 'Currencies',
    singularLabel: 'Currency',
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'symbol', label: 'Symbol', type: 'text' },
      { key: 'exchange_rate', label: 'Exchange Rate', type: 'number' },
      { key: 'rate_date', label: 'Rate Date', type: 'date' },
    ],
  },
  ppjk: {
    label: 'PPJK',
    singularLabel: 'PPJK',
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'npwp', label: 'NPWP', type: 'text' },
      { key: 'nib', label: 'NIB', type: 'text' },
      { key: 'address', label: 'Address', type: 'textarea' },
      { key: 'city', label: 'City', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'license_number', label: 'License Number', type: 'text' },
      { key: 'license_expiry', label: 'License Expiry', type: 'date' },
    ],
  },
};

export function validateHSCode(code: string): boolean {
  // HS Code should be 6-10 digits
  const cleanCode = code.replace(/\./g, '');
  return /^\d{6,10}$/.test(cleanCode);
}
