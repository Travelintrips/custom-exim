export type PEBStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'SENT_TO_PPJK' 
  | 'CEISA_ACCEPTED' 
  | 'CEISA_REJECTED' 
  | 'NPE_ISSUED' 
  | 'COMPLETED';

export const PEB_STATUS_CONFIG: Record<PEBStatus, { 
  label: string; 
  color: string; 
  description: string;
  isLocked: boolean;
}> = {
  DRAFT: { 
    label: 'Draft', 
    color: 'bg-slate-100 text-slate-700 border-slate-300',
    description: 'Document is being prepared',
    isLocked: false,
  },
  SUBMITTED: { 
    label: 'Submitted', 
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    description: 'Submitted for review',
    isLocked: false,
  },
  SENT_TO_PPJK: { 
    label: 'Sent to PPJK', 
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    description: 'Forwarded to customs broker',
    isLocked: true,
  },
  CEISA_ACCEPTED: { 
    label: 'CEISA Accepted', 
    color: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    description: 'Accepted by CEISA system',
    isLocked: true,
  },
  CEISA_REJECTED: { 
    label: 'CEISA Rejected', 
    color: 'bg-red-100 text-red-700 border-red-300',
    description: 'Rejected by CEISA system',
    isLocked: false,
  },
  NPE_ISSUED: { 
    label: 'NPE Issued', 
    color: 'bg-teal-100 text-teal-700 border-teal-300',
    description: 'Export approval note issued',
    isLocked: true,
  },
  COMPLETED: { 
    label: 'Completed', 
    color: 'bg-green-100 text-green-700 border-green-300',
    description: 'Export process completed',
    isLocked: true,
  },
};

export interface PEBDocument {
  id: string;
  document_number: string | null;
  registration_number: string | null;
  registration_date: string | null;
  npe_number: string | null;
  npe_date: string | null;
  status: PEBStatus;
  
  exporter_id: string | null;
  exporter_npwp: string | null;
  exporter_name: string | null;
  exporter_address: string | null;
  
  buyer_id: string | null;
  buyer_name: string | null;
  buyer_address: string | null;
  buyer_country: string | null;
  
  ppjk_id: string | null;
  ppjk_npwp: string | null;
  ppjk_name: string | null;
  
  customs_office_id: string | null;
  customs_office_code: string | null;
  customs_office_name: string | null;
  
  loading_port_id: string | null;
  loading_port_code: string | null;
  loading_port_name: string | null;
  
  destination_port_id: string | null;
  destination_port_code: string | null;
  destination_port_name: string | null;
  destination_country: string | null;
  
  incoterm_id: string | null;
  incoterm_code: string | null;
  
  currency_id: string | null;
  currency_code: string | null;
  exchange_rate: number | null;
  
  transport_mode: string | null;
  vessel_name: string | null;
  voyage_number: string | null;
  
  total_packages: number;
  package_unit: string | null;
  gross_weight: number;
  net_weight: number;
  
  total_fob_value: number;
  total_fob_idr: number;
  freight_value: number;
  insurance_value: number;
  
  notes: string | null;
  xml_content: string | null;
  ceisa_response: string | null;
  
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
  submitted_at: string | null;
  submitted_by: string | null;
  locked_at: string | null;
  locked_by: string | null;
  
  items?: PEBItem[];
  attachments?: PEBAttachment[];
  status_history?: PEBStatusHistory[];
}

export interface PEBItem {
  id: string;
  peb_id: string;
  item_number: number;
  
  hs_code_id: string | null;
  hs_code: string | null;
  product_id: string | null;
  product_code: string | null;
  product_description: string | null;
  
  quantity: number;
  quantity_unit: string | null;
  net_weight: number;
  gross_weight: number;
  
  unit_price: number;
  total_price: number;
  fob_value: number;
  fob_idr: number;
  
