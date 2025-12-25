/**
 * CEISA PEB Fetch Service
 * Fetches PEB (Pemberitahuan Ekspor Barang) data from CEISA Export-Import API
 * 
 * IMPORTANT: "Connected" status only means API is accessible.
 * Data availability must be handled separately - empty results are valid.
 */

import { PEBDocument } from '@/types/peb';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface PEBFetchParams {
  /** Nomor Pengajuan (Registration Number) */
  nomorAju?: string;
  /** NPWP Eksportir */
  npwpEksportir?: string;
  /** Kode Kantor Bea Cukai */
  kodeKantor?: string;
  /** Start date filter (ISO format: YYYY-MM-DD) */
  dateFrom?: string;
  /** End date filter (ISO format: YYYY-MM-DD) */
  dateTo?: string;
  /** Page number for pagination */
  page?: number;
  /** Items per page */
  pageSize?: number;
}

export interface CEISAPEBRawResponse {
  status: string;
  code: number;
  message: string;
  data: CEISAPEBData[];
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface CEISAPEBData {
  nomorAju: string;
  nomorPendaftaran: string;
  tanggalPendaftaran: string;
  nomorNPE: string | null;
  tanggalNPE: string | null;
  statusDokumen: string;
  eksportir: {
    npwp: string;
    nama: string;
    alamat: string;
  };
  pembeli: {
    nama: string;
    alamat: string;
    negara: string;
  };
  kantorBc: {
    kode: string;
    nama: string;
  };
  pelabuhanMuat: {
    kode: string;
    nama: string;
  };
  pelabuhanTujuan: {
    kode: string;
    nama: string;
  };
  negaraTujuan: string;
  incoterm: string;
  mataUang: string;
  kurs: number;
  modaAngkutan: string;
  namaKapal: string | null;
  nomorVoyage: string | null;
  jumlahKemasan: number;
  satuanKemasan: string;
  beratBruto: number;
  beratNeto: number;
  nilaiFob: number;
  nilaiFobIdr: number;
  barang: CEISAPEBBarang[];
}

export interface CEISAPEBBarang {
  nomorUrut: number;
  hsCode: string;
  uraianBarang: string;
  jumlahBarang: number;
  satuanBarang: string;
  beratNeto: number;
  beratBruto: number;
  hargaSatuan: number;
  nilaiFob: number;
  asalBarang: string;
}

export interface PEBFetchResult {
  success: boolean;
  data: PEBDocument[];
  rawResponse: CEISAPEBRawResponse | null;
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

export interface PEBFetchConfig {
  baseUrl?: string;
  timeout?: number;
}

// =====================================================
// DEFAULT CONFIG
// =====================================================

const DEFAULT_CONFIG: PEBFetchConfig = {
  baseUrl: import.meta.env.VITE_CEISA_API_URL || 'https://api-ceisa.beacukai.go.id',
  timeout: 30000, // 30 seconds for data fetch
};

// =====================================================
// LOGGING UTILITY
// =====================================================

interface CEISALogEntry {
  timestamp: string;
  operation: string;
  params: PEBFetchParams;
  httpStatus: number | null;
  responseTime: number;
  success: boolean;
  rawResponse?: unknown;
  error?: string;
}

const ceisaLogs: CEISALogEntry[] = [];
const MAX_LOG_ENTRIES = 100;

function logCEISAOperation(entry: CEISALogEntry): void {
  // Add to in-memory log
  ceisaLogs.unshift(entry);
  if (ceisaLogs.length > MAX_LOG_ENTRIES) {
    ceisaLogs.pop();
  }
  
  // Console log for debugging
  const logLevel = entry.success ? 'info' : 'error';
  console[logLevel]('[CEISA PEB Fetch]', {
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
    console.debug('[CEISA PEB Raw Response]', entry.rawResponse);
  }
}

export function getCEISALogs(): CEISALogEntry[] {
  return [...ceisaLogs];
}

export function clearCEISALogs(): void {
  ceisaLogs.length = 0;
}

// =====================================================
// MAPPER: CEISA -> Internal PEBDocument
// =====================================================

function mapCEISAToPEBDocument(ceisaData: CEISAPEBData): PEBDocument {
  return {
    id: `ceisa-${ceisaData.nomorAju}`,
    document_number: ceisaData.nomorAju,
    registration_number: ceisaData.nomorPendaftaran,
    registration_date: ceisaData.tanggalPendaftaran,
    npe_number: ceisaData.nomorNPE,
    npe_date: ceisaData.tanggalNPE,
    status: mapCEISAStatus(ceisaData.statusDokumen),
    
    exporter_id: null,
    exporter_npwp: ceisaData.eksportir.npwp,
    exporter_name: ceisaData.eksportir.nama,
    exporter_address: ceisaData.eksportir.alamat,
    
    buyer_id: null,
    buyer_name: ceisaData.pembeli.nama,
    buyer_address: ceisaData.pembeli.alamat,
    buyer_country: ceisaData.pembeli.negara,
    
    ppjk_id: null,
    ppjk_npwp: null,
    ppjk_name: null,
    
    customs_office_id: null,
    customs_office_code: ceisaData.kantorBc.kode,
    customs_office_name: ceisaData.kantorBc.nama,
    
    loading_port_id: null,
    loading_port_code: ceisaData.pelabuhanMuat.kode,
    loading_port_name: ceisaData.pelabuhanMuat.nama,
    
    destination_port_id: null,
    destination_port_code: ceisaData.pelabuhanTujuan.kode,
    destination_port_name: ceisaData.pelabuhanTujuan.nama,
    destination_country: ceisaData.negaraTujuan,
    
    incoterm_id: null,
    incoterm_code: ceisaData.incoterm,
    
    currency_id: null,
    currency_code: ceisaData.mataUang,
    exchange_rate: ceisaData.kurs,
    
    transport_mode: ceisaData.modaAngkutan,
    vessel_name: ceisaData.namaKapal,
    voyage_number: ceisaData.nomorVoyage,
    
    total_packages: ceisaData.jumlahKemasan,
    package_unit: ceisaData.satuanKemasan,
    gross_weight: ceisaData.beratBruto,
    net_weight: ceisaData.beratNeto,
    
    total_fob_value: ceisaData.nilaiFob,
    total_fob_idr: ceisaData.nilaiFobIdr,
    freight_value: 0,
    insurance_value: 0,
    
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
      peb_id: `ceisa-${ceisaData.nomorAju}`,
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
      fob_value: item.nilaiFob,
      fob_idr: 0,
      country_of_origin: item.asalBarang,
      packaging_id: null,
      packaging_code: null,
      package_count: 0,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })),
  };
}

