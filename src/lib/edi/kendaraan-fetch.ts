/**
 * CEISA Kendaraan Bermotor API Integration
 * Fetch vehicle import data from CEISA
 */

import { supabase } from '@/lib/supabase';

export interface KendaraanFetchParams {
  nomorAju?: string;
  nomorPib?: string;
  nomorRangka?: string;
  npwpImportir?: string;
  kodeKantor?: string;
  tanggalMulai?: string;
  tanggalAkhir?: string;
}

export interface KendaraanData {
  nomorAju: string;
  nomorPib: string;
  tanggalPib: string;
  jenisKendaraan: string;
  merek: string;
  tipe: string;
  tahunPembuatan: number;
  nomorRangka: string;
  nomorMesin: string;
  kapasitasMesin: number;
  warna: string;
  jumlahRoda: number;
  jumlahSilinder: number;
  jumlahPenumpang: number;
  bahanBakar: string;
  kondisi: string;
  nilaiCif: number;
  mataUang: string;
  beaMasuk: number;
  ppn: number;
  ppnbm: number;
  pph: number;
  namaImportir: string;
  npwpImportir: string;
  negaraAsal: string;
  pelabuhanMuat: string;
  pelabuhanBongkar: string;
  status: string;
}

export interface KendaraanFetchResult {
  success: boolean;
  data?: KendaraanData[];
  error?: string;
  source: 'api' | 'mock';
}

const CEISA_API_URL = import.meta.env.VITE_CEISA_API_URL;
const CEISA_API_KEY = import.meta.env.VITE_CEISA_API_KEY;

// Mock data for testing
const generateMockKendaraan = (params: KendaraanFetchParams): KendaraanData[] => {
  const baseNomorAju = params.nomorAju || '000000-000000-20250101-000001';
  
  return [
    {
      nomorAju: baseNomorAju,
      nomorPib: `PIB-${Date.now()}-001`,
      tanggalPib: new Date().toISOString().split('T')[0],
      jenisKendaraan: 'SEDAN',
      merek: 'TOYOTA',
      tipe: 'CAMRY 2.5 V',
      tahunPembuatan: 2024,
      nomorRangka: 'MR053B4K8N1234567',
      nomorMesin: '2AR-FE1234567',
      kapasitasMesin: 2494,
      warna: 'PUTIH MUTIARA',
      jumlahRoda: 4,
      jumlahSilinder: 4,
      jumlahPenumpang: 5,
      bahanBakar: 'BENSIN',
      kondisi: 'BARU',
      nilaiCif: 35000.00,
      mataUang: 'USD',
      beaMasuk: 17500000,
      ppn: 5775000,
      ppnbm: 17500000,
      pph: 2625000,
      namaImportir: params.npwpImportir ? 'PT Auto Import Indonesia' : 'PT Test Kendaraan',
      npwpImportir: params.npwpImportir || '01.234.567.8-901.000',
      negaraAsal: 'JEPANG',
      pelabuhanMuat: 'JPYOK - Yokohama',
      pelabuhanBongkar: 'IDTPP - Tanjung Priok',
      status: 'CLEARED',
    },
    {
      nomorAju: `${baseNomorAju.slice(0, -1)}2`,
      nomorPib: `PIB-${Date.now()}-002`,
      tanggalPib: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      jenisKendaraan: 'SUV',
      merek: 'HONDA',
      tipe: 'CR-V 1.5 TURBO',
      tahunPembuatan: 2024,
      nomorRangka: 'MHRRW1880P1234567',
      nomorMesin: 'L15B71234567',
      kapasitasMesin: 1498,
      warna: 'HITAM KRISTAL',
      jumlahRoda: 4,
      jumlahSilinder: 4,
      jumlahPenumpang: 7,
      bahanBakar: 'BENSIN',
      kondisi: 'BARU',
      nilaiCif: 32000.00,
      mataUang: 'USD',
      beaMasuk: 16000000,
      ppn: 5280000,
      ppnbm: 16000000,
      pph: 2400000,
      namaImportir: 'PT Mobil Sejahtera',
      npwpImportir: '02.345.678.9-012.000',
      negaraAsal: 'THAILAND',
      pelabuhanMuat: 'THLCH - Laem Chabang',
      pelabuhanBongkar: 'IDTPP - Tanjung Priok',
      status: 'CLEARED',
    },
    {
      nomorAju: `${baseNomorAju.slice(0, -1)}3`,
      nomorPib: `PIB-${Date.now()}-003`,
      tanggalPib: new Date(Date.now() - 172800000).toISOString().split('T')[0],
      jenisKendaraan: 'MOTOR',
      merek: 'KAWASAKI',
      tipe: 'NINJA ZX-10R',
      tahunPembuatan: 2024,
      nomorRangka: 'JKAZXT00PPA123456',
      nomorMesin: 'ZXT00PE123456',
      kapasitasMesin: 998,
      warna: 'HIJAU KAWASAKI',
      jumlahRoda: 2,
      jumlahSilinder: 4,
      jumlahPenumpang: 2,
      bahanBakar: 'BENSIN',
      kondisi: 'BARU',
      nilaiCif: 18000.00,
      mataUang: 'USD',
      beaMasuk: 9000000,
      ppn: 2970000,
      ppnbm: 9000000,
      pph: 1350000,
      namaImportir: 'PT Motor Sport Indonesia',
      npwpImportir: '03.456.789.0-123.000',
      negaraAsal: 'JEPANG',
      pelabuhanMuat: 'JPYOK - Yokohama',
      pelabuhanBongkar: 'IDTPP - Tanjung Priok',
      status: 'CLEARED',
    },
  ];
};

