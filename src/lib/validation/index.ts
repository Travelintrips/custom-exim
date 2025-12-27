/**
 * Validation Module
 * Export all validation utilities
 */

export {
  INCOTERM_TRANSPORT_RULES,
  SEA_ONLY_INCOTERMS,
  ALL_TRANSPORT_MODES,
  UNIVERSAL_INCOTERMS,
  isValidIncotermForTransport,
  getAllowedIncoterms,
  getIncotermTransportError,
  getIncotermTooltip,
  isSeaOnlyIncoterm,
  validateIncotermTransportCombination,
  assertValidIncotermTransport,
  logInvalidIncotermTransportAttempt,
  type ValidationResult as IncotermValidationResult,
} from './incoterm-transport-rules';

/**
 * Interface for PEB validation
 */
export interface PEBValidationData {
  // Document Info
  exporter?: {
    id?: string;
    npwp?: string;
    name?: string;
  };
  buyer?: {
    id?: string;
    name?: string;
  };
  
  // Transport
  transport?: {
    mode?: string;
    vessel_name?: string;
    voyage_number?: string;
  };
  
  // Trade Terms
  trade?: {
    incoterm?: string;
    currency?: string;
    exchange_rate?: number;
  };
  
  // Goods Items
  items?: Array<{
    hs_code?: string;
    hs_unit?: string; // Unit from HS Code master data
    unit?: string; // Unit assigned to item
    net_weight?: number;
    gross_weight?: number;
    quantity?: number;
    fob_value?: number;
    product_description?: string;
  }>;
  
  // Supporting Documents
  documents?: string[]; // Array of document types uploaded
  
  // Transport mode (direct)
  transport_mode?: string;
  incoterm_code?: string;
}

/**
 * Validation Error with code for programmatic handling
 */
export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'warning';
}

/**
 * Validation Result
 */
export interface PEBValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Get required documents based on transport mode
 */
export function getRequiredDocuments(transportMode: string): string[] {
  const baseRequired = ['INVOICE', 'PACKING_LIST'];
  
  if (transportMode === 'AIR') {
    return [...baseRequired, 'AWB'];
  } else if (transportMode === 'SEA') {
    return [...baseRequired, 'BL'];
  }
  
  // Default: require one of BL or AWB
  return baseRequired;
}

/**
 * Check if documents are complete for transport mode
 */
export function validateDocumentsForTransport(
  documents: string[], 
  transportMode: string
): { isValid: boolean; missing: string[] } {
  const required = getRequiredDocuments(transportMode);
  const missing = required.filter(doc => !documents.includes(doc));
  
  return {
    isValid: missing.length === 0,
    missing,
  };
}

/**
 * MAIN VALIDATION ENGINE
 * validateBeforeSubmit - Comprehensive validation before PEB submission
 * 
 * Rules:
 * 1. Exporter NPWP wajib
 * 2. Buyer wajib
 * 3. Transport vs Incoterm validation
 * 4. Goods validation (HS Code, weights, unit)
 * 5. Supporting documents validation
 */
