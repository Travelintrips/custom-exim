/**
 * CEISA Sync Service
 * Manual synchronization of PEB and PIB data from CEISA API
 * 
 * IMPORTANT: 
 * - Sync is MANUAL only - never auto-sync without user action
 * - "Connected" status only means API is accessible, NOT data availability
 */

import { supabase } from '@/lib/supabase';
import { fetchPEBFromCEISASmart, PEBFetchParams, PEBFetchResult, getCEISALogs } from './peb-fetch';
import { fetchPIBFromCEISASmart, PIBFetchParams, PIBFetchResult, getCEISAPIBLogs } from './pib-fetch';
import { PEBDocument } from '@/types/peb';
import { PIBDocument } from '@/types/pib';

// =====================================================
// TYPES
// =====================================================

export interface CEISASyncParams {
  pebParams?: PEBFetchParams;
  pibParams?: PIBFetchParams;
  skipPEB?: boolean;
  skipPIB?: boolean;
}

export interface CEISASyncResult {
  success: boolean;
  timestamp: string;
  totalTime: number;
  peb: {
    fetched: number;
    saved: number;
    errors: string[];
    result?: PEBFetchResult;
  };
  pib: {
    fetched: number;
    saved: number;
    errors: string[];
    result?: PIBFetchResult;
  };
  summary: string;
}

export interface CEISADebugInfo {
  enabled: boolean;
  peb: {
    endpoint: string;
    params: PEBFetchParams | null;
    rawResponse: unknown;
    httpStatus: number | null;
    responseTime: number;
  } | null;
  pib: {
    endpoint: string;
    params: PIBFetchParams | null;
    rawResponse: unknown;
    httpStatus: number | null;
    responseTime: number;
  } | null;
  logs: unknown[];
}

export interface CEISAErrorMapping {
  httpStatus: number | null;
  code: string;
  message: string;
  action: string;
}

// =====================================================
// ERROR HANDLING
// =====================================================

/**
 * Map HTTP status codes to user-friendly messages
 */
export function mapCEISAError(httpStatus: number | null, errorMessage?: string): CEISAErrorMapping {
  if (httpStatus === 401) {
    return {
      httpStatus,
      code: 'AUTH_INVALID',
      message: 'API Key tidak valid',
      action: 'Periksa konfigurasi API Key di Settings',
    };
  }
  
  if (httpStatus === 403) {
    return {
      httpStatus,
      code: 'AUTH_FORBIDDEN',
      message: 'API Key tidak memiliki akses ke resource ini',
      action: 'Hubungi administrator untuk mengaktifkan akses',
    };
  }
  
  if (httpStatus === 404) {
    return {
      httpStatus,
      code: 'ENDPOINT_NOT_FOUND',
      message: 'Endpoint CEISA tidak ditemukan',
      action: 'Periksa konfigurasi URL API CEISA',
    };
  }
  
  if (httpStatus === 200 && errorMessage?.includes('tidak ada data')) {
    return {
      httpStatus,
      code: 'NO_DATA',
      message: 'Tidak ada data dari CEISA untuk parameter ini',
      action: 'Ini bukan error - data memang tidak tersedia untuk kriteria pencarian',
    };
  }
  
  if (httpStatus === 500 || httpStatus === 502 || httpStatus === 503) {
    return {
      httpStatus,
      code: 'SERVER_ERROR',
      message: `Server CEISA mengalami error (${httpStatus})`,
      action: 'Coba lagi beberapa saat, atau hubungi support CEISA',
    };
  }
  
  if (httpStatus === null) {
    if (errorMessage?.includes('timeout')) {
      return {
        httpStatus: null,
        code: 'TIMEOUT',
        message: 'Koneksi ke CEISA timeout',
        action: 'Periksa koneksi internet dan coba lagi',
      };
    }
    
    if (errorMessage?.includes('API Key not configured')) {
      return {
        httpStatus: null,
        code: 'CONFIG_MISSING',
        message: 'API Key CEISA belum dikonfigurasi',
        action: 'Tambahkan VITE_CEISA_API_KEY di Settings',
      };
    }
    
    return {
      httpStatus: null,
      code: 'NETWORK_ERROR',
      message: 'Tidak dapat terhubung ke CEISA',
      action: 'Periksa koneksi internet',
    };
  }
  
  return {
    httpStatus,
    code: 'UNKNOWN',
    message: errorMessage || `Error HTTP ${httpStatus}`,
    action: 'Hubungi administrator',
  };
}

