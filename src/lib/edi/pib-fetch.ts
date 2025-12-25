/**
 * CEISA PIB Fetch Service
 * Fetches PIB (Pemberitahuan Impor Barang) / BC 2.0 data from CEISA Export-Import API
 * 
 * IMPORTANT: "Connected" status only means API is accessible.
 * Data availability must be handled separately - empty results are VALID.
 * Empty data should NOT be treated as an error.
 */

import { PIBDocument, PIBStatus, PIBLane } from '@/types/pib';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface PIBFetchParams {
  /** Nomor Pengajuan (Registration Number) - REQUIRED */
  nomorAju: string;
  /** NPWP Importir - REQUIRED */
  npwpImportir: string;
  /** Kode Kantor Bea Cukai - REQUIRED */
  kodeKantor: string;
  /** Jenis Dokumen - REQUIRED (always BC20 for PIB) */
  jenisDokumen?: 'BC20';
  /** Start date filter (ISO format: YYYY-MM-DD) */
  dateFrom?: string;
  /** End date filter (ISO format: YYYY-MM-DD) */
  dateTo?: string;
  /** Page number for pagination */
  page?: number;
  /** Items per page */
  pageSize?: number;
}

export interface CEISAPJBRawResponse {
  status: string;
  code: number;
  message: string;
  data: CEISAPIBData[];
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface CEISAPIBData {
  nomorAju: string;
  nomorPendaftaran: string;
  tanggalPendaftaran: string;
  nomorSPPB: string | null;
  tanggalSPPB: string | null;
  statusDokumen: string;
  jalur: 'HIJAU' | 'KUNING' | 'MERAH' | null;
  jenisDokumen: string;
  importir: {
    npwp: string;
    nama: string;
    alamat: string;
    api: string | null;
  };
  supplier: {
    nama: string;
    alamat: string;
    negara: string;
  };
  ppjk: {
    npwp: string | null;
    nama: string | null;
  } | null;
  kantorBc: {
    kode: string;
    nama: string;
  };
  pelabuhanMuat: {
    kode: string;
    nama: string;
  };
  pelabuhanBongkar: {
    kode: string;
    nama: string;
  };
  negaraAsal: string;
  incoterm: string;
  mataUang: string;
  kurs: number;
  modaAngkutan: string;
  namaKapal: string | null;
  nomorVoyage: string | null;
  nomorBLAWB: string | null;
  tanggalBLAWB: string | null;
  jumlahKemasan: number;
  satuanKemasan: string;
  beratBruto: number;
  beratNeto: number;
  nilaiCIF: number;
  nilaiCIFIdr: number;
  nilaiFOB: number;
  freight: number;
  asuransi: number;
  totalBM: number;
  totalPPN: number;
  totalPPh: number;
  totalPajak: number;
  barang: CEISAPIBBarang[];
}

export interface CEISAPIBBarang {
  nomorUrut: number;
  hsCode: string;
  uraianBarang: string;
  jumlahBarang: number;
  satuanBarang: string;
  beratNeto: number;
  beratBruto: number;
  hargaSatuan: number;
  nilaiCIF: number;
  nilaiCIFIdr: number;
  tarifBM: number;
  nilaiPajakBM: number;
  tarifPPN: number;
  nilaiPajakPPN: number;
  tarifPPh: number;
  nilaiPajakPPh: number;
  totalPajak: number;
  negaraAsal: string;
}

export interface PIBFetchResult {
  success: boolean;
  data: PIBDocument[];
  rawResponse: CEISAPJBRawResponse | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error?: string;
  httpStatus: number | null;
  timestamp: string;
  responseTime: number;
  /** Message for empty data - NOT an error */
  emptyMessage?: string;
}

export interface PIBFetchConfig {
  baseUrl?: string;
  timeout?: number;
}

// =====================================================
// DEFAULT CONFIG
// =====================================================

const DEFAULT_CONFIG: PIBFetchConfig = {
  baseUrl: import.meta.env.VITE_CEISA_API_URL || 'https://api-ceisa.beacukai.go.id',
  timeout: 30000, // 30 seconds for data fetch
};

// =====================================================
// LOGGING UTILITY
// =====================================================

interface CEISAPIBLogEntry {
  timestamp: string;
  operation: string;
  params: PIBFetchParams;
  httpStatus: number | null;
  responseTime: number;
  success: boolean;
  rawResponse?: unknown;
  error?: string;
}

const ceisaPibLogs: CEISAPIBLogEntry[] = [];
const MAX_LOG_ENTRIES = 100;

function logCEISAPIBOperation(entry: CEISAPIBLogEntry): void {
  // Add to in-memory log
  ceisaPibLogs.unshift(entry);
  if (ceisaPibLogs.length > MAX_LOG_ENTRIES) {
    ceisaPibLogs.pop();
  }
  
  // Console log for debugging
  const logLevel = entry.success ? 'info' : 'error';
  console[logLevel]('[CEISA PIB Fetch]', {
    timestamp: entry.timestamp,
    operation: entry.operation,
    params: entry.params,
    httpStatus: entry.httpStatus,
    responseTime: `${entry.responseTime}ms`,
    success: entry.success,
    error: entry.error,
  });
  
  // Log raw response separately (can be large)
  if (entry.rawResponse) {
    console.debug('[CEISA PIB Raw Response]', entry.rawResponse);
  }
}

export function getCEISAPIBLogs(): CEISAPIBLogEntry[] {
  return [...ceisaPibLogs];
}

export function clearCEISAPIBLogs(): void {
  ceisaPibLogs.length = 0;
}

// =====================================================
// MAPPER: CEISA -> Internal PIBDocument
// =====================================================

function mapCEISAToPIBDocument(ceisaData: CEISAPIBData): PIBDocument {
  return {
    id: `ceisa-${ceisaData.nomorAju}`,
    document_number: ceisaData.nomorAju,
    registration_number: ceisaData.nomorPendaftaran,
    registration_date: ceisaData.tanggalPendaftaran,
    sppb_number: ceisaData.nomorSPPB,
    sppb_date: ceisaData.tanggalSPPB,
    status: mapCEISAStatus(ceisaData.statusDokumen),
    lane: mapCEISALane(ceisaData.jalur),
    
    importer_id: null,
    importer_npwp: ceisaData.importir.npwp,
    importer_name: ceisaData.importir.nama,
    importer_address: ceisaData.importir.alamat,
    importer_api: ceisaData.importir.api,
    
    supplier_id: null,
    supplier_name: ceisaData.supplier.nama,
    supplier_address: ceisaData.supplier.alamat,
    supplier_country: ceisaData.supplier.negara,
    
    ppjk_id: null,
    ppjk_npwp: ceisaData.ppjk?.npwp || null,
    ppjk_name: ceisaData.ppjk?.nama || null,
    
    customs_office_id: null,
    customs_office_code: ceisaData.kantorBc.kode,
    customs_office_name: ceisaData.kantorBc.nama,
    
    loading_port_id: null,
    loading_port_code: ceisaData.pelabuhanMuat.kode,
    loading_port_name: ceisaData.pelabuhanMuat.nama,
    loading_country: ceisaData.negaraAsal,
    
    discharge_port_id: null,
    discharge_port_code: ceisaData.pelabuhanBongkar.kode,
    discharge_port_name: ceisaData.pelabuhanBongkar.nama,
    
    incoterm_id: null,
    incoterm_code: ceisaData.incoterm,
    
    currency_id: null,
    currency_code: ceisaData.mataUang,
    exchange_rate: ceisaData.kurs,
    
    transport_mode: ceisaData.modaAngkutan,
    vessel_name: ceisaData.namaKapal,
    voyage_number: ceisaData.nomorVoyage,
    bl_awb_number: ceisaData.nomorBLAWB,
    bl_awb_date: ceisaData.tanggalBLAWB,
    
    total_packages: ceisaData.jumlahKemasan,
    package_unit: ceisaData.satuanKemasan,
    gross_weight: ceisaData.beratBruto,
    net_weight: ceisaData.beratNeto,
    
    total_cif_value: ceisaData.nilaiCIF,
    total_cif_idr: ceisaData.nilaiCIFIdr,
    fob_value: ceisaData.nilaiFOB,
    freight_value: ceisaData.freight,
    insurance_value: ceisaData.asuransi,
    
    total_bm: ceisaData.totalBM,
    total_ppn: ceisaData.totalPPN,
    total_pph: ceisaData.totalPPh,
    total_tax: ceisaData.totalPajak,
    
    notes: null,
    xml_content: null,
    ceisa_response: JSON.stringify(ceisaData),
    
    created_by: null,
    created_at: new Date().toISOString(),
    updated_by: null,
    updated_at: new Date().toISOString(),
    submitted_at: ceisaData.tanggalPendaftaran,
    submitted_by: null,
    locked_at: null,
    locked_by: null,
    
    items: ceisaData.barang?.map((item, index) => ({
      id: `ceisa-item-${ceisaData.nomorAju}-${index}`,
      pib_id: `ceisa-${ceisaData.nomorAju}`,
      item_number: item.nomorUrut,
      hs_code_id: null,
      hs_code: item.hsCode,
      product_id: null,
      product_code: null,
      product_description: item.uraianBarang,
      quantity: item.jumlahBarang,
      quantity_unit: item.satuanBarang,
      net_weight: item.beratNeto,
      gross_weight: item.beratBruto,
      unit_price: item.hargaSatuan,
      total_price: item.hargaSatuan * item.jumlahBarang,
      cif_value: item.nilaiCIF,
      cif_idr: item.nilaiCIFIdr,
      bm_rate: item.tarifBM,
      bm_amount: item.nilaiPajakBM,
      ppn_rate: item.tarifPPN,
      ppn_amount: item.nilaiPajakPPN,
      pph_rate: item.tarifPPh,
      pph_amount: item.nilaiPajakPPh,
      total_tax: item.totalPajak,
      country_of_origin: item.negaraAsal,
      packaging_id: null,
      packaging_code: null,
      package_count: 0,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })),
  };
}

function mapCEISAStatus(ceisaStatus: string): PIBStatus {
  const statusMap: Record<string, PIBStatus> = {
    'DRAFT': 'DRAFT',
    'SUBMITTED': 'SUBMITTED',
    'DIKIRIM': 'SUBMITTED',
    'DITERIMA': 'CEISA_ACCEPTED',
    'ACCEPTED': 'CEISA_ACCEPTED',
    'DITOLAK': 'CEISA_REJECTED',
    'REJECTED': 'CEISA_REJECTED',
    'SPPB_TERBIT': 'SPPB_ISSUED',
    'SPPB_ISSUED': 'SPPB_ISSUED',
    'SELESAI': 'COMPLETED',
    'COMPLETED': 'COMPLETED',
    'SENT_TO_PPJK': 'SENT_TO_PPJK',
  };
  
  return statusMap[ceisaStatus.toUpperCase()] || 'DRAFT';
}

function mapCEISALane(ceisaLane: 'HIJAU' | 'KUNING' | 'MERAH' | null): PIBLane | null {
  if (!ceisaLane) return null;
  
  const laneMap: Record<string, PIBLane> = {
    'HIJAU': 'GREEN',
    'GREEN': 'GREEN',
    'KUNING': 'YELLOW',
    'YELLOW': 'YELLOW',
    'MERAH': 'RED',
    'RED': 'RED',
  };
  
  return laneMap[ceisaLane.toUpperCase()] || null;
}

// =====================================================
// VALIDATION
// =====================================================

interface PIBParamsValidation {
  valid: boolean;
  errors: string[];
}

function validatePIBParams(params: PIBFetchParams): PIBParamsValidation {
  const errors: string[] = [];
  
  if (!params.nomorAju || params.nomorAju.trim() === '') {
    errors.push('nomorAju is required');
  }
  
  if (!params.npwpImportir || params.npwpImportir.trim() === '') {
    errors.push('npwpImportir is required');
  }
  
  if (!params.kodeKantor || params.kodeKantor.trim() === '') {
    errors.push('kodeKantor is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// =====================================================
// MAIN FETCH FUNCTION
// =====================================================

/**
 * Fetch PIB data from CEISA Export-Import API
 * 
 * @param params - Search parameters (nomorAju, npwpImportir, kodeKantor are REQUIRED)
 * @param config - Optional configuration
 * @returns PIBFetchResult with mapped documents and raw response
 * 
 * IMPORTANT: This function only reads data. 
 * "Connected" status does NOT guarantee data availability.
 * Empty results are a VALID response - NOT an error.
 */
export async function fetchPIBFromCEISA(
  params: PIBFetchParams,
  config: PIBFetchConfig = {}
): Promise<PIBFetchResult> {
  const { baseUrl, timeout } = { ...DEFAULT_CONFIG, ...config };
  const timestamp = new Date().toISOString();
  const startTime = performance.now();
  
  // Ensure jenisDokumen is BC20
  const fullParams: PIBFetchParams = {
    ...params,
    jenisDokumen: 'BC20',
  };
  
  // Validate required parameters
  const validation = validatePIBParams(fullParams);
  if (!validation.valid) {
    const errorMessage = `Missing required parameters: ${validation.errors.join(', ')}`;
    
    logCEISAPIBOperation({
      timestamp,
      operation: 'fetchPIBFromCEISA',
      params: fullParams,
      httpStatus: null,
      responseTime: 0,
      success: false,
      error: errorMessage,
    });
    
    return {
      success: false,
      data: [],
      rawResponse: null,
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
      error: errorMessage,
      httpStatus: null,
      timestamp,
      responseTime: 0,
    };
  }
  
  // Get API key from environment
  const apiKey = import.meta.env.VITE_CEISA_API_KEY;
  
  if (!apiKey) {
    const result: PIBFetchResult = {
      success: false,
      data: [],
      rawResponse: null,
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
      error: 'CEISA API Key not configured',
      httpStatus: null,
      timestamp,
      responseTime: 0,
    };
    
    logCEISAPIBOperation({
      timestamp,
      operation: 'fetchPIBFromCEISA',
      params: fullParams,
      httpStatus: null,
      responseTime: 0,
      success: false,
      error: result.error,
    });
    
    return result;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('nomorAju', fullParams.nomorAju);
    queryParams.append('npwpImportir', fullParams.npwpImportir);
    queryParams.append('kodeKantor', fullParams.kodeKantor);
    queryParams.append('jenisDokumen', 'BC20');
    if (fullParams.dateFrom) queryParams.append('dateFrom', fullParams.dateFrom);
    if (fullParams.dateTo) queryParams.append('dateTo', fullParams.dateTo);
    if (fullParams.page) queryParams.append('page', fullParams.page.toString());
    if (fullParams.pageSize) queryParams.append('pageSize', fullParams.pageSize.toString());

    const url = `${baseUrl}/api/v1/pib?${queryParams.toString()}`;
    
    // Call CEISA READ endpoint
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Math.round(performance.now() - startTime);

    // Parse response
    let rawResponse: CEISAPJBRawResponse | null = null;
    try {
      rawResponse = await response.json();
    } catch {
      // Response is not JSON
    }

    // Log raw response (important for debugging)
    logCEISAPIBOperation({
      timestamp,
      operation: 'fetchPIBFromCEISA',
      params: fullParams,
      httpStatus: response.status,
      responseTime,
      success: response.ok,
      rawResponse: rawResponse,
      error: !response.ok ? `HTTP ${response.status}` : undefined,
    });

    // Handle different HTTP status codes
    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        data: [],
        rawResponse,
        total: 0,
        page: fullParams.page || 1,
        pageSize: fullParams.pageSize || 10,
        totalPages: 0,
        error: response.status === 401 
          ? 'Unauthorized - Invalid API Key' 
          : 'Forbidden - Access denied to this resource',
        httpStatus: response.status,
        timestamp,
        responseTime,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        data: [],
        rawResponse,
        total: 0,
        page: fullParams.page || 1,
        pageSize: fullParams.pageSize || 10,
        totalPages: 0,
        error: rawResponse?.message || `HTTP ${response.status}: ${response.statusText}`,
        httpStatus: response.status,
        timestamp,
        responseTime,
      };
    }

    // Handle 200 with empty data - this is NOT an error
    if (!rawResponse?.data || rawResponse.data.length === 0) {
      return {
        success: true, // Success because API call succeeded
        data: [],
        rawResponse,
        total: 0,
        page: fullParams.page || 1,
        pageSize: fullParams.pageSize || 10,
        totalPages: 0,
        httpStatus: response.status,
        timestamp,
        responseTime,
        emptyMessage: 'Tidak ada data dari CEISA untuk parameter ini',
      };
    }

    // Map CEISA data to internal PIBDocument format
    const mappedData = rawResponse.data.map(mapCEISAToPIBDocument);

    return {
      success: true,
      data: mappedData,
      rawResponse,
      total: rawResponse?.meta?.total || mappedData.length,
      page: rawResponse?.meta?.page || fullParams.page || 1,
      pageSize: rawResponse?.meta?.pageSize || fullParams.pageSize || 10,
      totalPages: rawResponse?.meta?.totalPages || 1,
      httpStatus: response.status,
      timestamp,
      responseTime,
    };

  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);
    let errorMessage = 'Unknown error';
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout';
      } else {
        errorMessage = error.message;
      }
    }

