/**
 * CEISA Response Handler
 * Parses response XML and extracts registration data, errors, and lane assignment
 */

import { 
  CEISAResponse, 
  EDIFieldError, 
  EDI_ERROR_CODES,
  EDIStatus 
} from './types';
import { verifyXMLHash, extractHashFromSignedXML, removeSignatureFromXML } from './xml-hash';

/**
 * Parse CEISA Response XML
 */
export function parseCEISAResponse(responseXML: string): CEISAResponse {
  const errors: EDIFieldError[] = [];
  
  // Extract basic response info
  const responseCode = extractTag(responseXML, 'RESPONSE_CODE') || 'UNKNOWN';
  const responseMessage = extractTag(responseXML, 'RESPONSE_MESSAGE') || '';
  const success = responseCode === '00' || responseCode === 'SUCCESS';
  
  // Extract registration data for successful responses
  const referenceNumber = extractTag(responseXML, 'REFERENCE_NUMBER');
  const registrationNumber = extractTag(responseXML, 'REGISTRATION_NUMBER');
  const registrationDate = extractTag(responseXML, 'REGISTRATION_DATE');
  
  // Extract PEB-specific data (NPE)
  const npeNumber = extractTag(responseXML, 'NPE_NUMBER');
  const npeDate = extractTag(responseXML, 'NPE_DATE');
  
  // Extract PIB-specific data (SPPB and Lane)
  const sppbNumber = extractTag(responseXML, 'SPPB_NUMBER');
  const sppbDate = extractTag(responseXML, 'SPPB_DATE');
  const lane = extractTag(responseXML, 'LANE') as 'GREEN' | 'YELLOW' | 'RED' | undefined;
  
  // Parse errors if present
  const errorsXML = extractTag(responseXML, 'ERRORS');
  if (errorsXML) {
    const errorMatches = errorsXML.match(/<ERROR>[\s\S]*?<\/ERROR>/gi) || [];
    for (const errorXML of errorMatches) {
      const code = extractTag(errorXML, 'CODE') || '';
      const field = extractTag(errorXML, 'FIELD') || '';
      const message = extractTag(errorXML, 'MESSAGE') || '';
      const value = extractTag(errorXML, 'VALUE');
      
      errors.push({
        code,
        field,
        message,
        value: value || undefined,
      });
    }
  }
  
  return {
    success,
    reference_number: referenceNumber,
    registration_number: registrationNumber,
    registration_date: registrationDate,
    npe_number: npeNumber,
    npe_date: npeDate,
    sppb_number: sppbNumber,
    sppb_date: sppbDate,
    lane,
    response_code: responseCode,
    response_message: responseMessage,
    errors,
    raw_xml: responseXML,
  };
}

/**
 * Extract XML tag value
 */
