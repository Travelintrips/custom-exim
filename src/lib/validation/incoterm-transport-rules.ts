/**
 * INCOTERM vs TRANSPORT MODE Validation Rules
 * CEISA + DJBC Compliant
 * 
 * Master rules for validating transport mode and incoterm combinations
 * These rules are hardcoded as per official CEISA/DJBC requirements
 */

// Allowed incoterms per transport mode
export const INCOTERM_TRANSPORT_RULES: Record<string, string[]> = {
  AIR: ['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'],
  SEA: ['FOB', 'CFR', 'CIF', 'FAS', 'EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'],
  LAND: ['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'],
  RAIL: ['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'],
  MULTI: ['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'],
};

// Incoterms that are ONLY valid for sea transport
export const SEA_ONLY_INCOTERMS = ['FOB', 'CFR', 'CIF', 'FAS'];

// All transport modes
export const ALL_TRANSPORT_MODES = ['AIR', 'SEA', 'LAND', 'RAIL', 'MULTI'];

// Incoterms valid for all transport modes
export const UNIVERSAL_INCOTERMS = ['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];

/**
 * Check if an incoterm is valid for a given transport mode
 */
export function isValidIncotermForTransport(transportMode: string, incotermCode: string): boolean {
  const allowedIncoterms = INCOTERM_TRANSPORT_RULES[transportMode];
  if (!allowedIncoterms) {
    return false;
  }
  return allowedIncoterms.includes(incotermCode);
}

/**
 * Get allowed incoterms for a transport mode
 */
export function getAllowedIncoterms(transportMode: string): string[] {
  return INCOTERM_TRANSPORT_RULES[transportMode] || [];
}

/**
 * Get validation error message for invalid combination
 */
export function getIncotermTransportError(transportMode: string, incotermCode: string): string | null {
  if (isValidIncotermForTransport(transportMode, incotermCode)) {
    return null;
  }

  if (SEA_ONLY_INCOTERMS.includes(incotermCode)) {
    return `Incoterm ${incotermCode} hanya diperbolehkan untuk transport laut (SEA). Silakan pilih incoterm lain untuk mode ${transportMode}.`;
  }

  return `Incoterm ${incotermCode} tidak valid untuk transport mode ${transportMode}.`;
}

/**
 * Get tooltip/help text for an incoterm
 */
export function getIncotermTooltip(incotermCode: string): string {
  if (SEA_ONLY_INCOTERMS.includes(incotermCode)) {
    return `${incotermCode} hanya berlaku untuk transport laut (SEA)`;
  }
  return `${incotermCode} dapat digunakan untuk semua mode transport`;
}

/**
 * Check if incoterm is sea-only
 */
export function isSeaOnlyIncoterm(incotermCode: string): boolean {
  return SEA_ONLY_INCOTERMS.includes(incotermCode);
}

/**
 * Validate transport mode and incoterm combination
 * Returns validation result with error details
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: {
    transport_mode: string;
    incoterm: string;
    allowed_incoterms: string[];
  };
}

export function validateIncotermTransportCombination(
  transportMode: string,
  incotermCode: string
): ValidationResult {
  const allowed = INCOTERM_TRANSPORT_RULES[transportMode];
  
  if (!allowed) {
    return {
      valid: false,
      error: `Unknown transport mode: ${transportMode}`,
      details: {
        transport_mode: transportMode,
        incoterm: incotermCode,
        allowed_incoterms: [],
      },
    };
  }

  if (!allowed.includes(incotermCode)) {
    return {
      valid: false,
      error: getIncotermTransportError(transportMode, incotermCode) || 'Invalid combination',
      details: {
        transport_mode: transportMode,
        incoterm: incotermCode,
        allowed_incoterms: allowed,
      },
    };
  }

  return { valid: true };
}

/**
 * Assert valid combination - throws if invalid
 * Use before XML generation
 */
export function assertValidIncotermTransport(transportMode: string, incotermCode: string): void {
  const result = validateIncotermTransportCombination(transportMode, incotermCode);
  if (!result.valid) {
    throw new Error(`INVALID_TRANSPORT_INCOTERM_COMBINATION: ${result.error}`);
  }
}

/**
 * Log invalid incoterm-transport attempt for audit
 * Call this whenever user selects invalid combination
 */
export function logInvalidIncotermTransportAttempt(
  transportMode: string,
  incotermCode: string,
  documentType: 'PEB' | 'PIB' = 'PEB'
): void {
  console.warn(`[AUDIT] INVALID_INCOTERM_TRANSPORT - ${documentType}:`, {
    action: 'INVALID_INCOTERM_TRANSPORT',
    details: {
      transport_mode: transportMode,
      incoterm: incotermCode,
      document_type: documentType,
      timestamp: new Date().toISOString(),
    },
  });
}
