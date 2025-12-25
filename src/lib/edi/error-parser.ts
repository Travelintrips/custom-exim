/**
 * EDI Error Parser
 * Field-level error parsing and mapping for CEISA responses
 */

import { EDIFieldError, EDI_ERROR_CODES } from './types';

export interface ParsedError {
  field: string;
  fieldLabel: string;
  code: string;
  message: string;
  value?: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export interface ErrorGroup {
  section: string;
  errors: ParsedError[];
}

// Field label mappings for user-friendly display
const FIELD_LABELS: Record<string, string> = {
  // PEB Fields
  'exporter_npwp': 'Exporter NPWP',
  'exporter_name': 'Exporter Name',
  'exporter_address': 'Exporter Address',
  'buyer_name': 'Buyer Name',
  'buyer_address': 'Buyer Address',
  'buyer_country': 'Buyer Country',
  'ppjk_npwp': 'PPJK NPWP',
  'ppjk_name': 'PPJK Name',
  'loading_port_code': 'Loading Port',
  'destination_port_code': 'Destination Port',
  'destination_country': 'Destination Country',
  'vessel_name': 'Vessel Name',
  'voyage_number': 'Voyage Number',
  'fob_value': 'FOB Value',
  'npe_number': 'NPE Number',
  
  // PIB Fields
  'importer_npwp': 'Importer NPWP',
  'importer_name': 'Importer Name',
  'importer_address': 'Importer Address',
  'importer_api': 'Importer API',
  'api_number': 'API Number',
  'supplier_name': 'Supplier Name',
  'supplier_address': 'Supplier Address',
  'supplier_country': 'Supplier Country',
  'discharge_port_code': 'Discharge Port',
  'loading_country': 'Loading Country',
  'bl_awb_number': 'B/L or AWB Number',
  'bl_awb_date': 'B/L or AWB Date',
  'cif_value': 'CIF Value',
  'sppb_number': 'SPPB Number',
  
  // Common Fields
  'hs_code': 'HS Code',
  'product_description': 'Product Description',
  'quantity': 'Quantity',
  'quantity_unit': 'Quantity Unit',
  'unit_price': 'Unit Price',
  'total_price': 'Total Price',
  'net_weight': 'Net Weight',
  'gross_weight': 'Gross Weight',
  'country_of_origin': 'Country of Origin',
  'packaging_code': 'Packaging Code',
  'package_count': 'Package Count',
  'customs_office_code': 'Customs Office',
  'port_code': 'Port Code',
  'incoterm_code': 'Incoterm',
  'currency_code': 'Currency',
  'exchange_rate': 'Exchange Rate',
  'transport_mode': 'Transport Mode',
  'document_number': 'Document Number',
  'registration_date': 'Registration Date',
  'registration_number': 'Registration Number',
  'total_packages': 'Total Packages',
  'items': 'Items',
  'xml_hash': 'XML Hash',
  'signature': 'Digital Signature',
  
  // Tax Fields
  'bm_rate': 'BM Rate',
  'bm_amount': 'BM Amount',
  'ppn_rate': 'PPN Rate',
  'ppn_amount': 'PPN Amount',
  'pph_rate': 'PPh Rate',
  'pph_amount': 'PPh Amount',
  'total_tax': 'Total Tax',
};

// Field to section mapping
const FIELD_SECTIONS: Record<string, string> = {
  'exporter_npwp': 'Exporter Information',
  'exporter_name': 'Exporter Information',
  'exporter_address': 'Exporter Information',
  'importer_npwp': 'Importer Information',
  'importer_name': 'Importer Information',
  'importer_address': 'Importer Information',
  'importer_api': 'Importer Information',
  'api_number': 'Importer Information',
  'buyer_name': 'Buyer Information',
  'buyer_address': 'Buyer Information',
  'buyer_country': 'Buyer Information',
  'supplier_name': 'Supplier Information',
  'supplier_address': 'Supplier Information',
  'supplier_country': 'Supplier Information',
  'ppjk_npwp': 'PPJK Information',
  'ppjk_name': 'PPJK Information',
  'loading_port_code': 'Transport Details',
  'discharge_port_code': 'Transport Details',
  'destination_port_code': 'Transport Details',
  'destination_country': 'Transport Details',
  'loading_country': 'Transport Details',
  'vessel_name': 'Transport Details',
  'voyage_number': 'Transport Details',
  'transport_mode': 'Transport Details',
  'bl_awb_number': 'Transport Details',
  'bl_awb_date': 'Transport Details',
  'incoterm_code': 'Trade Terms',
  'currency_code': 'Trade Terms',
  'exchange_rate': 'Trade Terms',
  'hs_code': 'Item Details',
  'product_description': 'Item Details',
  'quantity': 'Item Details',
  'unit_price': 'Item Details',
  'net_weight': 'Item Details',
  'gross_weight': 'Item Details',
  'country_of_origin': 'Item Details',
  'fob_value': 'Valuation',
  'cif_value': 'Valuation',
  'bm_rate': 'Tax Calculation',
  'bm_amount': 'Tax Calculation',
  'ppn_rate': 'Tax Calculation',
  'ppn_amount': 'Tax Calculation',
  'pph_rate': 'Tax Calculation',
  'pph_amount': 'Tax Calculation',
  'total_tax': 'Tax Calculation',
  'document_number': 'Document',
  'registration_number': 'Document',
  'registration_date': 'Document',
  'customs_office_code': 'Customs',
  'xml_hash': 'Security',
  'signature': 'Security',
  'items': 'Items',
  'total_packages': 'Packaging',
  'package_count': 'Packaging',
  'packaging_code': 'Packaging',
};

// Error suggestions
const ERROR_SUGGESTIONS: Record<string, string> = {
  'E001': 'NPWP must be 15 digits in format XX.XXX.XXX.X-XXX.XXX',
  'E002': 'NPWP must be 15 digits in format XX.XXX.XXX.X-XXX.XXX',
  'E003': 'HS Code must be 6-10 digits, check the tariff database',
  'E004': 'Verify the HS Code in the official BTKI (Buku Tarif Kepabeanan Indonesia)',
  'E005': 'Enter a quantity greater than 0',
  'E006': 'FOB value is required for export declarations',
  'E007': 'CIF value is required for import declarations',
  'E008': 'Select a valid customs office from the master data',
  'E009': 'Select a valid port from the master data',
  'E010': 'Select a valid currency code (e.g., USD, EUR, CNY)',
  'E011': 'Enter a positive exchange rate value',
  'E012': 'Select a valid incoterm (e.g., FOB, CIF, EXW)',
  'E013': 'Select transport mode: SEA, AIR, LAND, RAIL, or MULTIMODAL',
  'E014': 'Enter the Bill of Lading or Air Waybill number',
  'E015': 'This document number already exists in the system',
  'E016': 'Document with this registration already processed',
  'E017': 'Verify API number format and validity with customs',
  'E018': 'Verify PPJK NPWP and license validity',
  'E019': 'Use valid 2-letter ISO country code',
  'E020': 'Net weight must be greater than 0 kg',
  'E021': 'Gross weight should be greater than or equal to net weight',
  'E022': 'Enter at least 1 package',
  'E023': 'Add at least one item to the declaration',
  'E024': 'Document may have been modified. Please regenerate the XML',
  'E025': 'Digital signature verification failed. Please re-sign the document',
};

/**
 * Parse and enrich error with field label and suggestions
 */
export function parseError(error: EDIFieldError): ParsedError {
  const fieldLabel = FIELD_LABELS[error.field] || error.field;
  const suggestion = ERROR_SUGGESTIONS[error.code];
  
  // Determine severity based on error code
  let severity: 'error' | 'warning' | 'info' = 'error';
  if (error.code.startsWith('W')) {
    severity = 'warning';
  } else if (error.code.startsWith('I')) {
    severity = 'info';
  }
  
  return {
    field: error.field,
    fieldLabel,
    code: error.code,
    message: error.message,
    value: error.value,
    severity,
    suggestion,
  };
}

/**
 * Parse multiple errors and group by section
 */
export function parseAndGroupErrors(errors: EDIFieldError[]): ErrorGroup[] {
  const parsedErrors = errors.map(parseError);
  
  // Group by section
  const groups = new Map<string, ParsedError[]>();
  
  for (const error of parsedErrors) {
    const section = FIELD_SECTIONS[error.field] || 'Other';
    if (!groups.has(section)) {
      groups.set(section, []);
    }
    groups.get(section)!.push(error);
  }
  
  // Convert to array and sort by section
  const sectionOrder = [
    'Document',
    'Exporter Information',
    'Importer Information',
    'Buyer Information',
    'Supplier Information',
    'PPJK Information',
    'Transport Details',
    'Trade Terms',
    'Items',
    'Item Details',
    'Packaging',
    'Valuation',
    'Tax Calculation',
    'Customs',
    'Security',
    'Other',
  ];
  
  const result: ErrorGroup[] = [];
  for (const section of sectionOrder) {
    const sectionErrors = groups.get(section);
    if (sectionErrors && sectionErrors.length > 0) {
      result.push({ section, errors: sectionErrors });
    }
  }
  
  // Add any sections not in the order list
  for (const [section, sectionErrors] of groups) {
    if (!sectionOrder.includes(section) && sectionErrors.length > 0) {
      result.push({ section, errors: sectionErrors });
    }
  }
  
  return result;
}

/**
 * Get field label for display
 */
export function getFieldLabel(field: string): string {
  return FIELD_LABELS[field] || field;
}

/**
 * Get section for a field
 */
export function getFieldSection(field: string): string {
  return FIELD_SECTIONS[field] || 'Other';
}

/**
 * Get suggestion for error code
 */
export function getErrorSuggestion(code: string): string | undefined {
  return ERROR_SUGGESTIONS[code];
}

/**
 * Check if error is critical (must be fixed before submission)
 */
export function isCriticalError(error: EDIFieldError): boolean {
  const criticalCodes = [
    'E001', 'E002', 'E003', 'E004', 'E005', 'E006', 'E007', 
    'E008', 'E009', 'E010', 'E012', 'E013', 'E014', 'E015',
    'E020', 'E021', 'E022', 'E023', 'E024', 'E025'
  ];
  return criticalCodes.includes(error.code);
}

/**
 * Extract item number from error field (for item-level errors)
 */
export function extractItemNumber(field: string): number | null {
  const match = field.match(/items?\[(\d+)\]/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Format errors for display in UI
 */
export function formatErrorsForDisplay(errors: EDIFieldError[]): string[] {
  return errors.map(error => {
    const label = getFieldLabel(error.field);
    const suggestion = getErrorSuggestion(error.code);
    let message = `${label}: ${error.message}`;
    if (error.value) {
      message += ` (Value: ${error.value})`;
    }
    if (suggestion) {
      message += ` - ${suggestion}`;
    }
    return message;
  });
}

/**
 * Count errors by severity
 */
export function countErrorsBySeverity(errors: EDIFieldError[]): {
  error: number;
  warning: number;
  info: number;
} {
  const counts = { error: 0, warning: 0, info: 0 };
  
  for (const error of errors) {
    const parsed = parseError(error);
    counts[parsed.severity]++;
  }
  
  return counts;
}
