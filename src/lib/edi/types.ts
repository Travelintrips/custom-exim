export type EDIDocumentType = 'PEB' | 'PIB';
export type EDIDirection = 'OUTGOING' | 'INCOMING';
export type EDIStatus = 'PENDING' | 'SENT' | 'RECEIVED' | 'ACCEPTED' | 'REJECTED' | 'ERROR';

export interface EDIMessage {
  id: string;
  document_type: EDIDocumentType;
  document_id: string;
  document_number: string;
  direction: EDIDirection;
  status: EDIStatus;
  xml_content: string;
  xml_hash: string;
  ceisa_reference: string | null;
  response_xml: string | null;
  response_code: string | null;
  response_message: string | null;
  errors: EDIFieldError[];
  sent_at: string | null;
  received_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EDIFieldError {
  field: string;
  code: string;
  message: string;
  value?: string;
}

export interface CEISAResponse {
  success: boolean;
  reference_number: string | null;
  registration_number: string | null;
  registration_date: string | null;
  npe_number?: string | null;
  npe_date?: string | null;
  sppb_number?: string | null;
  sppb_date?: string | null;
  lane?: 'GREEN' | 'YELLOW' | 'RED';
  response_code: string;
  response_message: string;
  errors: EDIFieldError[];
  raw_xml: string;
}

export interface EDITransmissionResult {
  success: boolean;
  message_id: string;
  ceisa_reference: string | null;
  status: EDIStatus;
  errors: EDIFieldError[];
  timestamp: string;
}

export interface EDIArchiveEntry {
  id: string;
  message_id: string;
  document_type: EDIDocumentType;
  document_number: string;
  direction: EDIDirection;
  xml_content: string;
  xml_hash: string;
  archived_at: string;
  archive_path: string;
}

export const EDI_ERROR_CODES: Record<string, { field: string; message: string }> = {
  'E001': { field: 'exporter_npwp', message: 'Invalid NPWP format' },
  'E002': { field: 'importer_npwp', message: 'Invalid NPWP format' },
  'E003': { field: 'hs_code', message: 'Invalid HS Code' },
  'E004': { field: 'hs_code', message: 'HS Code not found in tariff database' },
  'E005': { field: 'quantity', message: 'Quantity must be greater than 0' },
  'E006': { field: 'fob_value', message: 'FOB value is required' },
  'E007': { field: 'cif_value', message: 'CIF value is required' },
  'E008': { field: 'customs_office_code', message: 'Invalid customs office code' },
  'E009': { field: 'port_code', message: 'Invalid port code' },
  'E010': { field: 'currency_code', message: 'Invalid currency code' },
  'E011': { field: 'exchange_rate', message: 'Exchange rate must be greater than 0' },
  'E012': { field: 'incoterm_code', message: 'Invalid incoterm code' },
  'E013': { field: 'transport_mode', message: 'Invalid transport mode' },
  'E014': { field: 'bl_awb_number', message: 'B/L or AWB number is required' },
  'E015': { field: 'document_number', message: 'Duplicate document number' },
  'E016': { field: 'registration_date', message: 'Document already registered' },
  'E017': { field: 'api_number', message: 'Invalid API number' },
  'E018': { field: 'ppjk_npwp', message: 'Invalid PPJK NPWP' },
  'E019': { field: 'country_of_origin', message: 'Invalid country code' },
  'E020': { field: 'net_weight', message: 'Net weight must be greater than 0' },
  'E021': { field: 'gross_weight', message: 'Gross weight must be greater than net weight' },
  'E022': { field: 'total_packages', message: 'Package count must be greater than 0' },
  'E023': { field: 'items', message: 'At least one item is required' },
  'E024': { field: 'xml_hash', message: 'XML integrity verification failed' },
  'E025': { field: 'signature', message: 'Digital signature verification failed' },
};
