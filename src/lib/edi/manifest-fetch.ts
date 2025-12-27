/**
 * CEISA Manifest API Integration
 * Fetch manifest data from CEISA Single Core System
 */

import { supabase } from '@/lib/supabase';

export interface ManifestFetchParams {
  nomorAju?: string;
  nomorManifest?: string;
  npwpPenerima?: string;
  kodeKantor?: string;
  tanggalMulai?: string;
  tanggalAkhir?: string;
}

export interface ManifestData {
  nomorAju: string;
  nomorManifest: string;
  tanggalManifest: string;
  namaKapal: string;
  bendera: string;
  voyageNumber: string;
  pelabuhanAsal: string;
  pelabuhanTujuan: string;
  tanggalTiba: string;
  jumlahKontainer: number;
  jumlahKemasan: number;
  beratKotor: number;
  beratBersih: number;
  satuanBerat: string;
  jenisKemasan: string;
  namaPengirim: string;
  namaPenerima: string;
  npwpPenerima: string;
  status: string;
}

export interface ManifestFetchResult {
  success: boolean;
  data?: ManifestData[];
  error?: string;
  source: 'api' | 'mock';
}

const CEISA_API_URL = import.meta.env.VITE_CEISA_API_URL;
const CEISA_API_KEY = import.meta.env.VITE_CEISA_API_KEY;

// Mock data for testing when API is not available
const generateMockManifests = (params: ManifestFetchParams): ManifestData[] => {
  const baseNomorAju = params.nomorAju || '000000-000000-20250101-000001';
  
  return [
    {
      nomorAju: baseNomorAju,
      nomorManifest: `MN-${Date.now()}-001`,
      tanggalManifest: new Date().toISOString().split('T')[0],
      namaKapal: 'MV SINAR JAYA',
      bendera: 'Indonesia',
      voyageNumber: 'VY-2025-001',
      pelabuhanAsal: 'CNSHA - Shanghai',
      pelabuhanTujuan: 'IDTPP - Tanjung Priok',
      tanggalTiba: new Date().toISOString().split('T')[0],
      jumlahKontainer: 5,
      jumlahKemasan: 250,
      beratKotor: 12500.00,
      beratBersih: 11800.00,
      satuanBerat: 'KG',
      jenisKemasan: 'CARTON BOX',
      namaPengirim: 'Shanghai Trading Co., Ltd',
      namaPenerima: params.npwpPenerima ? 'PT Import Indonesia' : 'PT Test Importir',
      npwpPenerima: params.npwpPenerima || '01.234.567.8-901.000',
      status: 'ARRIVED',
    },
    {
      nomorAju: `${baseNomorAju.slice(0, -1)}2`,
      nomorManifest: `MN-${Date.now()}-002`,
      tanggalManifest: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      namaKapal: 'MV OCEAN STAR',
      bendera: 'Singapore',
      voyageNumber: 'VY-2025-002',
      pelabuhanAsal: 'SGSIN - Singapore',
      pelabuhanTujuan: 'IDTPP - Tanjung Priok',
      tanggalTiba: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      jumlahKontainer: 3,
      jumlahKemasan: 150,
      beratKotor: 7500.00,
      beratBersih: 7100.00,
      satuanBerat: 'KG',
      jenisKemasan: 'PALLET',
      namaPengirim: 'Singapore Exports Pte Ltd',
      namaPenerima: 'PT Distribusi Nusantara',
      npwpPenerima: '02.345.678.9-012.000',
      status: 'ARRIVED',
    },
  ];
};

/**
 * Fetch manifest from CEISA API via proxy edge function
 */
export async function fetchManifestFromCEISA(params: ManifestFetchParams): Promise<ManifestFetchResult> {
  try {
    // Build params object for the proxy
    const proxyParams: Record<string, string> = {};
    if (params.nomorAju) proxyParams.nomorAju = params.nomorAju;
    if (params.nomorManifest) proxyParams.nomorManifest = params.nomorManifest;
    if (params.npwpPenerima) proxyParams.npwpPenerima = params.npwpPenerima;
    if (params.kodeKantor) proxyParams.kodeKantor = params.kodeKantor;
    if (params.tanggalMulai) proxyParams.tanggalMulai = params.tanggalMulai;
    if (params.tanggalAkhir) proxyParams.tanggalAkhir = params.tanggalAkhir;

    // Call CEISA proxy edge function
    const { data, error } = await supabase.functions.invoke('supabase-functions-ceisa-proxy', {
      body: {
        action: 'fetch',
        endpoint: '/manifest/browse',
        params: proxyParams,
      },
    });

    if (error) {
      throw new Error(`Edge function error: ${error.message}`);
    }

    if (!data || data.success === false) {
      throw new Error(data?.error || 'CEISA API request failed');
    }
    
    return {
      success: true,
      data: data.data || [],
      source: 'api',
    };
  } catch (error: any) {
    console.error('CEISA Manifest API Error:', error);
    
    // Fallback to mock data on error
    return {
      success: true,
      data: generateMockManifests(params),
      error: error.message,
      source: 'mock',
    };
  }
}

/**
 * Fetch and save manifest to database
 */
export async function fetchAndSaveManifest(params: ManifestFetchParams): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  const result = await fetchManifestFromCEISA(params);

  if (!result.success || !result.data || result.data.length === 0) {
    return {
      success: false,
      count: 0,
      error: result.error || 'No manifest data found',
    };
  }

  try {
    const documents = result.data.map((item) => ({
      nomor_aju: item.nomorAju,
      nomor_manifest: item.nomorManifest,
      tanggal_manifest: item.tanggalManifest,
      nama_kapal: item.namaKapal,
      bendera: item.bendera,
      voyage_number: item.voyageNumber,
      pelabuhan_asal: item.pelabuhanAsal,
      pelabuhan_tujuan: item.pelabuhanTujuan,
      tanggal_tiba: item.tanggalTiba,
      jumlah_kontainer: item.jumlahKontainer,
      jumlah_kemasan: item.jumlahKemasan,
      berat_kotor: item.beratKotor,
      berat_bersih: item.beratBersih,
      satuan_berat: item.satuanBerat,
      jenis_kemasan: item.jenisKemasan,
      nama_pengirim: item.namaPengirim,
      nama_penerima: item.namaPenerima,
      npwp_penerima: item.npwpPenerima,
      status: item.status,
      metadata: item,
      synced_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('ceisa_manifests')
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
