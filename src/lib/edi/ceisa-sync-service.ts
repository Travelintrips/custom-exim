/**
 * CEISA Sync Service
 * Synchronizes data from CEISA API to Supabase tables
 * Uses Edge Function proxy to bypass CORS restrictions
 */

import { supabase } from "@/lib/supabase";
{
  /*
const CEISA_API_URL = import.meta.env.VITE_CEISA_API_URL;
const CEISA_API_KEY = import.meta.env.VITE_CEISA_API_KEY;
*/
}
const USE_EDGE_PROXY = true; // Always use edge function for browser CORS

// ========== CONNECTION TEST ==========
//kode awal
{
  /*
export async function testCeisaConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    // Try to call a lightweight endpoint
    const result = await callCeisaApi<any>('/health');
    
    if (result.success) {
      return {
        success: true,
        message: 'Koneksi ke API CEISA berhasil',
        details: result.data,
      };
    } else {
      return {
        success: false,
        message: result.error || 'Gagal terhubung ke API CEISA',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Error: ${error.message}`,
    };
  }
}
*/
}

// tes kode
export async function testCeisaConnection() {
  const { data, error } = await supabase.functions.invoke(
    "supabase-functions-ceisa-proxy",
    {
      body: { endpoint: "/health" },
    },
  );

  if (error || !data?.success) {
    return {
      success: false,
      message: "CEISA Terputus",
    };
  }

  return {
    success: true,
    message: "CEISA Connected",
  };
}

// ========== TYPES ==========

export interface SyncResult {
  success: boolean;
  table: string;
  inserted: number;
  updated: number;
  errors: string[];
  synced_at: string;
  source: "CEISA" | "MOCK";
}

export interface SyncAllResult {
  success: boolean;
  results: SyncResult[];
  total_inserted: number;
  total_updated: number;
  duration_ms: number;
}

interface CeisaApiResponse<T> {
  success: boolean;
  data: T[];
  error?: string;
}

// ========== API HELPERS ==========