  country_of_origin: string | null;
  packaging_id: string | null;
  packaging_code: string | null;
  package_count: number;
  
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PEBAttachment {
  id: string;
  peb_id: string;
  document_type: string;
  document_name: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface PEBStatusHistory {
  id: string;
  peb_id: string;
  from_status: PEBStatus | null;
  to_status: PEBStatus;
  changed_by: string | null;
  changed_by_email: string | null;
  notes: string | null;
  created_at: string;
}

export const PEB_DOCUMENT_TYPES = [
  { value: 'INVOICE', label: 'Commercial Invoice' },
  { value: 'PACKING_LIST', label: 'Packing List' },
  { value: 'BL', label: 'Bill of Lading' },
  { value: 'AWB', label: 'Air Waybill' },
  { value: 'COO', label: 'Certificate of Origin' },
  { value: 'INSURANCE', label: 'Insurance Certificate' },
  { value: 'FUMIGATION', label: 'Fumigation Certificate' },
  { value: 'HEALTH', label: 'Health Certificate' },
  { value: 'PHYTOSANITARY', label: 'Phytosanitary Certificate' },
  { value: 'SURVEYOR', label: 'Surveyor Report' },
  { value: 'OTHER', label: 'Other Document' },
];

export const TRANSPORT_MODES = [
  { value: 'SEA', label: 'Sea' },
  { value: 'AIR', label: 'Air' },
  { value: 'LAND', label: 'Land' },
  { value: 'RAIL', label: 'Rail' },
  { value: 'MULTIMODAL', label: 'Multimodal' },
];

export interface PEBFormData {
  // Step 1: Document Info
  exporter_id: string;
  exporter_npwp: string;
  exporter_name: string;
  exporter_address: string;
  buyer_id: string;
  buyer_name: string;
  buyer_address: string;
  buyer_country: string;
  ppjk_id: string;
  ppjk_npwp: string;
  ppjk_name: string;
  
  // Step 2: Transport & Destination
  customs_office_id: string;
  customs_office_code: string;
  customs_office_name: string;
  loading_port_id: string;
  loading_port_code: string;
  loading_port_name: string;
  destination_port_id: string;
  destination_port_code: string;
  destination_port_name: string;
  destination_country: string;
  incoterm_id: string;
  incoterm_code: string;
  currency_id: string;
  currency_code: string;
  exchange_rate: number;
  transport_mode: string;
  vessel_name: string;
  voyage_number: string;
  
  // Step 3: Items
  items: Omit<PEBItem, 'id' | 'peb_id' | 'created_at' | 'updated_at'>[];
  
  // Step 4: Attachments
  attachments: { document_type: string; file: File }[];
  
  // Summary
  total_packages: number;
  package_unit: string;
  gross_weight: number;
  net_weight: number;
  total_fob_value: number;
  total_fob_idr: number;
  freight_value: number;
  insurance_value: number;
  notes: string;
}

export function calculateFOB(
  quantity: number,
  unitPrice: number,
  freightPercentage: number = 0,
  insurancePercentage: number = 0
): { fobValue: number } {
  const totalPrice = quantity * unitPrice;
  const fobValue = totalPrice; // FOB already excludes freight and insurance
  return { fobValue };
}

export function calculateTotalFOB(items: PEBItem[], exchangeRate: number): {
  totalFOBValue: number;
  totalFOBIDR: number;
  totalNetWeight: number;
  totalGrossWeight: number;
  totalPackages: number;
} {
  const totalFOBValue = items.reduce((sum, item) => sum + (item.fob_value || 0), 0);
  const totalNetWeight = items.reduce((sum, item) => sum + (item.net_weight || 0), 0);
  const totalGrossWeight = items.reduce((sum, item) => sum + (item.gross_weight || 0), 0);
  const totalPackages = items.reduce((sum, item) => sum + (item.package_count || 0), 0);
  
  return {
    totalFOBValue,
    totalFOBIDR: totalFOBValue * exchangeRate,
    totalNetWeight,
    totalGrossWeight,
    totalPackages,
  };
}

export function generatePEBXML(peb: PEBDocument): string {
  const items = peb.items || [];
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<PEB>
  <HEADER>
    <DOCUMENT_NUMBER>${peb.document_number || ''}</DOCUMENT_NUMBER>
    <REGISTRATION_NUMBER>${peb.registration_number || ''}</REGISTRATION_NUMBER>
    <REGISTRATION_DATE>${peb.registration_date || ''}</REGISTRATION_DATE>
    <CUSTOMS_OFFICE>
      <CODE>${peb.customs_office_code || ''}</CODE>
      <NAME>${peb.customs_office_name || ''}</NAME>
    </CUSTOMS_OFFICE>
    <EXPORTER>
      <NPWP>${peb.exporter_npwp || ''}</NPWP>
      <NAME>${escapeXML(peb.exporter_name || '')}</NAME>
      <ADDRESS>${escapeXML(peb.exporter_address || '')}</ADDRESS>
    </EXPORTER>
    <BUYER>
      <NAME>${escapeXML(peb.buyer_name || '')}</NAME>
      <ADDRESS>${escapeXML(peb.buyer_address || '')}</ADDRESS>
      <COUNTRY>${peb.buyer_country || ''}</COUNTRY>
    </BUYER>
    <PPJK>
      <NPWP>${peb.ppjk_npwp || ''}</NPWP>
      <NAME>${escapeXML(peb.ppjk_name || '')}</NAME>
    </PPJK>
    <TRANSPORT>
      <MODE>${peb.transport_mode || ''}</MODE>
      <VESSEL_NAME>${escapeXML(peb.vessel_name || '')}</VESSEL_NAME>
      <VOYAGE_NUMBER>${peb.voyage_number || ''}</VOYAGE_NUMBER>
      <LOADING_PORT>
        <CODE>${peb.loading_port_code || ''}</CODE>
        <NAME>${escapeXML(peb.loading_port_name || '')}</NAME>
      </LOADING_PORT>
      <DESTINATION_PORT>
        <CODE>${peb.destination_port_code || ''}</CODE>
        <NAME>${escapeXML(peb.destination_port_name || '')}</NAME>
      </DESTINATION_PORT>
      <DESTINATION_COUNTRY>${peb.destination_country || ''}</DESTINATION_COUNTRY>
    </TRANSPORT>
    <TRADE_TERMS>
      <INCOTERM>${peb.incoterm_code || ''}</INCOTERM>
      <CURRENCY>${peb.currency_code || ''}</CURRENCY>
      <EXCHANGE_RATE>${peb.exchange_rate || 0}</EXCHANGE_RATE>
    </TRADE_TERMS>
    <TOTALS>
      <PACKAGES>${peb.total_packages || 0}</PACKAGES>
      <PACKAGE_UNIT>${peb.package_unit || ''}</PACKAGE_UNIT>
      <GROSS_WEIGHT>${peb.gross_weight || 0}</GROSS_WEIGHT>
      <NET_WEIGHT>${peb.net_weight || 0}</NET_WEIGHT>
      <FOB_VALUE>${peb.total_fob_value || 0}</FOB_VALUE>
      <FOB_IDR>${peb.total_fob_idr || 0}</FOB_IDR>
      <FREIGHT>${peb.freight_value || 0}</FREIGHT>
      <INSURANCE>${peb.insurance_value || 0}</INSURANCE>
    </TOTALS>
  </HEADER>
  <ITEMS>
${items.map(item => `    <ITEM>
      <NUMBER>${item.item_number}</NUMBER>
      <HS_CODE>${item.hs_code || ''}</HS_CODE>
      <DESCRIPTION>${escapeXML(item.product_description || '')}</DESCRIPTION>
      <QUANTITY>${item.quantity}</QUANTITY>
      <UNIT>${item.quantity_unit || ''}</UNIT>
      <NET_WEIGHT>${item.net_weight || 0}</NET_WEIGHT>
      <GROSS_WEIGHT>${item.gross_weight || 0}</GROSS_WEIGHT>
      <UNIT_PRICE>${item.unit_price || 0}</UNIT_PRICE>
      <TOTAL_PRICE>${item.total_price || 0}</TOTAL_PRICE>
      <FOB_VALUE>${item.fob_value || 0}</FOB_VALUE>
      <FOB_IDR>${item.fob_idr || 0}</FOB_IDR>
      <COUNTRY_OF_ORIGIN>${item.country_of_origin || ''}</COUNTRY_OF_ORIGIN>
      <PACKAGING>
        <CODE>${item.packaging_code || ''}</CODE>
        <COUNT>${item.package_count || 0}</COUNT>
      </PACKAGING>
    </ITEM>`).join('\n')}
  </ITEMS>
</PEB>`;

  return xml;
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function validatePEBDocument(peb: PEBDocument): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!peb.exporter_npwp) errors.push('Exporter NPWP is required');
  if (!peb.exporter_name) errors.push('Exporter name is required');
  if (!peb.buyer_name) errors.push('Buyer name is required');
  if (!peb.customs_office_code) errors.push('Customs office is required');
  if (!peb.loading_port_code) errors.push('Loading port is required');
  if (!peb.destination_port_code) errors.push('Destination port is required');
  if (!peb.incoterm_code) errors.push('Incoterm is required');
  if (!peb.currency_code) errors.push('Currency is required');
  if (!peb.transport_mode) errors.push('Transport mode is required');
  
  if (!peb.items || peb.items.length === 0) {
    errors.push('At least one item is required');
  } else {
    peb.items.forEach((item, index) => {
      if (!item.hs_code) errors.push(`Item ${index + 1}: HS Code is required`);
      if (!item.product_description) errors.push(`Item ${index + 1}: Description is required`);
      if (!item.quantity || item.quantity <= 0) errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      if (!item.unit_price || item.unit_price <= 0) errors.push(`Item ${index + 1}: Unit price must be greater than 0`);
    });
  }
  
  return { isValid: errors.length === 0, errors };
}
