/**
 * CEISA Submission Service
 * Handles PEB/PIB submission to CEISA with retry logic
 * 
 * FLOW:
 * 1. Pre-check validation (client + server)
 * 2. Lock document (prevent edits)
 * 3. Generate XML + SHA256 hash
 * 4. Submit to CEISA API
 * 5. Handle response (success/error)
 * 6. Retry on network/timeout errors only
 */

import { supabase } from '@/lib/supabase';

// Max retry attempts for network/timeout errors
const MAX_RETRY_ATTEMPTS = 3;

// Error types that allow retry
const RETRYABLE_ERROR_TYPES = ['NETWORK', 'TIMEOUT'];

/**
 * CEISA Submission Log Entry
 */
export interface CEISASubmissionLog {
  id?: string;
  ref_type: 'PEB' | 'PIB';
  ref_id: string;
  document_number: string | null;
  attempt_number: number;
  request_xml: string;
  request_hash: string;
  response_status?: string;
  response_message?: string;
  response_raw?: string;
  registration_number?: string;
  error_code?: string;
  error_type?: 'NETWORK' | 'TIMEOUT' | 'VALIDATION' | 'SERVER' | 'UNKNOWN';
  is_success: boolean;
  retry_allowed: boolean;
  created_at?: string;
  processed_by?: string;
}

/**
 * CEISA API Response
 */
export interface CEISAResponse {
  success: boolean;
  status: 'SUCCESS' | 'ERROR' | 'PENDING';
  registration_number?: string;
  message?: string;
  error_code?: string;
  raw_response?: string;
}

/**
 * Submission Result
 */
export interface SubmissionResult {
  success: boolean;
  peb_id: string;
  registration_number?: string;
  submitted_at?: string;
  error_message?: string;
  error_type?: string;
  retry_allowed: boolean;
  attempt_number: number;
}

/**
 * Get current retry count for a document
 */
async function getCurrentRetryCount(ref_type: 'PEB' | 'PIB', ref_id: string): Promise<number> {
  const table = ref_type === 'PEB' ? 'peb_documents' : 'pib_documents';
  const { data } = await supabase
    .from(table)
    .select('ceisa_retry_count')
    .eq('id', ref_id)
    .single();
  
  return data?.ceisa_retry_count || 0;
}

/**
 * Update retry count for a document
 */
async function updateRetryCount(
  ref_type: 'PEB' | 'PIB', 
  ref_id: string, 
  retryCount: number,
  errorMessage?: string
): Promise<void> {
  const table = ref_type === 'PEB' ? 'peb_documents' : 'pib_documents';
  await supabase
    .from(table)
    .update({
      ceisa_retry_count: retryCount,
      ceisa_last_error: errorMessage || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ref_id);
}

/**
 * Log submission attempt
 */
async function logSubmissionAttempt(log: CEISASubmissionLog): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  await supabase.from('ceisa_submission_logs').insert([{
    ref_type: log.ref_type,
    ref_id: log.ref_id,
    document_number: log.document_number,
    attempt_number: log.attempt_number,
    request_xml: log.request_xml,
    request_hash: log.request_hash,
    response_status: log.response_status,
    response_message: log.response_message,
    response_raw: log.response_raw,
    registration_number: log.registration_number,
    error_code: log.error_code,
    error_type: log.error_type,
    is_success: log.is_success,
    retry_allowed: log.retry_allowed,
    created_at: new Date().toISOString(),
    processed_by: user?.id,
  }]);
}

/**
 * Determine if error is retryable
 */
function isRetryableError(errorType: string | undefined): boolean {
  if (!errorType) return false;
  return RETRYABLE_ERROR_TYPES.includes(errorType);
}

/**
 * Parse CEISA error type from error message/code
 */