async function callCeisaApi<T>(
  endpoint: string,
  params?: Record<string, string>,
): Promise<CeisaApiResponse<T>> {
  // Use Edge Function proxy to bypass CORS
  if (USE_EDGE_PROXY) {
    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-ceisa-proxy",
        {
          body: { endpoint, params },
        },
      );

      if (error) {
        console.error(`CEISA Proxy Error (${endpoint}):`, error);
        return { success: false, data: [], error: error.message };
      }

      if (!data.success) {
        return {
          success: false,
          data: [],
          error: data.error || "Unknown error",
        };
      }

      return { success: true, data: Array.isArray(data.data) ? data.data : [] };
    } catch (error: any) {
      console.error(`CEISA API Error (${endpoint}):`, error);
      return { success: false, data: [], error: error.message };
    }
  }

  // Direct API call (for non-browser environments)
  if (!CEISA_API_URL || !CEISA_API_KEY) {
    console.warn(`CEISA API not configured for endpoint: ${endpoint}`);
    return { success: false, data: [], error: "API not configured" };
  }

  try {
    const queryParams = new URLSearchParams(params);
    const url = `${CEISA_API_URL}${endpoint}?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CEISA_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `CEISA API error: ${response.status} ${response.statusText}`,
      );
    }

    const result = await response.json();
    return { success: true, data: result.data || [] };
  } catch (error: any) {
    console.error(`CEISA API Error (${endpoint}):`, error);
    return { success: false, data: [], error: error.message };
  }
}

// ========== TRANSFORM FUNCTIONS ==========

function transformPibDocument(raw: any): any {
  return {
    nomor_aju: raw.nomorAju || raw.nomor_aju,
    registration_number: raw.nomorPendaftaran || raw.nomor_pendaftaran || null,
    registration_date:
      raw.tanggalPendaftaran || raw.tanggal_pendaftaran || null,
    importer_npwp: raw.importirNpwp || raw.npwp_importir || null,
    importer_name: raw.importirNama || raw.nama_importir || null,
    importer_address: raw.importirAlamat || raw.alamat_importir || null,
    total_cif_value: parseFloat(
      raw.totalNilaiPabean || raw.total_nilai_pabean || 0,
    ),
    total_bm: parseFloat(raw.totalBeaMasuk || raw.total_bea_masuk || 0),
    total_ppn: parseFloat(raw.totalPpn || raw.total_ppn || 0),
    total_pph: parseFloat(raw.totalPph || raw.total_pph || 0),
    metadata: raw,
    synced_at: new Date().toISOString(),
    source: "CEISA",
  };
}

function transformPebDocument(raw: any): any {
  return {
    nomor_aju: raw.nomorAju || raw.nomor_aju,
    registration_number: raw.nomorPendaftaran || raw.nomor_pendaftaran || null,
    registration_date:
      raw.tanggalPendaftaran || raw.tanggal_pendaftaran || null,
    exporter_npwp: raw.eksportirNpwp || raw.npwp_eksportir || null,
    exporter_name: raw.eksportirNama || raw.nama_eksportir || null,
    exporter_address: raw.eksportirAlamat || raw.alamat_eksportir || null,
    total_fob_value: parseFloat(raw.totalNilaiFob || raw.total_nilai_fob || 0),
    destination_country: raw.negaraTujuan || raw.negara_tujuan || null,
    loading_port_name: raw.pelabuhanMuat || raw.pelabuhan_muat || null,
    metadata: raw,
    synced_at: new Date().toISOString(),
    source: "CEISA",
  };
}

function transformManifest(raw: any): any {
  return {
    nomor_aju: raw.nomorAju || raw.nomor_aju,
    nomor_manifest: raw.nomorManifest || raw.nomor_manifest,
    tanggal_manifest: raw.tanggalManifest || raw.tanggal_manifest,
    nama_kapal: raw.namaKapal || raw.nama_kapal,
    bendera: raw.bendera,
    voyage_number: raw.voyageNumber || raw.voyage_number,
    pelabuhan_asal: raw.pelabuhanAsal || raw.pelabuhan_asal,
    pelabuhan_tujuan: raw.pelabuhanTujuan || raw.pelabuhan_tujuan,
    tanggal_tiba: raw.tanggalTiba || raw.tanggal_tiba,
    jumlah_kontainer: raw.jumlahKontainer || raw.jumlah_kontainer || 0,
    jumlah_kemasan: raw.jumlahKemasan || raw.jumlah_kemasan || 0,
    berat_kotor: raw.beratKotor || raw.berat_kotor || 0,
    berat_bersih: raw.beratBersih || raw.berat_bersih || 0,
    satuan_berat: raw.satuanBerat || raw.satuan_berat || "KG",
    jenis_kemasan: raw.jenisKemasan || raw.jenis_kemasan,
    nama_pengirim: raw.namaPengirim || raw.nama_pengirim,
    nama_penerima: raw.namaPenerima || raw.nama_penerima,
    npwp_penerima: raw.npwpPenerima || raw.npwp_penerima,
    status: raw.status || "ARRIVED",
    metadata: raw,
    synced_at: new Date().toISOString(),
    source: "CEISA",
  };
}

function transformPkbsi(raw: any): any {
  return {
    nomor_aju: raw.nomorAju || raw.nomor_aju,
    nomor_dokumen: raw.nomorDokumen || raw.nomor_dokumen,
    tanggal_dokumen: raw.tanggalDokumen || raw.tanggal_dokumen,
    jenis_barang_strategis:
      raw.jenisBarangStrategis || raw.jenis_barang_strategis,
    hs_code: raw.hsCode || raw.hs_code,
    uraian_barang: raw.uraianBarang || raw.uraian_barang,
    jumlah: raw.jumlah || 0,
    satuan: raw.satuan,
    nilai_barang: raw.nilaiBarang || raw.nilai_barang || 0,
    mata_uang: raw.mataUang || raw.mata_uang || "USD",
    negara_asal: raw.negaraAsal || raw.negara_asal,
    nama_eksportir: raw.namaEksportir || raw.nama_eksportir,
    nama_importir: raw.namaImportir || raw.nama_importir,
    npwp_importir: raw.npwpImportir || raw.npwp_importir,
    instansi_pengawas: raw.instansiPengawas || raw.instansi_pengawas,
    nomor_rekomendasi: raw.nomorRekomendasi || raw.nomor_rekomendasi,
    tanggal_rekomendasi: raw.tanggalRekomendasi || raw.tanggal_rekomendasi,
    masa_berlaku_rekomendasi:
      raw.masaBerlakuRekomendasi || raw.masa_berlaku_rekomendasi,
    kategori_lartas: raw.kategoriLartas || raw.kategori_lartas,
    status_lartas: raw.statusLartas || raw.status_lartas,
    keterangan: raw.keterangan,
    status: raw.status || "PENDING",
    metadata: raw,
    synced_at: new Date().toISOString(),
    source: "CEISA",
  };
}

function transformKendaraan(raw: any): any {
  return {
    nomor_aju: raw.nomorAju || raw.nomor_aju,
    nomor_pib: raw.nomorPib || raw.nomor_pib,
    tanggal_pib: raw.tanggalPib || raw.tanggal_pib,
    jenis_kendaraan: raw.jenisKendaraan || raw.jenis_kendaraan,
    merek: raw.merek,
    tipe: raw.tipe,
    tahun_pembuatan: raw.tahunPembuatan || raw.tahun_pembuatan,
    nomor_rangka: raw.nomorRangka || raw.nomor_rangka,
    nomor_mesin: raw.nomorMesin || raw.nomor_mesin,
    kapasitas_mesin: raw.kapasitasMesin || raw.kapasitas_mesin,
    warna: raw.warna,
    jumlah_roda: raw.jumlahRoda || raw.jumlah_roda,
    jumlah_silinder: raw.jumlahSilinder || raw.jumlah_silinder,
    jumlah_penumpang: raw.jumlahPenumpang || raw.jumlah_penumpang,
    bahan_bakar: raw.bahanBakar || raw.bahan_bakar,
    kondisi: raw.kondisi,
    nilai_cif: raw.nilaiCif || raw.nilai_cif || 0,
    mata_uang: raw.mataUang || raw.mata_uang || "USD",
    bea_masuk: raw.beaMasuk || raw.bea_masuk || 0,
    ppn: raw.ppn || 0,
    ppnbm: raw.ppnbm || 0,
    pph: raw.pph || 0,
    nama_importir: raw.namaImportir || raw.nama_importir,
    npwp_importir: raw.npwpImportir || raw.npwp_importir,
    negara_asal: raw.negaraAsal || raw.negara_asal,
    pelabuhan_muat: raw.pelabuhanMuat || raw.pelabuhan_muat,
    pelabuhan_bongkar: raw.pelabuhanBongkar || raw.pelabuhan_bongkar,
    status: raw.status || "PENDING",
    metadata: raw,
    synced_at: new Date().toISOString(),
    source: "CEISA",
  };
}

function transformMonitoring(raw: any): any {
  return {
    nomor_aju: raw.nomorAju || raw.nomor_aju,
    jenis_dokumen: raw.jenisDokumen || raw.jenis_dokumen,
    tanggal_pengajuan: raw.tanggalPengajuan || raw.tanggal_pengajuan,
    tanggal_kirim_ceisa: raw.tanggalKirimCeisa || raw.tanggal_kirim_ceisa,
    tanggal_respon_ceisa: raw.tanggalResponCeisa || raw.tanggal_respon_ceisa,
    waktu_respon_detik: raw.waktuResponDetik || raw.waktu_respon_detik,
    status_terakhir: raw.statusTerakhir || raw.status_terakhir,
    status_detail: raw.statusDetail || raw.status_detail,
    kode_respon: raw.kodeRespon || raw.kode_respon,
    pesan_respon: raw.pesanRespon || raw.pesan_respon,
    keterangan_penolakan: raw.keteranganPenolakan || raw.keterangan_penolakan,
    alasan_penolakan: raw.alasanPenolakan || raw.alasan_penolakan,
    saran_perbaikan: raw.saranPerbaikan || raw.saran_perbaikan,
    nomor_response: raw.nomorResponse || raw.nomor_response,
    nama_petugas: raw.namaPetugas || raw.nama_petugas,
    kantor_pabean: raw.kantorPabean || raw.kantor_pabean,
    jumlah_retry: raw.jumlahRetry || raw.jumlah_retry || 0,
    retry_terakhir: raw.retryTerakhir || raw.retry_terakhir,
    metadata: raw,
    updated_at: new Date().toISOString(),
  };
}

// ========== UPSERT FUNCTIONS ==========

async function upsertToTable(
  tableName: string,
  data: any[],
  conflictColumn: string = "nomor_aju",
): Promise<{ inserted: number; updated: number; errors: string[] }> {
  const errors: string[] = [];
  let inserted = 0;
  let updated = 0;

  if (data.length === 0) {
    return { inserted, updated, errors };
  }

  try {
    // Check existing records using the correct conflict column
    const keyList = data.map((d) => d[conflictColumn]).filter(Boolean);

    let existingSet = new Set<string>();

    if (keyList.length > 0) {
      const { data: existing } = await supabase
        .from(tableName)
        .select(conflictColumn)
        .in(conflictColumn, keyList);

      existingSet = new Set(
        (existing || []).map((e: any) => e[conflictColumn]),
      );
    }

    // Perform upsert
    const { data: result, error } = await supabase
      .from(tableName)
      .upsert(data, { onConflict: conflictColumn })
      .select();

    if (error) {
      errors.push(`${tableName}: ${error.message}`);
    } else {
      data.forEach((d) => {
        if (existingSet.has(d[conflictColumn])) {
          updated++;
        } else {
          inserted++;
        }
      });
    }
  } catch (error: any) {
    errors.push(`${tableName}: ${error.message}`);
  }

  return { inserted, updated, errors };
}

// ========== MOCK DATA GENERATORS ==========

function generateMockPibData(): any[] {
  return [
    {
      nomorAju: `PIB-${Date.now()}-001`,
      tanggalAju: new Date().toISOString().split("T")[0],
      nomorPendaftaran: `000001-000001-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-000001`,
      tanggalPendaftaran: new Date().toISOString().split("T")[0],
      importirNpwp: "01.234.567.8-901.000",
      importirNama: "PT Import Sejahtera",
      importirAlamat: "Jl. Industri No. 123, Jakarta",
      totalNilaiPabean: 150000000,
      totalBeaMasuk: 15000000,
      totalPpn: 16500000,
      totalPph: 3750000,
      status: "APPROVED",
    },
    {
      nomorAju: `PIB-${Date.now()}-002`,
      tanggalAju: new Date(Date.now() - 86400000).toISOString().split("T")[0],
      nomorPendaftaran: `000001-000001-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-000002`,
      tanggalPendaftaran: new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0],
      importirNpwp: "02.345.678.9-012.000",
      importirNama: "PT Jaya Makmur",
      importirAlamat: "Jl. Pelabuhan No. 45, Surabaya",
      totalNilaiPabean: 280000000,
      totalBeaMasuk: 28000000,
      totalPpn: 30800000,
      totalPph: 7000000,
      status: "SUBMITTED",
    },
  ];
}

function generateMockPebData(): any[] {
  return [
    {
      nomorAju: `PEB-${Date.now()}-001`,
      tanggalAju: new Date().toISOString().split("T")[0],
      nomorPendaftaran: `000002-000001-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-000001`,
      tanggalPendaftaran: new Date().toISOString().split("T")[0],
      eksportirNpwp: "01.234.567.8-901.000",
      eksportirNama: "PT Ekspor Nusantara",
      eksportirAlamat: "Jl. Ekspor No. 88, Jakarta",
      totalNilaiFob: 500000,
      negaraTujuan: "AMERIKA SERIKAT",
      pelabuhanMuat: "IDTPP - Tanjung Priok",
      status: "APPROVED",
    },
  ];
}

function generateMockManifestData(): any[] {
  return [
    {
      nomorAju: `MN-${Date.now()}-001`,
      nomorManifest: `MF-2025-${Date.now()}`,
      tanggalManifest: new Date().toISOString().split("T")[0],
      namaKapal: "MV SINAR JAYA",
      bendera: "Indonesia",
      voyageNumber: "VY-2025-001",
      pelabuhanAsal: "CNSHA - Shanghai",
      pelabuhanTujuan: "IDTPP - Tanjung Priok",
      tanggalTiba: new Date().toISOString().split("T")[0],
      jumlahKontainer: 5,
      jumlahKemasan: 250,
      beratKotor: 12500.0,
      beratBersih: 11800.0,
      satuanBerat: "KG",
      jenisKemasan: "CARTON BOX",
      namaPengirim: "Shanghai Trading Co., Ltd",
      namaPenerima: "PT Import Indonesia",
      npwpPenerima: "01.234.567.8-901.000",
      status: "ARRIVED",
    },
  ];
}

function generateMockPkbsiData(): any[] {
  return [
    {
      nomorAju: `PKBSI-${Date.now()}-001`,
      nomorDokumen: `PKBSI-DOC-2025-001`,
      tanggalDokumen: new Date().toISOString().split("T")[0],
      jenisBarangStrategis: "BAHAN KIMIA BERBAHAYA",
      hsCode: "2811.29.00",
      uraianBarang: "HYDROGEN PEROXIDE 60%",
      jumlah: 5000,
      satuan: "KG",
      nilaiBarang: 25000.0,
      mataUang: "USD",
      negaraAsal: "JEPANG",
      namaEksportir: "Tokyo Chemical Industries",
      namaImportir: "PT Kimia Industri Indonesia",
      npwpImportir: "02.345.678.9-012.000",
      instansiPengawas: "KEMENDAG",
      nomorRekomendasi: "RK-KEMENDAG-2025-015",
      tanggalRekomendasi: new Date(Date.now() - 1728000000)
        .toISOString()
        .split("T")[0],
      masaBerlakuRekomendasi: new Date(Date.now() + 17280000000)
        .toISOString()
        .split("T")[0],
      kategoriLartas: "BAHAN_KIMIA",
      statusLartas: "APPROVED",
      keterangan: "Untuk keperluan industri farmasi",
      status: "CLEARED",
    },
  ];
}

function generateMockKendaraanData(): any[] {
  return [
    {
      nomorAju: `KND-${Date.now()}-001`,
      nomorPib: `PIB-KND-${Date.now()}`,
      tanggalPib: new Date().toISOString().split("T")[0],
      jenisKendaraan: "SEDAN",
      merek: "TOYOTA",
      tipe: "CAMRY 2.5 V",
      tahunPembuatan: 2024,
      nomorRangka: "MR053B4K8N1234567",
      nomorMesin: "2AR-FE1234567",
      kapasitasMesin: 2494,
      warna: "PUTIH MUTIARA",
      jumlahRoda: 4,
      jumlahSilinder: 4,
      jumlahPenumpang: 5,
      bahanBakar: "BENSIN",
      kondisi: "BARU",
      nilaiCif: 35000.0,
      mataUang: "USD",
      beaMasuk: 17500000,
      ppn: 5775000,
      ppnbm: 17500000,
      pph: 2625000,
      namaImportir: "PT Auto Import Indonesia",
      npwpImportir: "01.234.567.8-901.000",
      negaraAsal: "JEPANG",
      pelabuhanMuat: "JPYOK - Yokohama",
      pelabuhanBongkar: "IDTPP - Tanjung Priok",
      status: "CLEARED",
    },
  ];
}

function generateMockMonitoringData(): any[] {
  return [
    {
      nomorAju: `PIB-${Date.now()}-001`,
      jenisDokumen: "PIB",
      tanggalPengajuan: new Date(Date.now() - 172800000).toISOString(),
      tanggalKirimCeisa: new Date(Date.now() - 172700000).toISOString(),
      tanggalResponCeisa: new Date(Date.now() - 172500000).toISOString(),
      waktuResponDetik: 200,
      statusTerakhir: "APPROVED",
      statusDetail: "Dokumen telah disetujui",
      kodeRespon: "200",
      pesanRespon: "OK - Document approved",
      keteranganPenolakan: null,
      alasanPenolakan: null,
      saranPerbaikan: null,
      nomorResponse: "RSP-2025-001",
      namaPetugas: "Budi Santoso",
      kantorPabean: "KPU BC Tipe A Tanjung Priok",
      jumlahRetry: 0,
      retryTerakhir: null,
    },
    {
      nomorAju: `PIB-${Date.now()}-002`,
      jenisDokumen: "PIB",
      tanggalPengajuan: new Date(Date.now() - 86400000).toISOString(),
      tanggalKirimCeisa: new Date(Date.now() - 86300000).toISOString(),
      tanggalResponCeisa: new Date(Date.now() - 86000000).toISOString(),
      waktuResponDetik: 300,
      statusTerakhir: "REJECTED",
      statusDetail: "Dokumen ditolak karena data tidak lengkap",
      kodeRespon: "400",
      pesanRespon: "Error - Incomplete data",
      keteranganPenolakan: "Data importir tidak lengkap",
      alasanPenolakan: "NPWP tidak valid",
      saranPerbaikan:
        "Periksa kembali NPWP importir dan pastikan sesuai format",
      nomorResponse: "RSP-2025-002",
      namaPetugas: "Siti Rahayu",
      kantorPabean: "KPU BC Tipe A Tanjung Priok",
      jumlahRetry: 2,
      retryTerakhir: new Date(Date.now() - 43200000).toISOString(),
    },
    {
      nomorAju: `PIB-${Date.now()}-003`,
      jenisDokumen: "PIB",
      tanggalPengajuan: new Date().toISOString(),
      tanggalKirimCeisa: new Date().toISOString(),
      tanggalResponCeisa: null,
      waktuResponDetik: null,
      statusTerakhir: "PENDING",
      statusDetail: "Menunggu respon dari CEISA",
      kodeRespon: null,
      pesanRespon: null,
      keteranganPenolakan: null,
      alasanPenolakan: null,
      saranPerbaikan: null,
      nomorResponse: null,
      namaPetugas: null,
      kantorPabean: "KPU BC Tipe A Tanjung Priok",
      jumlahRetry: 0,
      retryTerakhir: null,
    },
  ];
}

// ========== SYNC INDIVIDUAL TABLES ==========

export async function syncPibDocuments(): Promise<SyncResult> {
  const syncedAt = new Date().toISOString();
  const errors: string[] = [];
  let source: "CEISA" | "MOCK" = "CEISA";
  let rawData: any[] = [];

  // Try to fetch from CEISA API
  const apiResult = await callCeisaApi<any>("/pib/browse");

  if (apiResult.success && apiResult.data.length > 0) {
    rawData = apiResult.data;
  } else {
    // Use mock data
    source = "MOCK";
    rawData = generateMockPibData();
    if (apiResult.error) errors.push(`API: ${apiResult.error}`);
  }

  // Transform data
  const transformedData = rawData.map(transformPibDocument);

  // Upsert to database
  const upsertResult = await upsertToTable("pib_documents", transformedData);

  return {
    success: errors.length === 0 && upsertResult.errors.length === 0,
    table: "pib_documents",
    inserted: upsertResult.inserted,
    updated: upsertResult.updated,
    errors: [...errors, ...upsertResult.errors],
    synced_at: syncedAt,
    source,
  };
}

export async function syncPebDocuments(): Promise<SyncResult> {
  const syncedAt = new Date().toISOString();
  const errors: string[] = [];
  let source: "CEISA" | "MOCK" = "CEISA";
  let rawData: any[] = [];

  const apiResult = await callCeisaApi<any>("/peb/browse");

  if (apiResult.success && apiResult.data.length > 0) {
    rawData = apiResult.data;
  } else {
    source = "MOCK";
    rawData = generateMockPebData();
    if (apiResult.error) errors.push(`API: ${apiResult.error}`);
  }

  const transformedData = rawData.map(transformPebDocument);
  const upsertResult = await upsertToTable("peb_documents", transformedData);

  return {
    success: errors.length === 0 && upsertResult.errors.length === 0,
    table: "peb_documents",
    inserted: upsertResult.inserted,
    updated: upsertResult.updated,
    errors: [...errors, ...upsertResult.errors],
    synced_at: syncedAt,
    source,
  };
}

export async function syncManifests(): Promise<SyncResult> {
  const syncedAt = new Date().toISOString();
  const errors: string[] = [];
  let source: "CEISA" | "MOCK" = "CEISA";
  let rawData: any[] = [];

  const apiResult = await callCeisaApi<any>("/manifest/browse");

  if (apiResult.success && apiResult.data.length > 0) {
    rawData = apiResult.data;
  } else {
    source = "MOCK";
    rawData = generateMockManifestData();
    if (apiResult.error) errors.push(`API: ${apiResult.error}`);
  }

  const transformedData = rawData.map(transformManifest);
  const upsertResult = await upsertToTable("ceisa_manifests", transformedData);

  return {
    success: errors.length === 0 && upsertResult.errors.length === 0,
    table: "ceisa_manifests",
    inserted: upsertResult.inserted,
    updated: upsertResult.updated,
    errors: [...errors, ...upsertResult.errors],
    synced_at: syncedAt,
    source,
  };
}

export async function syncPkbsi(): Promise<SyncResult> {
  const syncedAt = new Date().toISOString();
  const errors: string[] = [];
  let source: "CEISA" | "MOCK" = "CEISA";
  let rawData: any[] = [];

  const apiResult = await callCeisaApi<any>("/pkbsi/browse");

  if (apiResult.success && apiResult.data.length > 0) {
    rawData = apiResult.data;
  } else {
    source = "MOCK";
    rawData = generateMockPkbsiData();
    if (apiResult.error) errors.push(`API: ${apiResult.error}`);
  }

  const transformedData = rawData.map(transformPkbsi);
  const upsertResult = await upsertToTable("ceisa_pkbsi", transformedData);

  return {
    success: errors.length === 0 && upsertResult.errors.length === 0,
    table: "ceisa_pkbsi",
    inserted: upsertResult.inserted,
    updated: upsertResult.updated,
    errors: [...errors, ...upsertResult.errors],
    synced_at: syncedAt,
    source,
  };
}

export async function syncKendaraan(): Promise<SyncResult> {
  const syncedAt = new Date().toISOString();
  const errors: string[] = [];
  let source: "CEISA" | "MOCK" = "CEISA";
  let rawData: any[] = [];

  const apiResult = await callCeisaApi<any>("/kendaraan/browse");

  if (apiResult.success && apiResult.data.length > 0) {
    rawData = apiResult.data;
  } else {
    source = "MOCK";
    rawData = generateMockKendaraanData();
    if (apiResult.error) errors.push(`API: ${apiResult.error}`);
  }

  const transformedData = rawData.map(transformKendaraan);
  const upsertResult = await upsertToTable("ceisa_vehicles", transformedData);

  return {
    success: errors.length === 0 && upsertResult.errors.length === 0,
    table: "ceisa_vehicles",
    inserted: upsertResult.inserted,
    updated: upsertResult.updated,
    errors: [...errors, ...upsertResult.errors],
    synced_at: syncedAt,
    source,
  };
}

export async function syncMonitoring(): Promise<SyncResult> {
  const syncedAt = new Date().toISOString();
  const errors: string[] = [];
  let source: "CEISA" | "MOCK" = "CEISA";
  let rawData: any[] = [];

  const apiResult = await callCeisaApi<any>("/monitoring/browse");

  if (apiResult.success && apiResult.data.length > 0) {
    rawData = apiResult.data;
  } else {
    source = "MOCK";
    rawData = generateMockMonitoringData();
    if (apiResult.error) errors.push(`API: ${apiResult.error}`);
  }

  const transformedData = rawData.map(transformMonitoring);
  const upsertResult = await upsertToTable("ceisa_monitoring", transformedData);

  // Create notifications for status changes
  if (upsertResult.inserted > 0 || upsertResult.updated > 0) {
    await createStatusChangeNotifications(transformedData);
  }

  return {
    success: errors.length === 0 && upsertResult.errors.length === 0,
    table: "ceisa_monitoring",
    inserted: upsertResult.inserted,
    updated: upsertResult.updated,
    errors: [...errors, ...upsertResult.errors],
    synced_at: syncedAt,
    source,
  };
}

// Sync Customs Offices (Master Data)
export async function syncCustomsOffices(): Promise<SyncResult> {
  const syncedAt = new Date().toISOString();
  const errors: string[] = [];
  let source: "CEISA" | "MOCK" = "CEISA";
  let rawData: any[] = [];

  const apiResult = await callCeisaApi<any>("/master/customs-offices");

  if (apiResult.success && apiResult.data.length > 0) {
    rawData = apiResult.data;
  } else {
    source = "MOCK";
    // Generate mock data based on migration seed
    rawData = [
      {
        code: "IDCGK",
        name: "KPU Bea Cukai Soekarno-Hatta",
        type: "AIR",
        city: "Tangerang",
        province: "Banten",
      },
      {
        code: "IDTPP",
        name: "KPU Bea Cukai Tanjung Priok",
        type: "SEA",
        city: "Jakarta",
        province: "DKI Jakarta",
      },
      {
        code: "IDSUB",
        name: "KPU Bea Cukai Tanjung Perak",
        type: "SEA",
        city: "Surabaya",
        province: "Jawa Timur",
      },
      {
        code: "IDJKT",
        name: "Kanwil DJBC Jakarta",
        type: "MIXED",
        city: "Jakarta",
        province: "DKI Jakarta",
      },
      {
        code: "IDBPN",
        name: "KPU Bea Cukai Balikpapan",
        type: "SEA",
        city: "Balikpapan",
        province: "Kalimantan Timur",
      },
      {
        code: "IDMES",
        name: "KPU Bea Cukai Belawan",
        type: "SEA",
        city: "Medan",
        province: "Sumatera Utara",
      },
      {
        code: "IDDPS",
        name: "KPU Bea Cukai Ngurah Rai",
        type: "AIR",
        city: "Denpasar",
        province: "Bali",
      },
      {
        code: "IDUPG",
        name: "KPU Bea Cukai Makassar",
        type: "SEA",
        city: "Makassar",
        province: "Sulawesi Selatan",
      },
    ];
    if (apiResult.error)
      errors.push(`API: ${apiResult.error} - Using seed data`);
  }

  const transformedData = rawData.map((item: any) => ({
    code: item.code || item.kode,
    name: item.name || item.nama,
    type: item.type || item.jenis || "MIXED",
    city: item.city || item.kota || null,
    province: item.province || item.provinsi || null,
    address: item.address || item.alamat || null,
    is_active: item.is_active !== undefined ? item.is_active : true,
    source: source === "CEISA" ? "ceisa_sync" : "seed_djbc",
  }));

  const upsertResult = await upsertToTable(
    "customs_offices",
    transformedData,
    "code",
  );

  return {
    success: errors.length === 0 && upsertResult.errors.length === 0,
    table: "customs_offices",
    inserted: upsertResult.inserted,
    updated: upsertResult.updated,
    errors: [...errors, ...upsertResult.errors],
    synced_at: syncedAt,
    source,
  };
}

// Sync HS Codes (Master Data)
export async function syncHSCodes(): Promise<SyncResult> {
  const syncedAt = new Date().toISOString();
  const errors: string[] = [];
  let source: "CEISA" | "MOCK" = "CEISA";
  let rawData: any[] = [];

  const apiResult = await callCeisaApi<any>("/master/hs-codes");

  if (apiResult.success && apiResult.data.length > 0) {
    rawData = apiResult.data;
  } else {
    source = "MOCK";
    // Generate mock HS codes data
    rawData = [
      {
        code: "0101210000",
        name: "Live horses, pure-bred breeding animals",
        description: "Kuda murni untuk bibit",
        bm_rate: 0,
        ppn_rate: 11,
        pph_rate: 2.5,
        unit: "HEAD",
      },
      {
        code: "0201100000",
        name: "Carcasses and half-carcasses of bovine animals, fresh or chilled",
        description: "Karkas sapi, segar atau dingin",
        bm_rate: 5,
        ppn_rate: 11,
        pph_rate: 2.5,
        unit: "KG",
      },
      {
        code: "0301110000",
        name: "Live ornamental fish - Freshwater",
        description: "Ikan hias air tawar hidup",
        bm_rate: 0,
        ppn_rate: 11,
        pph_rate: 2.5,
        unit: "KG",
      },
      {
        code: "0401200000",
        name: "Milk and cream, not concentrated, fat content > 1% but ≤ 6%",
        description: "Susu dan krim, tidak dipekatkan",
        bm_rate: 5,
        ppn_rate: 11,
        pph_rate: 2.5,
        unit: "LTR",
      },
      {
        code: "0713320000",
        name: "Small red (adzuki) beans, dried shelled",
        description: "Kacang merah kecil kering tanpa kulit",
        bm_rate: 0,
        ppn_rate: 11,
        pph_rate: 2.5,
        unit: "KG",
      },
    ];
    if (apiResult.error)
      errors.push(`API: ${apiResult.error} - Using sample data`);
  }

  const transformedData = rawData.map((item: any) => ({
    code: item.code || item.hs_code,
    name: item.name || item.description?.substring(0, 255) || null,
    description: item.description || item.name || "",
    description_id: item.description_id || item.description || null,
    bm_rate: item.bm_rate !== undefined ? item.bm_rate : 0,
    ppn_rate: item.ppn_rate !== undefined ? item.ppn_rate : 11,
    pph_rate: item.pph_rate !== undefined ? item.pph_rate : 0,
    unit: item.unit || item.satuan || "KG",
    is_active: item.is_active !== undefined ? item.is_active : true,
  }));

  const upsertResult = await upsertToTable("hs_codes", transformedData, "code");

  return {
    success: errors.length === 0 && upsertResult.errors.length === 0,
    table: "hs_codes",
    inserted: upsertResult.inserted,
    updated: upsertResult.updated,
    errors: [...errors, ...upsertResult.errors],
    synced_at: syncedAt,
    source,
  };
}

// Helper to create notifications after sync
async function createStatusChangeNotifications(data: any[]) {
  try {
    const notifications = data
      .filter((d) => d.status_terakhir)
      .map((d) => ({
        type: "STATUS_CHANGE",
        title: getStatusTitle(d.status_terakhir),
        message: `${d.jenis_dokumen || "Dokumen"} ${d.nomor_aju} ${getStatusMessage(d.status_terakhir)}`,
        reference_type: "ceisa_monitoring",
        reference_id: d.nomor_aju,
        nomor_aju: d.nomor_aju,
        new_status: d.status_terakhir,
        metadata: {
          jenis_dokumen: d.jenis_dokumen,
          kantor_pabean: d.kantor_pabean,
          keterangan_penolakan: d.keterangan_penolakan,
        },
      }));

    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }
  } catch (error) {
    console.error("Error creating notifications:", error);
  }
}

function getStatusTitle(status: string): string {
  switch (status) {
    case "APPROVED":
      return "Dokumen Disetujui CEISA";
    case "REJECTED":
      return "Dokumen Ditolak CEISA";
    case "SUBMITTED":
      return "Dokumen Terkirim ke CEISA";
    case "PENDING":
      return "Dokumen Menunggu Review";
    default:
      return "Status Dokumen Berubah";
  }
}

function getStatusMessage(status: string): string {
  switch (status) {
    case "APPROVED":
      return "telah disetujui CEISA";
    case "REJECTED":
      return "ditolak oleh CEISA";
    case "SUBMITTED":
      return "berhasil dikirim ke CEISA";
    case "PENDING":
      return "sedang menunggu review";
    default:
      return `status berubah menjadi ${status}`;
  }
}

// ========== SYNC ALL ==========

export async function syncCeisaDocuments(): Promise<SyncAllResult> {
  const startTime = Date.now();
  const results: SyncResult[] = [];

  // Run all syncs in parallel
  const [
    pibResult,
    pebResult,
    manifestResult,
    pkbsiResult,
    kendaraanResult,
    monitoringResult,
    customsOfficesResult,
    hsCodesResult,
  ] = await Promise.all([
    syncPibDocuments(),
    syncPebDocuments(),
    syncManifests(),
    syncPkbsi(),
    syncKendaraan(),
    syncMonitoring(),
    syncCustomsOffices(),
    syncHSCodes(),
  ]);

  results.push(
    pibResult,
    pebResult,
    manifestResult,
    pkbsiResult,
    kendaraanResult,
    monitoringResult,
    customsOfficesResult,
    hsCodesResult,
  );

  const total_inserted = results.reduce((sum, r) => sum + r.inserted, 0);
  const total_updated = results.reduce((sum, r) => sum + r.updated, 0);
  const duration_ms = Date.now() - startTime;
  const success = results.every((r) => r.success);

  return {
    success,
    results,
    total_inserted,
    total_updated,
    duration_ms,
  };
}

// ========== SELECTIVE SYNC ==========

export async function syncCeisaByTable(tableName: string): Promise<SyncResult> {
  switch (tableName) {
    case "pib_documents":
      return syncPibDocuments();
    case "peb_documents":
      return syncPebDocuments();
    case "ceisa_manifests":
      return syncManifests();
    case "ceisa_pkbsi":
      return syncPkbsi();
    case "ceisa_kendaraan":
      return syncKendaraan();
    case "ceisa_monitoring":
      return syncMonitoring();
    case "ceisa_vehicles":
      return syncKendaraan();
    case "customs_offices":
      return syncCustomsOffices();
    case "hs_codes":
      return syncHSCodes();
    default:
      return {
        success: false,
        table: tableName,
        inserted: 0,
        updated: 0,
        errors: [`Unknown table: ${tableName}`],
        synced_at: new Date().toISOString(),
        source: "MOCK",
      };
  }
}