// =====================================================
// SAVE TO DATABASE
// =====================================================

async function savePEBToDatabase(documents: PEBDocument[]): Promise<{ saved: number; errors: string[] }> {
  const errors: string[] = [];
  let saved = 0;
  
  for (const doc of documents) {
    try {
      // Check if document already exists
      const { data: existing } = await supabase
        .from('peb_documents')
        .select('id')
        .eq('document_number', doc.document_number)
        .maybeSingle();
      
      if (existing) {
        // Update existing document
        const { error } = await supabase
          .from('peb_documents')
          .update({
            registration_number: doc.registration_number,
            registration_date: doc.registration_date,
            npe_number: doc.npe_number,
            npe_date: doc.npe_date,
            status: doc.status,
            exporter_npwp: doc.exporter_npwp,
            exporter_name: doc.exporter_name,
            exporter_address: doc.exporter_address,
            buyer_name: doc.buyer_name,
            buyer_address: doc.buyer_address,
            buyer_country: doc.buyer_country,
            customs_office_code: doc.customs_office_code,
            customs_office_name: doc.customs_office_name,
            loading_port_code: doc.loading_port_code,
            loading_port_name: doc.loading_port_name,
            destination_port_code: doc.destination_port_code,
            destination_port_name: doc.destination_port_name,
            destination_country: doc.destination_country,
            incoterm_code: doc.incoterm_code,
            currency_code: doc.currency_code,
            exchange_rate: doc.exchange_rate,
            transport_mode: doc.transport_mode,
            vessel_name: doc.vessel_name,
            voyage_number: doc.voyage_number,
            total_packages: doc.total_packages,
            package_unit: doc.package_unit,
            gross_weight: doc.gross_weight,
            net_weight: doc.net_weight,
            total_fob_value: doc.total_fob_value,
            total_fob_idr: doc.total_fob_idr,
            ceisa_response: doc.ceisa_response,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        
        if (error) {
          errors.push(`Failed to update PEB ${doc.document_number}: ${error.message}`);
        } else {
          saved++;
        }
      } else {
        // Insert new document
        const { error } = await supabase
          .from('peb_documents')
          .insert({
            document_number: doc.document_number,
            registration_number: doc.registration_number,
            registration_date: doc.registration_date,
            npe_number: doc.npe_number,
            npe_date: doc.npe_date,
            status: doc.status,
            exporter_npwp: doc.exporter_npwp,
            exporter_name: doc.exporter_name,
            exporter_address: doc.exporter_address,
            buyer_name: doc.buyer_name,
            buyer_address: doc.buyer_address,
            buyer_country: doc.buyer_country,
            customs_office_code: doc.customs_office_code,
            customs_office_name: doc.customs_office_name,
            loading_port_code: doc.loading_port_code,
            loading_port_name: doc.loading_port_name,
            destination_port_code: doc.destination_port_code,
            destination_port_name: doc.destination_port_name,
            destination_country: doc.destination_country,
            incoterm_code: doc.incoterm_code,
            currency_code: doc.currency_code,
            exchange_rate: doc.exchange_rate,
            transport_mode: doc.transport_mode,
            vessel_name: doc.vessel_name,
            voyage_number: doc.voyage_number,
            total_packages: doc.total_packages,
            package_unit: doc.package_unit,
            gross_weight: doc.gross_weight,
            net_weight: doc.net_weight,
            total_fob_value: doc.total_fob_value,
            total_fob_idr: doc.total_fob_idr,
            ceisa_response: doc.ceisa_response,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        
        if (error) {
          errors.push(`Failed to insert PEB ${doc.document_number}: ${error.message}`);
        } else {
          saved++;
        }
      }
    } catch (err) {
      errors.push(`Exception saving PEB ${doc.document_number}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
  
  return { saved, errors };
}

async function savePIBToDatabase(documents: PIBDocument[]): Promise<{ saved: number; errors: string[] }> {
  const errors: string[] = [];
  let saved = 0;
  
  for (const doc of documents) {
    try {
      // Check if document already exists
      const { data: existing } = await supabase
        .from('pib_documents')
        .select('id')
        .eq('document_number', doc.document_number)
        .maybeSingle();
      
      if (existing) {
        // Update existing document
        const { error } = await supabase
          .from('pib_documents')
          .update({
            registration_number: doc.registration_number,
            registration_date: doc.registration_date,
            sppb_number: doc.sppb_number,
            sppb_date: doc.sppb_date,
            status: doc.status,
            lane: doc.lane,
            importer_npwp: doc.importer_npwp,
            importer_name: doc.importer_name,
            importer_address: doc.importer_address,
            supplier_name: doc.supplier_name,
            supplier_address: doc.supplier_address,
            supplier_country: doc.supplier_country,
            ppjk_npwp: doc.ppjk_npwp,
            ppjk_name: doc.ppjk_name,
            customs_office_code: doc.customs_office_code,
            customs_office_name: doc.customs_office_name,
            loading_port_code: doc.loading_port_code,
            loading_port_name: doc.loading_port_name,
            discharge_port_code: doc.discharge_port_code,
            discharge_port_name: doc.discharge_port_name,
            incoterm_code: doc.incoterm_code,
            currency_code: doc.currency_code,
            exchange_rate: doc.exchange_rate,
            transport_mode: doc.transport_mode,
            vessel_name: doc.vessel_name,
            voyage_number: doc.voyage_number,
            bl_awb_number: doc.bl_awb_number,
            bl_awb_date: doc.bl_awb_date,
            total_packages: doc.total_packages,
            package_unit: doc.package_unit,
            gross_weight: doc.gross_weight,
            net_weight: doc.net_weight,
            total_cif_value: doc.total_cif_value,
            total_cif_idr: doc.total_cif_idr,
            fob_value: doc.fob_value,
            freight_value: doc.freight_value,
            insurance_value: doc.insurance_value,
            total_bm: doc.total_bm,
            total_ppn: doc.total_ppn,
            total_pph: doc.total_pph,
            total_tax: doc.total_tax,
            ceisa_response: doc.ceisa_response,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        
        if (error) {
          errors.push(`Failed to update PIB ${doc.document_number}: ${error.message}`);
        } else {
          saved++;
        }
      } else {
        // Insert new document
        const { error } = await supabase
          .from('pib_documents')
          .insert({
            document_number: doc.document_number,
            registration_number: doc.registration_number,
            registration_date: doc.registration_date,
            sppb_number: doc.sppb_number,
            sppb_date: doc.sppb_date,
            status: doc.status,
            lane: doc.lane,
            importer_npwp: doc.importer_npwp,
            importer_name: doc.importer_name,
            importer_address: doc.importer_address,
            supplier_name: doc.supplier_name,
            supplier_address: doc.supplier_address,
            supplier_country: doc.supplier_country,
            ppjk_npwp: doc.ppjk_npwp,
            ppjk_name: doc.ppjk_name,
            customs_office_code: doc.customs_office_code,
            customs_office_name: doc.customs_office_name,
            loading_port_code: doc.loading_port_code,
            loading_port_name: doc.loading_port_name,
            discharge_port_code: doc.discharge_port_code,
            discharge_port_name: doc.discharge_port_name,
            incoterm_code: doc.incoterm_code,
            currency_code: doc.currency_code,
            exchange_rate: doc.exchange_rate,
            transport_mode: doc.transport_mode,
            vessel_name: doc.vessel_name,
            voyage_number: doc.voyage_number,
            bl_awb_number: doc.bl_awb_number,
            bl_awb_date: doc.bl_awb_date,
            total_packages: doc.total_packages,
            package_unit: doc.package_unit,
            gross_weight: doc.gross_weight,
            net_weight: doc.net_weight,
            total_cif_value: doc.total_cif_value,
            total_cif_idr: doc.total_cif_idr,
            fob_value: doc.fob_value,
            freight_value: doc.freight_value,
            insurance_value: doc.insurance_value,
            total_bm: doc.total_bm,
            total_ppn: doc.total_ppn,
            total_pph: doc.total_pph,
            total_tax: doc.total_tax,
            ceisa_response: doc.ceisa_response,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        
        if (error) {
          errors.push(`Failed to insert PIB ${doc.document_number}: ${error.message}`);
        } else {
          saved++;
        }
      }
    } catch (err) {
      errors.push(`Exception saving PIB ${doc.document_number}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
  
  return { saved, errors };
}

// =====================================================
// MAIN SYNC FUNCTION
// =====================================================

/**
 * Manually sync data from CEISA
 * This function should ONLY be called from user action (button click)
 * NEVER auto-sync without explicit user action
 */
export async function syncFromCEISA(params: CEISASyncParams = {}): Promise<CEISASyncResult> {
  const timestamp = new Date().toISOString();
  const startTime = performance.now();
  
  const result: CEISASyncResult = {
    success: false,
    timestamp,
    totalTime: 0,
    peb: { fetched: 0, saved: 0, errors: [] },
    pib: { fetched: 0, saved: 0, errors: [] },
    summary: '',
  };
  
  // Fetch PEB if not skipped
  if (!params.skipPEB) {
    const pebParams: PEBFetchParams = params.pebParams || {};
    const pebResult = await fetchPEBFromCEISASmart(pebParams);
    result.peb.result = pebResult;
    
    if (pebResult.success) {
      result.peb.fetched = pebResult.data.length;
      
      if (pebResult.data.length > 0) {
        const saveResult = await savePEBToDatabase(pebResult.data);
        result.peb.saved = saveResult.saved;
        result.peb.errors = saveResult.errors;
      }
    } else {
      result.peb.errors.push(pebResult.error || 'Failed to fetch PEB data');
    }
  }
  
  // Fetch PIB if not skipped and has required params
  if (!params.skipPIB && params.pibParams) {
    const pibResult = await fetchPIBFromCEISASmart(params.pibParams);
    result.pib.result = pibResult;
    
    if (pibResult.success) {
      result.pib.fetched = pibResult.data.length;
      
      if (pibResult.data.length > 0) {
        const saveResult = await savePIBToDatabase(pibResult.data);
        result.pib.saved = saveResult.saved;
        result.pib.errors = saveResult.errors;
      } else if (pibResult.emptyMessage) {
        // Empty data is valid, not an error
        result.pib.errors = []; // Clear any errors
      }
    } else {
      result.pib.errors.push(pibResult.error || 'Failed to fetch PIB data');
    }
  }
  
  result.totalTime = Math.round(performance.now() - startTime);
  
  // Determine overall success
  const pebOk = params.skipPEB || result.peb.errors.length === 0;
  const pibOk = params.skipPIB || !params.pibParams || result.pib.errors.length === 0;
  result.success = pebOk && pibOk;
  
  // Generate summary
  const summaryParts: string[] = [];
  if (!params.skipPEB) {
    summaryParts.push(`PEB: ${result.peb.fetched} fetched, ${result.peb.saved} saved`);
  }
  if (!params.skipPIB && params.pibParams) {
    summaryParts.push(`PIB: ${result.pib.fetched} fetched, ${result.pib.saved} saved`);
  }
  result.summary = summaryParts.join(' | ');
  
  return result;
}

// =====================================================
// DEBUG INFO
// =====================================================

/**
 * Get debug information for Super Admin
 * Only visible for super_admin role
 */
export function getDebugInfo(
  pebResult: PEBFetchResult | null,
  pibResult: PIBFetchResult | null,
  pebParams: PEBFetchParams | null,
  pibParams: PIBFetchParams | null
): CEISADebugInfo {
  const baseUrl = import.meta.env.VITE_CEISA_API_URL || 'https://api-ceisa.beacukai.go.id';
  
  return {
    enabled: true,
    peb: pebResult ? {
      endpoint: `${baseUrl}/api/v1/peb`,
      params: pebParams,
      rawResponse: pebResult.rawResponse,
      httpStatus: pebResult.httpStatus,
      responseTime: pebResult.responseTime,
    } : null,
    pib: pibResult ? {
      endpoint: `${baseUrl}/api/v1/pib`,
      params: pibParams,
      rawResponse: pibResult.rawResponse,
      httpStatus: pibResult.httpStatus,
      responseTime: pibResult.responseTime,
    } : null,
    logs: [...getCEISALogs(), ...getCEISAPIBLogs()],
  };
}