function parseErrorType(error: Error | string, statusCode?: number): 'NETWORK' | 'TIMEOUT' | 'VALIDATION' | 'SERVER' | 'UNKNOWN' {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const lowerMessage = errorMessage.toLowerCase();
  
  // Network errors
  if (lowerMessage.includes('network') || 
      lowerMessage.includes('fetch') || 
      lowerMessage.includes('connection') ||
      lowerMessage.includes('econnrefused')) {
    return 'NETWORK';
  }
  
  // Timeout errors
  if (lowerMessage.includes('timeout') || 
      lowerMessage.includes('timed out') ||
      lowerMessage.includes('aborted')) {
    return 'TIMEOUT';
  }
  
  // Validation errors (4xx)
  if (statusCode && statusCode >= 400 && statusCode < 500) {
    return 'VALIDATION';
  }
  
  // Server errors (5xx)
  if (statusCode && statusCode >= 500) {
    return 'SERVER';
  }
  
  return 'UNKNOWN';
}

/**
 * Submit PEB to CEISA
 * 
 * @param peb_id - UUID of the PEB document
 * @param xmlContent - Pre-generated XML content
 * @param xmlHash - SHA256 hash of XML
 * @returns SubmissionResult
 */
export async function submitToCEISA(
  peb_id: string,
  xmlContent: string,
  xmlHash: string,
  documentNumber?: string
): Promise<SubmissionResult> {
  // Get current retry count
  const currentAttempts = await getCurrentRetryCount('PEB', peb_id);
  const attemptNumber = currentAttempts + 1;
  
  // Check if max retries exceeded
  if (currentAttempts >= MAX_RETRY_ATTEMPTS) {
    return {
      success: false,
      peb_id,
      error_message: `Max retry attempts (${MAX_RETRY_ATTEMPTS}) exceeded`,
      error_type: 'MAX_RETRY_EXCEEDED',
      retry_allowed: false,
      attempt_number: attemptNumber,
    };
  }
  
  try {
    // Call CEISA API via edge function
    const { data, error } = await supabase.functions.invoke('supabase-functions-ceisa-proxy', {
      body: {
        action: 'submit',
        document_type: 'PEB',
        xml: xmlContent,
      },
    });
    
    if (error) {
      throw new Error(error.message || 'Failed to call CEISA API');
    }
    
    // Parse response
    const response = data as CEISAResponse;
    
    // Log attempt
    await logSubmissionAttempt({
      ref_type: 'PEB',
      ref_id: peb_id,
      document_number: documentNumber || null,
      attempt_number: attemptNumber,
      request_xml: xmlContent.substring(0, 10000), // Limit stored size
      request_hash: xmlHash,
      response_status: response.status,
      response_message: response.message,
      response_raw: response.raw_response?.substring(0, 10000),
      registration_number: response.registration_number,
      is_success: response.success,
      retry_allowed: !response.success && isRetryableError('NETWORK'),
    });
    
    if (response.success) {
      // Update document with registration number
      await supabase
        .from('peb_documents')
        .update({
          registration_number: response.registration_number,
          status: 'CEISA_ACCEPTED',
          ceisa_submitted_at: new Date().toISOString(),
          ceisa_response_at: new Date().toISOString(),
          ceisa_retry_count: attemptNumber,
          ceisa_last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', peb_id);
      
      return {
        success: true,
        peb_id,
        registration_number: response.registration_number,
        submitted_at: new Date().toISOString(),
        retry_allowed: false,
        attempt_number: attemptNumber,
      };
    } else {
      // Handle error
      const errorType = parseErrorType(response.message || 'Unknown error');
      const canRetry = isRetryableError(errorType) && attemptNumber < MAX_RETRY_ATTEMPTS;
      
      await updateRetryCount('PEB', peb_id, attemptNumber, response.message);
      
      return {
        success: false,
        peb_id,
        error_message: response.message || 'CEISA submission failed',
        error_type: errorType,
        retry_allowed: canRetry,
        attempt_number: attemptNumber,
      };
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorType = parseErrorType(error instanceof Error ? error : errorMessage);
    const canRetry = isRetryableError(errorType) && attemptNumber < MAX_RETRY_ATTEMPTS;
    
    // Log failed attempt
    await logSubmissionAttempt({
      ref_type: 'PEB',
      ref_id: peb_id,
      document_number: documentNumber || null,
      attempt_number: attemptNumber,
      request_xml: xmlContent.substring(0, 10000),
      request_hash: xmlHash,
      response_status: 'ERROR',
      response_message: errorMessage,
      error_type: errorType,
      is_success: false,
      retry_allowed: canRetry,
    });
    
    await updateRetryCount('PEB', peb_id, attemptNumber, errorMessage);
    
    return {
      success: false,
      peb_id,
      error_message: errorMessage,
      error_type: errorType,
      retry_allowed: canRetry,
      attempt_number: attemptNumber,
    };
  }
}

/**
 * Retry failed submission
 */
export async function retrySubmission(
  ref_type: 'PEB' | 'PIB',
  ref_id: string
): Promise<SubmissionResult> {
  // Get document and its XML
  const table = ref_type === 'PEB' ? 'peb_documents' : 'pib_documents';
  const { data: doc, error } = await supabase
    .from(table)
    .select('id, document_number, xml_content, ceisa_retry_count')
    .eq('id', ref_id)
    .single();
  
  if (error || !doc) {
    return {
      success: false,
      peb_id: ref_id,
      error_message: 'Document not found',
      error_type: 'NOT_FOUND',
      retry_allowed: false,
      attempt_number: 0,
    };
  }
  
  if (!doc.xml_content) {
    return {
      success: false,
      peb_id: ref_id,
      error_message: 'No XML content found. Document may need to be regenerated.',
      error_type: 'VALIDATION',
      retry_allowed: false,
      attempt_number: doc.ceisa_retry_count || 0,
    };
  }
  
  // Get XML hash from document_hashes
  const { data: hashData } = await supabase
    .from('document_hashes')
    .select('xml_hash')
    .eq('ref_type', ref_type)
    .eq('ref_id', ref_id)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single();
  
  return submitToCEISA(
    ref_id,
    doc.xml_content,
    hashData?.xml_hash || '',
    doc.document_number
  );
}

/**
 * Get submission history for a document
 */
export async function getSubmissionHistory(
  ref_type: 'PEB' | 'PIB',
  ref_id: string
): Promise<CEISASubmissionLog[]> {
  const { data, error } = await supabase
    .from('ceisa_submission_logs')
    .select('*')
    .eq('ref_type', ref_type)
    .eq('ref_id', ref_id)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Failed to get submission history:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Submit PIB to CEISA using metadata as source of truth
 * 
 * This function:
 * 1. Validates that metadata exists and is complete
 * 2. Generates XML from metadata
 * 3. Submits to CEISA
 * 
 * @param pib_id - UUID of the PIB document  
 * @returns SubmissionResult
 */
export async function submitPIBToCEISAFromMetadata(
  pib_id: string
): Promise<SubmissionResult> {
  // Fetch PIB document with metadata
  const { data: pib, error: fetchError } = await supabase
    .from('pib_documents')
    .select('id, document_number, metadata, status')
    .eq('id', pib_id)
    .single();
  
  if (fetchError || !pib) {
    return {
      success: false,
      peb_id: pib_id,
      error_message: 'PIB document not found',
      error_type: 'NOT_FOUND',
      retry_allowed: false,
      attempt_number: 0,
    };
  }
  
  // Validate metadata exists
  if (!pib.metadata || Object.keys(pib.metadata).length === 0) {
    return {
      success: false,
      peb_id: pib_id,
      error_message: 'PIB metadata is empty. Please save the PIB first to generate metadata.',
      error_type: 'VALIDATION',
      retry_allowed: false,
      attempt_number: 0,
    };
  }
  
  // Import validation and XML generation functions
  const pibMetadataModule = await import('@/lib/pib/pib-metadata');
  const xmlMapperModule = await import('@/lib/edi/xml-mapper');
  
  const metadata = pib.metadata as pibMetadataModule.PIBMetadata;
  
  // Validate metadata
  const validation = pibMetadataModule.validatePIBMetadata(metadata);
  if (!validation.isValid) {
    return {
      success: false,
      peb_id: pib_id,
      error_message: `Metadata validation failed:\n${validation.errors.join('\n')}`,
      error_type: 'VALIDATION',
      retry_allowed: false,
      attempt_number: 0,
    };
  }
  
  // Check required fields for CEISA
  const items = metadata?.items || [];
  const missingPackagingCode = items.some((item) => !item?.packaging?.code);
  if (missingPackagingCode) {
    return {
      success: false,
      peb_id: pib_id,
      error_message: 'One or more items are missing PACKAGING.CODE. Please select Package Type for all items.',
      error_type: 'VALIDATION',
      retry_allowed: false,
      attempt_number: 0,
    };
  }
  
  const packageUnit = metadata?.header?.totals?.package_unit;
  if (!packageUnit) {
    return {
      success: false,
      peb_id: pib_id,
      error_message: 'HEADER.TOTALS.PACKAGE_UNIT is empty. Please ensure items have Package Type selected.',
      error_type: 'VALIDATION',
      retry_allowed: false,
      attempt_number: 0,
    };
  }
  
  try {
    // Generate XML from metadata
    const xml = xmlMapperModule.mapPIBMetadataToXML(metadata);
    
    // Generate hash
    const { generateXMLHash } = await import('@/lib/edi/xml-hash');
    const hash = await generateXMLHash(xml);
    
    // Store XML content for retry
    await supabase
      .from('pib_documents')
      .update({ xml_content: xml })
      .eq('id', pib_id);
    
    // Submit PIB to CEISA via edge function
    const payload = {
      action: 'submit',
      document_type: 'PIB',
      xml: xml,
      metadata: metadata,
      document_number: pib.document_number,
    };
    
    console.log('Sending to CEISA', payload);
    
    const { data, error } = await supabase.functions.invoke('supabase-functions-ceisa-proxy', {
      body: payload,
    });
    
    if (error) {
      console.error('CEISA Edge Function error:', error);
      throw new Error(error.message || 'Failed to call CEISA API');
    }
    
    console.log('CEISA Response:', data);
    
    // Parse response
    const response = data as CEISAResponse;
    
    // Log attempt
    await logSubmissionAttempt({
      ref_type: 'PIB',
      ref_id: pib_id,
      document_number: pib.document_number || null,
      attempt_number: 1,
      request_xml: xml.substring(0, 10000),
      request_hash: hash,
      response_status: response?.status || 'ERROR',
      response_message: response?.message || 'No response',
      response_raw: response?.raw_response?.substring(0, 10000),
      registration_number: response?.registration_number,
      is_success: response?.success || false,
      retry_allowed: !response?.success,
    });
    
    if (response?.success) {
      // Update document with registration number
      await supabase
        .from('pib_documents')
        .update({
          registration_number: response.registration_number,
          status: 'CEISA_ACCEPTED',
          ceisa_submitted_at: new Date().toISOString(),
          ceisa_response_at: new Date().toISOString(),
          ceisa_last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pib_id);
      
      return {
        success: true,
        peb_id: pib_id,
        registration_number: response.registration_number,
        submitted_at: new Date().toISOString(),
        retry_allowed: false,
        attempt_number: 1,
      };
    } else {
      const errorType = parseErrorType(response?.message || 'Unknown error');
      
      return {
        success: false,
        peb_id: pib_id,
        error_message: response?.message || 'CEISA submission failed',
        error_type: errorType,
        retry_allowed: isRetryableError(errorType),
        attempt_number: 1,
      };
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during XML generation';
    console.error('CEISA submission error:', error);
    return {
      success: false,
      peb_id: pib_id,
      error_message: errorMessage,
      error_type: 'VALIDATION',
      retry_allowed: false,
      attempt_number: 0,
    };
  }
}