function mapCEISAStatus(ceisaStatus: string): PEBDocument['status'] {
  const statusMap: Record<string, PEBDocument['status']> = {
    'DRAFT': 'DRAFT',
    'SUBMITTED': 'SUBMITTED',
    'DIKIRIM': 'SUBMITTED',
    'DITERIMA': 'CEISA_ACCEPTED',
    'ACCEPTED': 'CEISA_ACCEPTED',
    'DITOLAK': 'CEISA_REJECTED',
    'REJECTED': 'CEISA_REJECTED',
    'NPE_TERBIT': 'NPE_ISSUED',
    'NPE_ISSUED': 'NPE_ISSUED',
    'SELESAI': 'COMPLETED',
    'COMPLETED': 'COMPLETED',
  };
  
  return statusMap[ceisaStatus.toUpperCase()] || 'DRAFT';
}

// =====================================================
// MAIN FETCH FUNCTION
// =====================================================

/**
 * Fetch PEB data from CEISA Export-Import API
 * 
 * @param params - Search parameters
 * @param config - Optional configuration
 * @returns PEBFetchResult with mapped documents and raw response
 * 
 * IMPORTANT: This function only reads data. 
 * "Connected" status does NOT guarantee data availability.
 * Empty results are a valid response.
 */
export async function fetchPEBFromCEISA(
  params: PEBFetchParams,
  config: PEBFetchConfig = {}
): Promise<PEBFetchResult> {
  const { baseUrl, timeout } = { ...DEFAULT_CONFIG, ...config };
  const timestamp = new Date().toISOString();
  const startTime = performance.now();
  
  // Get API key from environment
  const apiKey = import.meta.env.VITE_CEISA_API_KEY;
  
  if (!apiKey) {
    const result: PEBFetchResult = {
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
    
    logCEISAOperation({
      timestamp,
      operation: 'fetchPEBFromCEISA',
      params,
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
    if (params.nomorAju) queryParams.append('nomorAju', params.nomorAju);
    if (params.npwpEksportir) queryParams.append('npwpEksportir', params.npwpEksportir);
    if (params.kodeKantor) queryParams.append('kodeKantor', params.kodeKantor);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    const url = `${baseUrl}/api/v1/peb?${queryParams.toString()}`;
    
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
    let rawResponse: CEISAPEBRawResponse | null = null;
    try {
      rawResponse = await response.json();
    } catch {
      // Response is not JSON
    }

    // Log raw response (important for debugging)
    logCEISAOperation({
      timestamp,
      operation: 'fetchPEBFromCEISA',
      params,
      httpStatus: response.status,
      responseTime,
      success: response.ok,
      rawResponse: rawResponse,
      error: !response.ok ? `HTTP ${response.status}` : undefined,
    });

    if (!response.ok) {
      return {
        success: false,
        data: [],
        rawResponse,
        total: 0,
        page: params.page || 1,
        pageSize: params.pageSize || 10,
        totalPages: 0,
        error: rawResponse?.message || `HTTP ${response.status}: ${response.statusText}`,
        httpStatus: response.status,
        timestamp,
        responseTime,
      };
    }

    // Map CEISA data to internal PEBDocument format
    const mappedData = rawResponse?.data?.map(mapCEISAToPEBDocument) || [];

    // Handle 200 with empty data - this is NOT an error
    if (mappedData.length === 0) {
      return {
        success: true, // Success because API call succeeded
        data: [],
        rawResponse,
        total: 0,
        page: params.page || 1,
        pageSize: params.pageSize || 10,
        totalPages: 0,
        httpStatus: response.status,
        timestamp,
        responseTime,
        emptyMessage: 'Tidak ada data PEB dari CEISA untuk parameter ini',
      };
    }

    return {
      success: true,
      data: mappedData,
      rawResponse,
      total: rawResponse?.meta?.total || mappedData.length,
      page: rawResponse?.meta?.page || params.page || 1,
      pageSize: rawResponse?.meta?.pageSize || params.pageSize || 10,
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

    logCEISAOperation({
      timestamp,
      operation: 'fetchPEBFromCEISA',
      params,
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
      page: params.page || 1,
      pageSize: params.pageSize || 10,
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
export async function fetchPEBFromCEISAMock(
  params: PEBFetchParams
): Promise<PEBFetchResult> {
  const timestamp = new Date().toISOString();
  const startTime = performance.now();
  
  // Simulate network latency (100-500ms)
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
  
  const responseTime = Math.round(performance.now() - startTime);

  // Generate mock data
  const mockCeisaData: CEISAPEBData[] = [
    {
      nomorAju: params.nomorAju || '000000-000001-20240115-000001',
      nomorPendaftaran: 'PEB-2024-00001',
      tanggalPendaftaran: '2024-01-15',
      nomorNPE: 'NPE-2024-00001',
      tanggalNPE: '2024-01-16',
      statusDokumen: 'NPE_TERBIT',
      eksportir: {
        npwp: params.npwpEksportir || '01.234.567.8-901.000',
        nama: 'PT EKSPORTIR INDONESIA',
        alamat: 'Jl. Industri No. 123, Jakarta',
      },
      pembeli: {
        nama: 'Global Trade Co., Ltd',
        alamat: '123 Trade Street, Singapore',
        negara: 'SG',
      },
      kantorBc: {
        kode: params.kodeKantor || '040300',
        nama: 'KPPBC TMP Tanjung Priok',
      },
      pelabuhanMuat: {
        kode: 'IDTPP',
        nama: 'Tanjung Priok',
      },
      pelabuhanTujuan: {
        kode: 'SGSIN',
        nama: 'Singapore',
      },
      negaraTujuan: 'SG',
      incoterm: 'FOB',
      mataUang: 'USD',
      kurs: 15500,
      modaAngkutan: '1',
      namaKapal: 'EVERGREEN GLORY',
      nomorVoyage: 'EG-2024-001',
      jumlahKemasan: 100,
      satuanKemasan: 'CTN',
      beratBruto: 5000,
      beratNeto: 4500,
      nilaiFob: 25000,
      nilaiFobIdr: 387500000,
      barang: [
        {
          nomorUrut: 1,
          hsCode: '8471.30.10',
          uraianBarang: 'Laptop Computer',
          jumlahBarang: 50,
          satuanBarang: 'UNIT',
          beratNeto: 2250,
          beratBruto: 2500,
          hargaSatuan: 300,
          nilaiFob: 15000,
          asalBarang: 'ID',
        },
        {
          nomorUrut: 2,
          hsCode: '8471.70.10',
          uraianBarang: 'Computer Monitor',
          jumlahBarang: 50,
          satuanBarang: 'UNIT',
          beratNeto: 2250,
          beratBruto: 2500,
          hargaSatuan: 200,
          nilaiFob: 10000,
          asalBarang: 'ID',
        },
      ],
    },
  ];

  // Filter by date if provided
  let filteredData = mockCeisaData;
  if (params.dateFrom || params.dateTo) {
    filteredData = mockCeisaData.filter(item => {
      const regDate = new Date(item.tanggalPendaftaran);
      if (params.dateFrom && regDate < new Date(params.dateFrom)) return false;
      if (params.dateTo && regDate > new Date(params.dateTo)) return false;
      return true;
    });
  }

  const rawResponse: CEISAPEBRawResponse = {
    status: 'success',
    code: 200,
    message: 'Data berhasil diambil',
    data: filteredData,
    meta: {
      total: filteredData.length,
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      totalPages: 1,
    },
  };

  // Log mock operation
  logCEISAOperation({
    timestamp,
    operation: 'fetchPEBFromCEISAMock',
    params,
    httpStatus: 200,
    responseTime,
    success: true,
    rawResponse,
  });

  const mappedData = filteredData.map(mapCEISAToPEBDocument);

  return {
    success: true,
    data: mappedData,
    rawResponse,
    total: filteredData.length,
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
 * Smart PEB fetch that uses mock in development without API key
 * 
 * NOTE: Due to CORS restrictions, direct browser-to-CEISA API calls are blocked.
 * In production, this should go through a backend proxy (Edge Function).
 */
export async function fetchPEBFromCEISASmart(
  params: PEBFetchParams,
  config?: PEBFetchConfig
): Promise<PEBFetchResult> {
  const isDev = import.meta.env.DEV;
  const hasMockFlag = import.meta.env.VITE_CEISA_USE_MOCK === 'true';
  const hasApiKey = !!import.meta.env.VITE_CEISA_API_KEY;
  
  // Always use mock in browser due to CORS restrictions
  const isBrowser = typeof window !== 'undefined';
  
  // Use mock if running in browser (CORS), dev without API key, or mock flag set
  if (isBrowser || (isDev && !hasApiKey) || hasMockFlag) {
    return fetchPEBFromCEISAMock(params);
  }
  
  return fetchPEBFromCEISA(params, config);
}