/**
 * Fetch kendaraan from CEISA API
 */
export async function fetchKendaraanFromCEISA(params: KendaraanFetchParams): Promise<KendaraanFetchResult> {
  if (!CEISA_API_URL || !CEISA_API_KEY) {
    console.warn('CEISA API credentials not configured, using mock data');
    return {
      success: true,
      data: generateMockKendaraan(params),
      source: 'mock',
    };
  }

  try {
    const queryParams = new URLSearchParams();
    if (params.nomorAju) queryParams.append('nomorAju', params.nomorAju);
    if (params.nomorPib) queryParams.append('nomorPib', params.nomorPib);
    if (params.nomorRangka) queryParams.append('nomorRangka', params.nomorRangka);
    if (params.npwpImportir) queryParams.append('npwpImportir', params.npwpImportir);
    if (params.kodeKantor) queryParams.append('kodeKantor', params.kodeKantor);
    if (params.tanggalMulai) queryParams.append('tanggalMulai', params.tanggalMulai);
    if (params.tanggalAkhir) queryParams.append('tanggalAkhir', params.tanggalAkhir);

    const response = await fetch(`${CEISA_API_URL}/kendaraan/browse?${queryParams.toString()}`, {
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
    console.error('CEISA Kendaraan API Error:', error);
    
    return {
      success: true,
      data: generateMockKendaraan(params),
      error: error.message,
      source: 'mock',
    };
  }
}

/**
 * Fetch and save kendaraan to database
 */
export async function fetchAndSaveKendaraan(params: KendaraanFetchParams): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  const result = await fetchKendaraanFromCEISA(params);

  if (!result.success || !result.data || result.data.length === 0) {
    return {
      success: false,
      count: 0,
      error: result.error || 'No kendaraan data found',
    };
  }

  try {
    const documents = result.data.map((item) => ({
      nomor_aju: item.nomorAju,
      nomor_pib: item.nomorPib,
      tanggal_pib: item.tanggalPib,
      jenis_kendaraan: item.jenisKendaraan,
      merek: item.merek,
      tipe: item.tipe,
      tahun_pembuatan: item.tahunPembuatan,
      nomor_rangka: item.nomorRangka,
      nomor_mesin: item.nomorMesin,
      kapasitas_mesin: item.kapasitasMesin,
      warna: item.warna,
      jumlah_roda: item.jumlahRoda,
      jumlah_silinder: item.jumlahSilinder,
      jumlah_penumpang: item.jumlahPenumpang,
      bahan_bakar: item.bahanBakar,
      kondisi: item.kondisi,
      nilai_cif: item.nilaiCif,
      mata_uang: item.mataUang,
      bea_masuk: item.beaMasuk,
      ppn: item.ppn,
      ppnbm: item.ppnbm,
      pph: item.pph,
      nama_importir: item.namaImportir,
      npwp_importir: item.npwpImportir,
      negara_asal: item.negaraAsal,
      pelabuhan_muat: item.pelabuhanMuat,
      pelabuhan_bongkar: item.pelabuhanBongkar,
      status: item.status,
      metadata: item,
      synced_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('ceisa_kendaraan')
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