function extractTag(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Parse error code and map to field
 */
export function parseErrorCode(code: string): { field: string; message: string } {
  const errorMapping = EDI_ERROR_CODES[code];
  if (errorMapping) {
    return errorMapping;
  }
  return { field: 'unknown', message: `Unknown error code: ${code}` };
}

/**
 * Parse multiple errors from response
 */
export function parseErrors(responseXML: string): EDIFieldError[] {
  const errors: EDIFieldError[] = [];
  
  // Parse <ERROR> blocks
  const errorBlocks = responseXML.match(/<ERROR>[\s\S]*?<\/ERROR>/gi) || [];
  
  for (const block of errorBlocks) {
    const code = extractTag(block, 'CODE') || 'UNKNOWN';
    const fieldFromXML = extractTag(block, 'FIELD');
    const messageFromXML = extractTag(block, 'MESSAGE');
    const value = extractTag(block, 'VALUE');
    
    // Try to map from predefined error codes
    const mapping = parseErrorCode(code);
    
    errors.push({
      code,
      field: fieldFromXML || mapping.field,
      message: messageFromXML || mapping.message,
      value: value || undefined,
    });
  }
  
  // Also check for single error format
  const singleErrorCode = extractTag(responseXML, 'ERROR_CODE');
  if (singleErrorCode && !errors.some(e => e.code === singleErrorCode)) {
    const mapping = parseErrorCode(singleErrorCode);
    const singleErrorMessage = extractTag(responseXML, 'ERROR_MESSAGE');
    const singleErrorField = extractTag(responseXML, 'ERROR_FIELD');
    
    errors.push({
      code: singleErrorCode,
      field: singleErrorField || mapping.field,
      message: singleErrorMessage || mapping.message,
    });
  }
  
  return errors;
}

/**
 * Determine EDI Status from response
 */
export function determineStatusFromResponse(response: CEISAResponse): EDIStatus {
  if (response.success) {
    if (response.npe_number || response.sppb_number) {
      return 'ACCEPTED';
    }
    if (response.registration_number) {
      return 'RECEIVED';
    }
    return 'SENT';
  }
  
  if (response.response_code === 'PENDING' || response.response_code === 'IN_QUEUE') {
    return 'PENDING';
  }
  
  if (response.errors.length > 0) {
    return 'REJECTED';
  }
  
  return 'ERROR';
}

/**
 * Verify response XML integrity
 */
export async function verifyResponseIntegrity(responseXML: string): Promise<boolean> {
  const hash = extractHashFromSignedXML(responseXML);
  if (!hash) {
    // No signature found, cannot verify
    return true; // Or false if signature is required
  }
  
  const contentWithoutSignature = removeSignatureFromXML(responseXML);
  return await verifyXMLHash(contentWithoutSignature, hash);
}

/**
 * Extract lane determination reason
 */
export function extractLaneReason(responseXML: string): string | null {
  const reason = extractTag(responseXML, 'LANE_REASON');
  if (reason) return reason;
  
  // Check for common reasons
  const riskLevel = extractTag(responseXML, 'RISK_LEVEL');
  const profileMatch = extractTag(responseXML, 'PROFILE_MATCH');
  
  if (riskLevel || profileMatch) {
    const reasons = [];
    if (riskLevel) reasons.push(`Risk Level: ${riskLevel}`);
    if (profileMatch) reasons.push(`Profile Match: ${profileMatch}`);
    return reasons.join('; ');
  }
  
  return null;
}

/**
 * Generate human-readable error summary
 */
export function generateErrorSummary(errors: EDIFieldError[]): string {
  if (errors.length === 0) return 'No errors';
  
  const grouped = errors.reduce((acc, error) => {
    if (!acc[error.field]) {
      acc[error.field] = [];
    }
    acc[error.field].push(error.message);
    return acc;
  }, {} as Record<string, string[]>);
  
  const lines = Object.entries(grouped).map(([field, messages]) => {
    return `${field}: ${messages.join(', ')}`;
  });
  
  return lines.join('\n');
}

/**
 * Create mock CEISA response for testing
 */
export function createMockCEISAResponse(
  documentType: 'PEB' | 'PIB',
  success: boolean,
  options?: {
    registrationNumber?: string;
    lane?: 'GREEN' | 'YELLOW' | 'RED';
    errors?: EDIFieldError[];
  }
): string {
  const referenceNumber = `CEISA-${Date.now()}`;
  const registrationNumber = options?.registrationNumber || `REG-${Date.now()}`;
  const registrationDate = new Date().toISOString().substring(0, 10);
  
  if (!success && options?.errors && options.errors.length > 0) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<CEISA_RESPONSE>
  <RESPONSE_CODE>ERROR</RESPONSE_CODE>
  <RESPONSE_MESSAGE>Document validation failed</RESPONSE_MESSAGE>
  <REFERENCE_NUMBER>${referenceNumber}</REFERENCE_NUMBER>
  <ERRORS>
${options.errors.map(e => `    <ERROR>
      <CODE>${e.code}</CODE>
      <FIELD>${e.field}</FIELD>
      <MESSAGE>${e.message}</MESSAGE>
      ${e.value ? `<VALUE>${e.value}</VALUE>` : ''}
    </ERROR>`).join('\n')}
  </ERRORS>
</CEISA_RESPONSE>`;
  }
  
  if (documentType === 'PEB') {
    return `<?xml version="1.0" encoding="UTF-8"?>
<CEISA_RESPONSE>
  <RESPONSE_CODE>00</RESPONSE_CODE>
  <RESPONSE_MESSAGE>Document accepted successfully</RESPONSE_MESSAGE>
  <REFERENCE_NUMBER>${referenceNumber}</REFERENCE_NUMBER>
  <REGISTRATION_NUMBER>${registrationNumber}</REGISTRATION_NUMBER>
  <REGISTRATION_DATE>${registrationDate}</REGISTRATION_DATE>
  <NPE_NUMBER>NPE-${Date.now()}</NPE_NUMBER>
  <NPE_DATE>${registrationDate}</NPE_DATE>
</CEISA_RESPONSE>`;
  } else {
    const lane = options?.lane || 'GREEN';
    return `<?xml version="1.0" encoding="UTF-8"?>
<CEISA_RESPONSE>
  <RESPONSE_CODE>00</RESPONSE_CODE>
  <RESPONSE_MESSAGE>Document accepted successfully</RESPONSE_MESSAGE>
  <REFERENCE_NUMBER>${referenceNumber}</REFERENCE_NUMBER>
  <REGISTRATION_NUMBER>${registrationNumber}</REGISTRATION_NUMBER>
  <REGISTRATION_DATE>${registrationDate}</REGISTRATION_DATE>
  <LANE>${lane}</LANE>
  <LANE_REASON>Auto-assigned based on risk profile</LANE_REASON>
  <SPPB_NUMBER>SPPB-${Date.now()}</SPPB_NUMBER>
  <SPPB_DATE>${registrationDate}</SPPB_DATE>
</CEISA_RESPONSE>`;
  }
}