export function validateBeforeSubmit(peb: PEBValidationData): PEBValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  // === DOCUMENT INFO VALIDATION ===
  
  // Exporter NPWP wajib
  if (!peb.exporter?.npwp && !peb.exporter?.id) {
    errors.push({
      code: 'EXPORTER_REQUIRED',
      message: 'Exporter NPWP wajib diisi',
      field: 'exporter_npwp',
      severity: 'error',
    });
  }
  
  // Buyer wajib
  if (!peb.buyer?.name && !peb.buyer?.id) {
    errors.push({
      code: 'BUYER_REQUIRED',
      message: 'Buyer wajib diisi',
      field: 'buyer',
      severity: 'error',
    });
  }
  
  // === TRANSPORT VS INCOTERM VALIDATION ===
  
  const transportMode = peb.transport_mode || peb.transport?.mode;
  const incotermCode = peb.incoterm_code || peb.trade?.incoterm;
  
  if (transportMode && incotermCode) {
    // AIR transport - invalid incoterms
    if (transportMode === 'AIR' && ['FOB', 'CFR', 'CIF', 'FAS'].includes(incotermCode)) {
      errors.push({
        code: 'INVALID_INCOTERM_AIR',
        message: `Incoterm ${incotermCode} tidak valid untuk transport AIR. Gunakan: EXW, FCA, CPT, CIP, DAP, DPU, DDP`,
        field: 'incoterm',
        severity: 'error',
      });
    }
    
    // SEA transport - check using validation library
    if (!isValidIncotermForTransport(transportMode, incotermCode)) {
      const errorMsg = getIncotermTransportError(transportMode, incotermCode);
      if (errorMsg) {
        errors.push({
          code: 'INVALID_INCOTERM_TRANSPORT',
          message: errorMsg,
          field: 'incoterm',
          severity: 'error',
        });
      }
    }
  }
  
  // === GOODS VALIDATION ===
  
  const items = peb.items || [];
  
  if (items.length === 0) {
    errors.push({
      code: 'NO_GOODS_ITEMS',
      message: 'Minimal satu item barang wajib diisi',
      field: 'items',
      severity: 'error',
    });
  }
  
  items.forEach((item, index) => {
    const itemNum = index + 1;
    
    // HS Code wajib
    if (!item.hs_code) {
      errors.push({
        code: 'HS_CODE_REQUIRED',
        message: `Item ${itemNum}: HS Code wajib diisi`,
        field: `items[${index}].hs_code`,
        severity: 'error',
      });
    }
    
    // Net weight harus > 0
    if (!item.net_weight || item.net_weight <= 0) {
      errors.push({
        code: 'NET_WEIGHT_INVALID',
        message: `Item ${itemNum}: Net weight harus lebih dari 0`,
        field: `items[${index}].net_weight`,
        severity: 'error',
      });
    }
    
    // Gross weight >= Net weight
    if (item.gross_weight !== undefined && item.net_weight !== undefined) {
      if (item.gross_weight < item.net_weight) {
        errors.push({
          code: 'GROSS_WEIGHT_INVALID',
          message: `Item ${itemNum}: Gross weight (${item.gross_weight}) tidak boleh kurang dari Net weight (${item.net_weight})`,
          field: `items[${index}].gross_weight`,
          severity: 'error',
        });
      }
    }
    
    // Unit must match HS Code unit
    if (item.hs_unit && item.unit && item.unit !== item.hs_unit) {
      errors.push({
        code: 'UNIT_MISMATCH',
        message: `Item ${itemNum}: Unit (${item.unit}) tidak sesuai dengan HS Code unit (${item.hs_unit})`,
        field: `items[${index}].unit`,
        severity: 'error',
      });
    }
    
    // Quantity > 0
    if (!item.quantity || item.quantity <= 0) {
      errors.push({
        code: 'QUANTITY_INVALID',
        message: `Item ${itemNum}: Quantity harus lebih dari 0`,
        field: `items[${index}].quantity`,
        severity: 'error',
      });
    }
    
    // FOB Value >= 0
    if (item.fob_value === undefined || item.fob_value < 0) {
      errors.push({
        code: 'FOB_VALUE_INVALID',
        message: `Item ${itemNum}: FOB value tidak valid`,
        field: `items[${index}].fob_value`,
        severity: 'error',
      });
    }
    
    // Product description required
    if (!item.product_description || item.product_description.trim() === '') {
      errors.push({
        code: 'DESCRIPTION_REQUIRED',
        message: `Item ${itemNum}: Deskripsi produk wajib diisi`,
        field: `items[${index}].product_description`,
        severity: 'error',
      });
    }
  });
  
  // === SUPPORTING DOCUMENTS VALIDATION ===
  
  if (transportMode) {
    const documents = peb.documents || [];
    const docValidation = validateDocumentsForTransport(documents, transportMode);
    
    if (!docValidation.isValid) {
      docValidation.missing.forEach(doc => {
        const docLabels: Record<string, string> = {
          'INVOICE': 'Commercial Invoice',
          'PACKING_LIST': 'Packing List',
          'BL': 'Bill of Lading',
          'AWB': 'Air Waybill',
        };
        
        errors.push({
          code: 'DOCUMENT_MISSING',
          message: `Dokumen wajib belum lengkap: ${docLabels[doc] || doc}`,
          field: 'documents',
          severity: 'error',
        });
      });
    }
    
    // Specific validation for transport mode
    if (transportMode === 'AIR' && !documents.includes('AWB')) {
      // Already handled above, but keeping for explicit check
    }
    
    if (transportMode === 'SEA' && !documents.includes('BL')) {
      // Already handled above, but keeping for explicit check
    }
  }
  
  // === WARNINGS (Non-blocking) ===
  
  // Check for missing optional fields
  if (!peb.trade?.currency) {
    warnings.push({
      code: 'CURRENCY_NOT_SET',
      message: 'Currency belum dipilih',
      field: 'currency',
      severity: 'warning',
    });
  }
  
  if (!peb.trade?.exchange_rate || peb.trade.exchange_rate <= 0) {
    warnings.push({
      code: 'EXCHANGE_RATE_NOT_SET',
      message: 'Exchange rate belum diisi',
      field: 'exchange_rate',
      severity: 'warning',
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(result: PEBValidationResult): string[] {
  return result.errors.map(e => e.message);
}

/**
 * Check if PEB can be submitted
 */
export function canSubmitPEB(peb: PEBValidationData): { canSubmit: boolean; reason?: string } {
  const validation = validateBeforeSubmit(peb);
  
  if (!validation.isValid) {
    return {
      canSubmit: false,
      reason: validation.errors[0]?.message || 'Validasi gagal',
    };
  }
  
  return { canSubmit: true };
}
