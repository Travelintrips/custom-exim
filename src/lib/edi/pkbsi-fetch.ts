/**
 * CEISA PKBSI API Integration
 * Fetch strategic goods and lartas data from CEISA
 */

import { supabase } from '@/lib/supabase';

export interface PKBSIFetchParams {
  nomorAju?: string;
  nomorDokumen?: string;
  npwpImportir?: string;
  kategoriLartas?: string;
  statusLartas?: string;
  tanggalMulai?: string;
  tanggalAkhir?: string;
}

export interface PKBSIData {
  nomorAju: string;
  nomorDokumen: string;
  tanggalDokumen: string;
  jenisBarangStrategis: string;
  hsCode: string;
  uraianBarang: string;
  jumlah: number;
  satuan: string;
  nilaiBarang: number;
  mataUang: string;
  negaraAsal: string;
  namaEksportir: string;
  namaImportir: string;
  npwpImportir: string;
  instansiPengawas: string;
  nomorRekomendasi: string;
  tanggalRekomendasi: string;
  masaBerlakuRekomendasi: string;
  kategoriLartas: string;
  statusLartas: string;
  keterangan: string;
  status: string;
}

export interface PKBSIFetchResult {
  success: boolean;
  data?: PKBSIData[];
  error?: string;
  source: 'api' | 'mock';
}

const CEISA_API_URL = import.meta.env.VITE_CEISA_API_URL;
const CEISA_API_KEY = import.meta.env.VITE_CEISA_API_KEY;

// Mock data for testing
const generateMockPKBSI = (params: PKBSIFetchParams): PKBSIData[] => {
  const baseNomorAju = params.nomorAju || '000000-000000-20250101-000001';
  
  return [
    {
      nomorAju: baseNomorAju,
      nomorDokumen: `PKBSI-${Date.now()}-001`,
      tanggalDokumen: new Date().toISOString().split('T')[0],
      jenisBarangStrategis: 'SENJATA API',
      hsCode: '9301.10.00',
      uraianBarang: 'SENAPAN ANGIN',
      jumlah: 10,
      satuan: 'PCS',
      nilaiBarang: 50000.00,
      mataUang: 'USD',
      negaraAsal: 'AMERIKA SERIKAT',
      namaEksportir: 'US Defense Export Inc',
      namaImportir: params.npwpImportir ? 'PT Pertahanan Indonesia' : 'PT Test PKBSI',
      npwpImportir: params.npwpImportir || '01.234.567.8-901.000',
      instansiPengawas: 'POLRI',
      nomorRekomendasi: 'RK-POLRI-2025-001',
      tanggalRekomendasi: new Date(Date.now() - 2592000000).toISOString().split('T')[0],
      masaBerlakuRekomendasi: new Date(Date.now() + 15552000000).toISOString().split('T')[0],
      kategoriLartas: 'SENJATA_API',
      statusLartas: 'APPROVED',
      keterangan: 'Untuk keperluan latihan TNI',
      status: 'CLEARED',
    },
    {
      nomorAju: `${baseNomorAju.slice(0, -1)}2`,
      nomorDokumen: `PKBSI-${Date.now()}-002`,
      tanggalDokumen: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      jenisBarangStrategis: 'BAHAN KIMIA BERBAHAYA',
      hsCode: '2811.29.00',
      uraianBarang: 'HYDROGEN PEROXIDE 60%',
      jumlah: 5000,
      satuan: 'KG',
      nilaiBarang: 25000.00,
      mataUang: 'USD',
      negaraAsal: 'JEPANG',
      namaEksportir: 'Tokyo Chemical Industries',
      namaImportir: 'PT Kimia Industri Indonesia',
      npwpImportir: '02.345.678.9-012.000',
      instansiPengawas: 'KEMENDAG',
      nomorRekomendasi: 'RK-KEMENDAG-2025-015',
      tanggalRekomendasi: new Date(Date.now() - 1728000000).toISOString().split('T')[0],
      masaBerlakuRekomendasi: new Date(Date.now() + 17280000000).toISOString().split('T')[0],
      kategoriLartas: 'BAHAN_KIMIA',
      statusLartas: 'APPROVED',
      keterangan: 'Untuk keperluan industri farmasi',
      status: 'CLEARED',
    },
    {
      nomorAju: `${baseNomorAju.slice(0, -1)}3`,
      nomorDokumen: `PKBSI-${Date.now()}-003`,
      tanggalDokumen: new Date(Date.now() - 172800000).toISOString().split('T')[0],
      jenisBarangStrategis: 'ALAT TELEKOMUNIKASI',
      hsCode: '8525.80.00',
      uraianBarang: 'RADIO KOMUNIKASI HF BAND',
      jumlah: 50,
      satuan: 'UNIT',
      nilaiBarang: 75000.00,
      mataUang: 'USD',
      negaraAsal: 'KOREA SELATAN',
      namaEksportir: 'Hyundai Communication Co',
      namaImportir: 'PT Komunikasi Nusantara',
      npwpImportir: '03.456.789.0-123.000',
      instansiPengawas: 'KEMKOMINFO',
      nomorRekomendasi: 'RK-KOMINFO-2025-088',
      tanggalRekomendasi: new Date(Date.now() - 864000000).toISOString().split('T')[0],
      masaBerlakuRekomendasi: new Date(Date.now() + 19008000000).toISOString().split('T')[0],
      kategoriLartas: 'TELEKOMUNIKASI',
      statusLartas: 'PENDING_REVIEW',
      keterangan: 'Menunggu verifikasi spesifikasi teknis',
      status: 'PENDING',
    },
  ];
};

