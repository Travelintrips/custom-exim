export type PIBStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'SENT_TO_PPJK' 
  | 'CEISA_ACCEPTED' 
  | 'CEISA_REJECTED' 
  | 'SPPB_ISSUED' 
  | 'COMPLETED';

export type PIBLane = 'GREEN' | 'YELLOW' | 'RED';

export const PIB_STATUS_CONFIG: Record<PIBStatus, { 
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
  SPPB_ISSUED: { 
    label: 'SPPB Issued', 
    color: 'bg-teal-100 text-teal-700 border-teal-300',
    description: 'Import approval note issued',
    isLocked: true,
  },
  COMPLETED: { 
    label: 'Completed', 
    color: 'bg-green-100 text-green-700 border-green-300',
    description: 'Import process completed',
    isLocked: true,
  },
};

export const PIB_LANE_CONFIG: Record<PIBLane, {
  label: string;
  color: string;
  description: string;
}> = {
  GREEN: {
    label: 'Jalur Hijau',
    color: 'bg-green-100 text-green-700 border-green-300',
    description: 'Release langsung tanpa pemeriksaan',
  },
  YELLOW: {
    label: 'Jalur Kuning',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    description: 'Pemeriksaan dokumen',
  },
  RED: {
    label: 'Jalur Merah',
    color: 'bg-red-100 text-red-700 border-red-300',
    description: 'Pemeriksaan fisik barang',
  },
};

export interface PIBDocument {
  id: string;
  document_number: string | null;
  registration_number: string | null;
  registration_date: string | null;
  sppb_number: string | null;
  sppb_date: string | null;
  status: PIBStatus;
  lane: PIBLane | null;
  
  importer_id: string | null;
  importer_npwp: string | null;
  importer_name: string | null;
  importer_address: string | null;
  importer_api: string | null;
  
  supplier_id: string | null;
  supplier_name: string | null;
  supplier_address: string | null;
  supplier_country: string | null;
  
  ppjk_id: string | null;
  ppjk_npwp: string | null;
  ppjk_name: string | null;
  
  customs_office_id: string | null;
  customs_office_code: string | null;
  customs_office_name: string | null;
  
  loading_port_id: string | null;
  loading_port_code: string | null;
  loading_port_name: string | null;
  loading_country: string | null;
  
  discharge_port_id: string | null;
  discharge_port_code: string | null;
  discharge_port_name: string | null;
  
  incoterm_id: string | null;
  incoterm_code: string | null;
  
  currency_id: string | null;
  currency_code: string | null;
  exchange_rate: number | null;
  
  transport_mode: string | null;
  vessel_name: string | null;
  voyage_number: string | null;
  bl_awb_number: string | null;
  bl_awb_date: string | null;
  
  total_packages: number;
  package_unit: string | null;
  gross_weight: number;
  net_weight: number;
  
  total_cif_value: number;
  total_cif_idr: number;
  fob_value: number;
  freight_value: number;
  insurance_value: number;
  
  total_bm: number;
  total_ppn: number;
  total_pph: number;
  total_tax: number;
  
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
  
  items?: PIBItem[];
  attachments?: PIBAttachment[];
  status_history?: PIBStatusHistory[];
}

export interface PIBItem {
  id: string;
  pib_id: string;
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
  cif_value: number;
  cif_idr: number;
  
  bm_rate: number;
  bm_amount: number;
  ppn_rate: number;
  ppn_amount: number;
  pph_rate: number;
  pph_amount: number;
  total_tax: number;
  