    logCEISAPIBOperation({
      timestamp,
      operation: 'fetchPIBFromCEISA',
      params: fullParams,
      httpStatus: null,
      responseTime,
      success: false,
      error: errorMessage,
    });

    return {
      success: false,
      data: [],
      rawResponse: null,
      total: 0,
      page: fullParams.page || 1,
      pageSize: fullParams.pageSize || 10,
      totalPages: 0,
      error: errorMessage,
      httpStatus: null,
      timestamp,
      responseTime,
    };
  }
}

// =====================================================
// MOCK FUNCTION FOR DEVELOPMENT
// =====================================================

/**
 * Mock fetch for development/testing
 * Simulates CEISA API behavior with realistic data
 */
export async function fetchPIBFromCEISAMock(
  params: PIBFetchParams
): Promise<PIBFetchResult> {
  const timestamp = new Date().toISOString();
  const startTime = performance.now();
  
  // Validate params even in mock
  const validation = validatePIBParams(params);
  if (!validation.valid) {
    return {
      success: false,
      data: [],
      rawResponse: null,
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
      error: `Missing required parameters: ${validation.errors.join(', ')}`,
      httpStatus: null,
      timestamp,
      responseTime: 0,
    };
  }
  
  // Simulate network latency (100-500ms)
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
  
  const responseTime = Math.round(performance.now() - startTime);

  // Simulate different scenarios based on input
  // If nomorAju contains "empty", return empty data
  if (params.nomorAju.toLowerCase().includes('empty')) {
    const rawResponse: CEISAPJBRawResponse = {
      status: 'success',
      code: 200,
      message: 'Data berhasil diambil',
      data: [],
      meta: {
        total: 0,
        page: params.page || 1,
        pageSize: params.pageSize || 10,
        totalPages: 0,
      },
    };

    logCEISAPIBOperation({
      timestamp,
      operation: 'fetchPIBFromCEISAMock',
      params,
      httpStatus: 200,
      responseTime,
      success: true,
      rawResponse,
    });

    return {
      success: true,
      data: [],
      rawResponse,
      total: 0,
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      totalPages: 0,
      httpStatus: 200,
      timestamp,
      responseTime,
      emptyMessage: 'Tidak ada data dari CEISA untuk parameter ini',
    };
  }

  // Generate mock data
  const mockCeisaData: CEISAPIBData[] = [
    {
      nomorAju: params.nomorAju,
      nomorPendaftaran: 'PIB-2024-00001',
      tanggalPendaftaran: '2024-01-15',
      nomorSPPB: 'SPPB-2024-00001',
      tanggalSPPB: '2024-01-17',
      statusDokumen: 'SPPB_TERBIT',
      jalur: 'HIJAU',
      jenisDokumen: 'BC20',
      importir: {
        npwp: params.npwpImportir,
        nama: 'PT IMPORTIR SEJAHTERA',
        alamat: 'Jl. Perdagangan No. 456, Jakarta',
        api: 'API-001234567',
      },
      supplier: {
        nama: 'China Trading Co., Ltd',
        alamat: '88 Trade Avenue, Shanghai',
        negara: 'CN',
      },
      ppjk: {
        npwp: '02.345.678.9-012.000',
        nama: 'PT PPJK GLOBAL',
      },
      kantorBc: {
        kode: params.kodeKantor,
        nama: 'KPPBC TMP Tanjung Priok',
      },
      pelabuhanMuat: {
        kode: 'CNSHA',
        nama: 'Shanghai',
      },
      pelabuhanBongkar: {
        kode: 'IDTPP',
        nama: 'Tanjung Priok',
      },
      negaraAsal: 'CN',
      incoterm: 'CIF',
      mataUang: 'USD',
      kurs: 15500,
      modaAngkutan: '1',
      namaKapal: 'MAERSK LINE',
      nomorVoyage: 'ML-2024-001',
      nomorBLAWB: 'BL-2024-00001',
      tanggalBLAWB: '2024-01-10',
      jumlahKemasan: 200,
      satuanKemasan: 'CTN',
      beratBruto: 10000,
      beratNeto: 9000,
      nilaiCIF: 50000,
      nilaiCIFIdr: 775000000,
      nilaiFOB: 45000,
      freight: 3000,
      asuransi: 2000,
      totalBM: 77500000,
      totalPPN: 85250000,
      totalPPh: 19375000,
      totalPajak: 182125000,
      barang: [
        {
          nomorUrut: 1,
          hsCode: '8471.30.10',
          uraianBarang: 'Laptop Computer',
          jumlahBarang: 100,
          satuanBarang: 'UNIT',
          beratNeto: 4500,
          beratBruto: 5000,
          hargaSatuan: 300,
          nilaiCIF: 30000,
          nilaiCIFIdr: 465000000,
          tarifBM: 10,
          nilaiPajakBM: 46500000,
          tarifPPN: 11,
          nilaiPajakPPN: 56265000,
          tarifPPh: 2.5,
          nilaiPajakPPh: 12806250,
          totalPajak: 115571250,
          negaraAsal: 'CN',
        },
        {
          nomorUrut: 2,
          hsCode: '8471.70.10',
          uraianBarang: 'Computer Monitor',
          jumlahBarang: 100,
          satuanBarang: 'UNIT',
          beratNeto: 4500,
          beratBruto: 5000,
          hargaSatuan: 200,
          nilaiCIF: 20000,
          nilaiCIFIdr: 310000000,
          tarifBM: 10,
          nilaiPajakBM: 31000000,
          tarifPPN: 11,
          nilaiPajakPPN: 28985000,
          tarifPPh: 2.5,
          nilaiPajakPPh: 6568750,
          totalPajak: 66553750,
          negaraAsal: 'CN',
        },
      ],
    },
  ];

  const rawResponse: CEISAPJBRawResponse = {
    status: 'success',
    code: 200,
    message: 'Data berhasil diambil',
    data: mockCeisaData,
    meta: {
      total: mockCeisaData.length,
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      totalPages: 1,
    },
  };

  // Log mock operation
  logCEISAPIBOperation({
    timestamp,
    operation: 'fetchPIBFromCEISAMock',
    params,
    httpStatus: 200,
    responseTime,
    success: true,
    rawResponse,
  });

  const mappedData = mockCeisaData.map(mapCEISAToPIBDocument);

  return {
    success: true,
    data: mappedData,
    rawResponse,
    total: mockCeisaData.length,
    page: params.page || 1,
    pageSize: params.pageSize || 10,
    totalPages: 1,
    httpStatus: 200,
    timestamp,
    responseTime,
  };
}

// =====================================================
// SMART FETCH (AUTO-SWITCH MOCK/REAL)
// =====================================================

/**
 * Smart PIB fetch that uses mock in development without API key
 * 
 * NOTE: Due to CORS restrictions, direct browser-to-CEISA API calls are blocked.
 * In production, this should go through a backend proxy (Edge Function).
 */
export async function fetchPIBFromCEISASmart(
  params: PIBFetchParams,
  config?: PIBFetchConfig
): Promise<PIBFetchResult> {
  const isDev = import.meta.env.DEV;
  const hasMockFlag = import.meta.env.VITE_CEISA_USE_MOCK === 'true';
  const hasApiKey = !!import.meta.env.VITE_CEISA_API_KEY;
  
  // Always use mock in browser due to CORS restrictions
  const isBrowser = typeof window !== 'undefined';
  
  // Use mock if running in browser (CORS), dev without API key, or mock flag set
  if (isBrowser || (isDev && !hasApiKey) || hasMockFlag) {
    return fetchPIBFromCEISAMock(params);
  }
  
  return fetchPIBFromCEISA(params, config);
}