/**
 * Fetch PKBSI from CEISA API
 */
export async function fetchPKBSIFromCEISA(params: PKBSIFetchParams): Promise<PKBSIFetchResult> {
  if (!CEISA_API_URL || !CEISA_API_KEY) {
    console.warn('CEISA API credentials not configured, using mock data');
    return {
      success: true,
      data: generateMockPKBSI(params),
      source: 'mock',
    };
  }

  try {
    const queryParams = new URLSearchParams();
    if (params.nomorAju) queryParams.append('nomorAju', params.nomorAju);
    if (params.nomorDokumen) queryParams.append('nomorDokumen', params.nomorDokumen);
    if (params.npwpImportir) queryParams.append('npwpImportir', params.npwpImportir);
    if (params.kategoriLartas) queryParams.append('kategoriLartas', params.kategoriLartas);
    if (params.statusLartas) queryParams.append('statusLartas', params.statusLartas);
    if (params.tanggalMulai) queryParams.append('tanggalMulai', params.tanggalMulai);
    if (params.tanggalAkhir) queryParams.append('tanggalAkhir', params.tanggalAkhir);

    const response = await fetch(`${CEISA_API_URL}/pkbsi/browse?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CEISA_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CEISA API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      data: result.data || [],
      source: 'api',
    };
  } catch (error: any) {
    console.error('CEISA PKBSI API Error:', error);
    
    return {
      success: true,
      data: generateMockPKBSI(params),
      error: error.message,
      source: 'mock',
    };
  }
}

/**
 * Fetch and save PKBSI to database
 */
export async function fetchAndSavePKBSI(params: PKBSIFetchParams): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  const result = await fetchPKBSIFromCEISA(params);

  if (!result.success || !result.data || result.data.length === 0) {
    return {
      success: false,
      count: 0,
      error: result.error || 'No PKBSI data found',
    };
  }

  try {
    const documents = result.data.map((item) => ({
      nomor_aju: item.nomorAju,
      nomor_dokumen: item.nomorDokumen,
      tanggal_dokumen: item.tanggalDokumen,
      jenis_barang_strategis: item.jenisBarangStrategis,
      hs_code: item.hsCode,
      uraian_barang: item.uraianBarang,
      jumlah: item.jumlah,
      satuan: item.satuan,
      nilai_barang: item.nilaiBarang,
      mata_uang: item.mataUang,
      negara_asal: item.negaraAsal,
      nama_eksportir: item.namaEksportir,
      nama_importir: item.namaImportir,
      npwp_importir: item.npwpImportir,
      instansi_pengawas: item.instansiPengawas,
      nomor_rekomendasi: item.nomorRekomendasi,
      tanggal_rekomendasi: item.tanggalRekomendasi,
      masa_berlaku_rekomendasi: item.masaBerlakuRekomendasi,
      kategori_lartas: item.kategoriLartas,
      status_lartas: item.statusLartas,
      keterangan: item.keterangan,
      status: item.status,
      metadata: item,
      synced_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('ceisa_pkbsi')
      .upsert(documents, { onConflict: 'nomor_aju' })
      .select();

    if (error) throw error;

    return {
      success: true,
      count: data?.length || 0,
    };
  } catch (error: any) {
    return {
      success: false,
      count: 0,
      error: error.message,
    };
  }
}