  country_of_origin: string | null;
  packaging_id: string | null;
  packaging_code: string | null;
  package_count: number;
  
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PIBAttachment {
  id: string;
  pib_id: string;
  document_type: string;
  document_name: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface PIBStatusHistory {
  id: string;
  pib_id: string;
  from_status: PIBStatus | null;
  to_status: PIBStatus;
  lane: PIBLane | null;
  changed_by: string | null;
  changed_by_email: string | null;
  notes: string | null;
  created_at: string;
}

export const PIB_DOCUMENT_TYPES = [
  { value: 'INVOICE', label: 'Commercial Invoice' },
  { value: 'PACKING_LIST', label: 'Packing List' },
  { value: 'BL', label: 'Bill of Lading' },
  { value: 'AWB', label: 'Air Waybill' },
  { value: 'COO', label: 'Certificate of Origin' },
  { value: 'INSURANCE', label: 'Insurance Certificate' },
  { value: 'LC', label: 'Letter of Credit' },
  { value: 'PO', label: 'Purchase Order' },
  { value: 'CONTRACT', label: 'Sales Contract' },
  { value: 'API', label: 'API Document' },
  { value: 'SURVEYOR', label: 'Surveyor Report' },
  { value: 'OTHER', label: 'Other Document' },
];

// Transport modes are now fetched from database (transport_modes table)
// Codes: SEA, AIR, LAND, RAIL, MULTI
export const TRANSPORT_MODE_CODES = ['SEA', 'AIR', 'LAND', 'RAIL', 'MULTI'] as const;
export type TransportModeCode = typeof TRANSPORT_MODE_CODES[number];

export interface HSCodeTaxRates {
  bm_rate: number;
  ppn_rate: number;
  pph_rate: number;
}

export function calculateCIF(
  fobValue: number,
  freightValue: number,
  insuranceValue: number
): number {
  return fobValue + freightValue + insuranceValue;
}

export function calculateItemTax(
  cifValueIDR: number,
  bmRate: number,
  ppnRate: number,
  pphRate: number,
  hasAPI: boolean = true
): {
  bmAmount: number;
  ppnAmount: number;
  pphAmount: number;
  totalTax: number;
} {
  // BM (Bea Masuk) = CIF * BM Rate
  const bmAmount = cifValueIDR * (bmRate / 100);
  
  // Nilai Impor = CIF + BM
  const importValue = cifValueIDR + bmAmount;
  
  // PPN = Nilai Impor * PPN Rate (default 11%)
  const ppnAmount = importValue * (ppnRate / 100);
  
  // PPh = Nilai Impor * PPh Rate
  // If no API, PPh rate doubles (7.5% -> 15%)
  const effectivePphRate = hasAPI ? pphRate : pphRate * 2;
  const pphAmount = importValue * (effectivePphRate / 100);
  
  return {
    bmAmount,
    ppnAmount,
    pphAmount,
    totalTax: bmAmount + ppnAmount + pphAmount,
  };
}

export function calculateTotalPIBTax(items: PIBItem[]): {
  totalBM: number;
  totalPPN: number;
  totalPPh: number;
  totalTax: number;
  totalCIF: number;
  totalCIFIDR: number;
} {
  const totalBM = items.reduce((sum, item) => sum + (item.bm_amount || 0), 0);
  const totalPPN = items.reduce((sum, item) => sum + (item.ppn_amount || 0), 0);
  const totalPPh = items.reduce((sum, item) => sum + (item.pph_amount || 0), 0);
  const totalCIF = items.reduce((sum, item) => sum + (item.cif_value || 0), 0);
  const totalCIFIDR = items.reduce((sum, item) => sum + (item.cif_idr || 0), 0);
  
  return {
    totalBM,
    totalPPN,
    totalPPh,
    totalTax: totalBM + totalPPN + totalPPh,
    totalCIF,
    totalCIFIDR,
  };
}

export function generatePIBXML(pib: PIBDocument): string {
  const items = pib.items || [];
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<PIB>
  <HEADER>
    <DOCUMENT_NUMBER>${pib.document_number || ''}</DOCUMENT_NUMBER>
    <REGISTRATION_NUMBER>${pib.registration_number || ''}</REGISTRATION_NUMBER>
    <REGISTRATION_DATE>${pib.registration_date || ''}</REGISTRATION_DATE>
    <LANE>${pib.lane || ''}</LANE>
    <CUSTOMS_OFFICE>
      <CODE>${pib.customs_office_code || ''}</CODE>
      <NAME>${pib.customs_office_name || ''}</NAME>
    </CUSTOMS_OFFICE>
    <IMPORTER>
      <NPWP>${pib.importer_npwp || ''}</NPWP>
      <NAME>${escapeXML(pib.importer_name || '')}</NAME>
      <ADDRESS>${escapeXML(pib.importer_address || '')}</ADDRESS>
      <API>${pib.importer_api || ''}</API>
    </IMPORTER>
    <SUPPLIER>
      <NAME>${escapeXML(pib.supplier_name || '')}</NAME>
      <ADDRESS>${escapeXML(pib.supplier_address || '')}</ADDRESS>
      <COUNTRY>${pib.supplier_country || ''}</COUNTRY>
    </SUPPLIER>
    <PPJK>
      <NPWP>${pib.ppjk_npwp || ''}</NPWP>
      <NAME>${escapeXML(pib.ppjk_name || '')}</NAME>
    </PPJK>
    <TRANSPORT>
      <MODE>${pib.transport_mode || ''}</MODE>
      <VESSEL_NAME>${escapeXML(pib.vessel_name || '')}</VESSEL_NAME>
      <VOYAGE_NUMBER>${pib.voyage_number || ''}</VOYAGE_NUMBER>
      <BL_AWB_NUMBER>${pib.bl_awb_number || ''}</BL_AWB_NUMBER>
      <BL_AWB_DATE>${pib.bl_awb_date || ''}</BL_AWB_DATE>
      <LOADING_PORT>
        <CODE>${pib.loading_port_code || ''}</CODE>
        <NAME>${escapeXML(pib.loading_port_name || '')}</NAME>
        <COUNTRY>${pib.loading_country || ''}</COUNTRY>
      </LOADING_PORT>
      <DISCHARGE_PORT>
        <CODE>${pib.discharge_port_code || ''}</CODE>
        <NAME>${escapeXML(pib.discharge_port_name || '')}</NAME>
      </DISCHARGE_PORT>
    </TRANSPORT>
    <TRADE_TERMS>
      <INCOTERM>${pib.incoterm_code || ''}</INCOTERM>
      <CURRENCY>${pib.currency_code || ''}</CURRENCY>
      <EXCHANGE_RATE>${pib.exchange_rate || 0}</EXCHANGE_RATE>
    </TRADE_TERMS>
    <TOTALS>
      <PACKAGES>${pib.total_packages || 0}</PACKAGES>
      <PACKAGE_UNIT>${pib.package_unit || ''}</PACKAGE_UNIT>
      <GROSS_WEIGHT>${pib.gross_weight || 0}</GROSS_WEIGHT>
      <NET_WEIGHT>${pib.net_weight || 0}</NET_WEIGHT>
      <FOB_VALUE>${pib.fob_value || 0}</FOB_VALUE>
      <FREIGHT>${pib.freight_value || 0}</FREIGHT>
      <INSURANCE>${pib.insurance_value || 0}</INSURANCE>
      <CIF_VALUE>${pib.total_cif_value || 0}</CIF_VALUE>
      <CIF_IDR>${pib.total_cif_idr || 0}</CIF_IDR>
    </TOTALS>
    <TAX_SUMMARY>
      <BM_TOTAL>${pib.total_bm || 0}</BM_TOTAL>
      <PPN_TOTAL>${pib.total_ppn || 0}</PPN_TOTAL>
      <PPH_TOTAL>${pib.total_pph || 0}</PPH_TOTAL>
      <TAX_TOTAL>${pib.total_tax || 0}</TAX_TOTAL>
    </TAX_SUMMARY>
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
      <CIF_VALUE>${item.cif_value || 0}</CIF_VALUE>
      <CIF_IDR>${item.cif_idr || 0}</CIF_IDR>
      <COUNTRY_OF_ORIGIN>${item.country_of_origin || ''}</COUNTRY_OF_ORIGIN>
      <TAX>
        <BM_RATE>${item.bm_rate || 0}</BM_RATE>
        <BM_AMOUNT>${item.bm_amount || 0}</BM_AMOUNT>
        <PPN_RATE>${item.ppn_rate || 0}</PPN_RATE>
        <PPN_AMOUNT>${item.ppn_amount || 0}</PPN_AMOUNT>
        <PPH_RATE>${item.pph_rate || 0}</PPH_RATE>
        <PPH_AMOUNT>${item.pph_amount || 0}</PPH_AMOUNT>
        <TOTAL_TAX>${item.total_tax || 0}</TOTAL_TAX>
      </TAX>
      <PACKAGING>
        <CODE>${item.packaging_code || ''}</CODE>
        <COUNT>${item.package_count || 0}</COUNT>
      </PACKAGING>
    </ITEM>`).join('\n')}
  </ITEMS>
</PIB>`;

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

export function validatePIBDocument(pib: PIBDocument): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!pib.importer_npwp) errors.push('Importer NPWP is required');
  if (!pib.importer_name) errors.push('Importer name is required');
  if (!pib.supplier_name) errors.push('Supplier name is required');
  if (!pib.customs_office_code) errors.push('Customs office is required');
  if (!pib.loading_port_code) errors.push('Loading port is required');
  if (!pib.discharge_port_code) errors.push('Discharge port is required');
  if (!pib.incoterm_code) errors.push('Incoterm is required');
  if (!pib.currency_code) errors.push('Currency is required');
  if (!pib.transport_mode) errors.push('Transport mode is required');
  if (!pib.bl_awb_number) errors.push('BL/AWB number is required');
  
  if (!pib.items || pib.items.length === 0) {
    errors.push('At least one item is required');
  } else {
    pib.items.forEach((item, index) => {
      if (!item.hs_code) errors.push(`Item ${index + 1}: HS Code is required`);
      if (!item.product_description) errors.push(`Item ${index + 1}: Description is required`);
      if (!item.quantity || item.quantity <= 0) errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      if (!item.unit_price || item.unit_price <= 0) errors.push(`Item ${index + 1}: Unit price must be greater than 0`);
    });
  }
  
  return { isValid: errors.length === 0, errors };
}
