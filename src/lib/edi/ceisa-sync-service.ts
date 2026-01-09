/**
 * CEISA 4.0 Sync Service (Host-to-Host DJBC Architecture)
 *
 * IMPORTANT NOTES:
 * - CEISA 4.0 is a document submission system, NOT a browse/pull API
 * - There are NO /pib/browse, /peb/browse, /manifest/browse endpoints
 * - All data originates from local payload, submitted TO CEISA, not FROM CEISA
 * - Status polling is done via GET /openapi/status/:nomorAju
 *
 * Flow:
 * 1. Save payload locally (draft)
 * 2. POST /openapi/document?isFinal=true (submit to CEISA)
 * 3. Get nomorAju from response
 * 4. Poll GET /openapi/status/:nomorAju for status updates
 * 5. Store status & response locally
 */

import { supabase } from "@/lib/supabase";

// ========== TYPES ==========

export interface SubmitResult {
  success: boolean;
  nomorAju?: string;
  message: string;
  error?: string;
  rawResponse?: any;
}

export interface StatusResult {
  success: boolean;
  nomorAju: string;
  status?: {
    kodeStatus: string;
    kodeRespon: string;
    nomorDaftar?: string;
    tanggalDaftar?: string;
    waktuStatus?: string;
    keterangan?: string;
    pesan?: string[];
  };
  error?: string;
  rawResponse?: any;
}

export interface SaveResult {
  success: boolean;
  id?: string;
  nomorAju?: string;
  error?: string;
}

export interface SyncStatusResult {
  success: boolean;
  nomorAju: string;
  previousStatus?: string;
  newStatus?: string;
  affected: number;
  error?: string;
}

interface CeisaApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

// ========== API HELPER ==========

/**
 * Call CEISA API via Edge Function proxy
 * All CEISA communication MUST go through this function
 *
 * @param endpoint - CEISA API endpoint (e.g., /openapi/document, /openapi/status)
 * @param method - HTTP method
 * @param payload - Request body (for POST requests)
 */
async function callCeisaApi<T = any>(
  endpoint: string,
  method: "GET" | "POST" = "GET",
  payload?: any,
): Promise<CeisaApiResponse<T>> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-ceisa-proxy",
      {
        body: {
          endpoint,
          method,
          payload,
        },
      },
    );

    if (error) {
      console.error(`CEISA Proxy Error (${endpoint}):`, error);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return {
        success: false,
        error: data?.error || data?.message || "CEISA API error",
        code: data?.code,
      };
    }

    return {
      success: true,
      data: data.data,
      code: data.code,
      message: data.message,
    };
  } catch (err: any) {
    console.error(`CEISA API Error (${endpoint}):`, err);
    return { success: false, error: err.message };
  }
}

// ========== CONNECTION TEST ==========

/**
 * Test connection to CEISA API
 */
export async function testCeisaConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  const result = await callCeisaApi("__test__", "GET");

  if (result.success) {
    return {
      success: true,
      message: "CEISA Connected",
      details: result.data,
    };
  }

  return {
    success: false,
    message: result.error || "CEISA Terputus",
  };
}

// ========== TRANSFORM FUNCTIONS ==========

/**
 * Transform internal PIB payload to database format
 * Used when saving PIB from local form, NOT from CEISA response
 */
function transformPibFromPayload(payload: any): any {
  return {
    nomor_aju: payload.nomorAju,
    kode_dokumen: payload.kodeDokumen || "20", // BC 2.0
    tanggal_aju: payload.tanggalAju,

    importer_npwp: payload.importir?.npwp ?? null,
    importer_name: payload.importir?.nama ?? null,
    importer_address: payload.importir?.alamat ?? null,

    cif: Number(payload.cif ?? 0),
    fob: Number(payload.fob ?? 0),
    freight: Number(payload.freight ?? 0),
    asuransi: Number(payload.asuransi ?? 0),

    bruto: Number(payload.bruto ?? 0),
    netto: Number(payload.netto ?? 0),

    jumlah_barang: Array.isArray(payload.barang) ? payload.barang.length : 0,

    metadata: payload,
    source: "LOCAL",
    synced_at: new Date().toISOString(),
  };
}

/**
 * Transform internal PEB payload to database format
 * Used when saving PEB from local form, NOT from CEISA response
 */
function transformPebFromPayload(payload: any): any {
  return {
    nomor_aju: payload.nomorAju,
    kode_dokumen: payload.kodeDokumen || "30", // BC 3.0
    tanggal_aju: payload.tanggalAju,

    exporter_npwp: payload.eksportir?.npwp ?? null,
    exporter_name: payload.eksportir?.nama ?? null,
    exporter_address: payload.eksportir?.alamat ?? null,

    fob: Number(payload.fob ?? 0),
    freight: Number(payload.freight ?? 0),
    asuransi: Number(payload.asuransi ?? 0),

    bruto: Number(payload.bruto ?? 0),
    netto: Number(payload.netto ?? 0),

    negara_tujuan: payload.negaraTujuan ?? null,
    pelabuhan_muat: payload.pelabuhanMuat ?? null,
    pelabuhan_bongkar: payload.pelabuhanBongkar ?? null,

    jumlah_barang: Array.isArray(payload.barang) ? payload.barang.length : 0,

    metadata: payload,
    source: "LOCAL",
    synced_at: new Date().toISOString(),
  };
}

/**
 * Transform CEISA status response to database format
 * Used for results from GET /openapi/status or GET /openapi/status/:nomorAju
 */
function transformCeisaStatus(raw: any): any {
  return {
    nomor_aju: raw.nomorAju,
    kode_status: raw.kodeStatus ?? null,
    kode_respon: raw.kodeRespon ?? null,
    nomor_daftar: raw.nomorDaftar ?? null,
    tanggal_daftar: raw.tanggalDaftar ?? null,
    waktu_status: raw.waktuStatus ?? null,
    keterangan: raw.keterangan ?? null,
    pesan: Array.isArray(raw.pesan)
      ? raw.pesan.join("; ")
      : (raw.pesan ?? null),
    metadata: raw,
    source: "CEISA",
    synced_at: new Date().toISOString(),
  };
}

/**
 * Transform monitoring data for ceisa_monitoring table
 */
function transformMonitoringRecord(input: {
  nomorAju: string;
  jenisDokumen: string;
  submitAt: string;
  statusResponse?: any;
  retryCount?: number;
  lastRetryAt?: string;
  errorMessage?: string;
}): any {
  const status = input.statusResponse;

  return {
    nomor_aju: input.nomorAju,
    jenis_dokumen: input.jenisDokumen,

    tanggal_pengajuan: input.submitAt,
    tanggal_respon_ceisa: status?.waktuStatus ?? null,

    status_terakhir: status?.kodeStatus ?? null,
    kode_respon: status?.kodeRespon ?? null,

    pesan_respon: Array.isArray(status?.pesan)
      ? status.pesan.join("; ")
      : (status?.pesan ?? null),

    keterangan_penolakan:
      status?.kodeRespon === "REJECTED" ? status?.keterangan : null,

    jumlah_retry: input.retryCount ?? 0,
    retry_terakhir: input.lastRetryAt ?? null,

    error_message: input.errorMessage ?? null,

    metadata: { status },
    updated_at: new Date().toISOString(),
  };
}

// future use – not from CEISA response
// These transforms are prepared for potential future CEISA API expansion
// Currently, PKBSI and Kendaraan data must be entered locally, not synced from CEISA

/*
function transformPkbsi(raw: any): any {
  return {
    nomor_aju: raw.nomorAju || raw.nomor_aju,
    nomor_dokumen: raw.nomorDokumen || raw.nomor_dokumen,
    tanggal_dokumen: raw.tanggalDokumen || raw.tanggal_dokumen,
    jenis_barang_strategis: raw.jenisBarangStrategis || raw.jenis_barang_strategis,
    hs_code: raw.hsCode || raw.hs_code,
    uraian_barang: raw.uraianBarang || raw.uraian_barang,
    jumlah: raw.jumlah || 0,
    satuan: raw.satuan,
    status: raw.status || "PENDING",
    metadata: raw,
    synced_at: new Date().toISOString(),
    source: "LOCAL",
  };
}

function transformKendaraan(raw: any): any {
  return {
    nomor_aju: raw.nomorAju || raw.nomor_aju,
    nomor_pib: raw.nomorPib || raw.nomor_pib,
    jenis_kendaraan: raw.jenisKendaraan || raw.jenis_kendaraan,
    merek: raw.merek,
    tipe: raw.tipe,
    nomor_rangka: raw.nomorRangka || raw.nomor_rangka,
    nomor_mesin: raw.nomorMesin || raw.nomor_mesin,
    status: raw.status || "PENDING",
    metadata: raw,
    synced_at: new Date().toISOString(),
    source: "LOCAL",
  };
}
*/

// ========== DATABASE FUNCTIONS ==========

/**
 * Simplified upsert function
 * Uses single upsert call without pre-check select
 */
async function upsertToTable(
  tableName: string,
  data: any | any[],
  onConflict: string = "nomor_aju",
): Promise<{ affected: number; error?: string }> {
  const records = Array.isArray(data) ? data : [data];

  if (!records.length) {
    return { affected: 0 };
  }

  const { error, count } = await supabase.from(tableName).upsert(records, {
    onConflict,
    count: "exact",
  });

  if (error) {
    console.error(`Upsert error (${tableName}):`, error);
    return { affected: 0, error: error.message };
  }

  return { affected: count ?? records.length };
}

// ========== PIB DOCUMENT OPERATIONS ==========

/**
 * Save PIB as draft locally
 * This is the first step before submitting to CEISA
 */
export async function savePibDraft(payload: any): Promise<SaveResult> {
  try {
    const data = transformPibFromPayload(payload);
    data.status = "DRAFT";

    const result = await upsertToTable("pib_documents", data);

    if (result.error) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      nomorAju: payload.nomorAju,
    };
  } catch (err: any) {
    console.error("Error saving PIB draft:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Submit PIB to CEISA
 * Flow:
 * 1. Save payload locally as SUBMITTED status
 * 2. POST to CEISA /openapi/document?isFinal=true
 * 3. Get nomorAju from response
 * 4. Update local record with CEISA response
 */
export async function submitPib(payload: any): Promise<SubmitResult> {
  const submitAt = new Date().toISOString();

  try {
    // 1. Update local status to SUBMITTED
    const data = transformPibFromPayload(payload);
    data.status = "SUBMITTED";
    data.ceisa_submitted_at = submitAt;

    await upsertToTable("pib_documents", data);

    // 2. Submit to CEISA
    const ceisaResult = await callCeisaApi(
      "/openapi/document?isFinal=true",
      "POST",
      payload,
    );

    if (!ceisaResult.success) {
      // Update status to FAILED
      await supabase
        .from("pib_documents")
        .update({
          status: "FAILED",
          ceisa_error: ceisaResult.error,
          updated_at: new Date().toISOString(),
        })
        .eq("nomor_aju", payload.nomorAju);

      // Log to monitoring
      await upsertToTable(
        "ceisa_monitoring",
        transformMonitoringRecord({
          nomorAju: payload.nomorAju,
          jenisDokumen: "PIB",
          submitAt,
          errorMessage: ceisaResult.error,
        }),
      );

      return {
        success: false,
        nomorAju: payload.nomorAju,
        message: "Gagal mengirim ke CEISA",
        error: ceisaResult.error,
      };
    }

    // 3. Extract nomorAju from response
    const responseNomorAju = ceisaResult.data?.nomorAju || payload.nomorAju;

    // 4. Update local record with CEISA response
    await supabase
      .from("pib_documents")
      .update({
        nomor_aju: responseNomorAju,
        ceisa_response: ceisaResult.data,
        updated_at: new Date().toISOString(),
      })
      .eq("nomor_aju", payload.nomorAju);

    // Log to monitoring
    await upsertToTable(
      "ceisa_monitoring",
      transformMonitoringRecord({
        nomorAju: responseNomorAju,
        jenisDokumen: "PIB",
        submitAt,
      }),
    );

    return {
      success: true,
      nomorAju: responseNomorAju,
      message: "PIB berhasil dikirim ke CEISA",
      rawResponse: ceisaResult.data,
    };
  } catch (err: any) {
    console.error("Error submitting PIB:", err);
    return {
      success: false,
      nomorAju: payload.nomorAju,
      message: "Error saat mengirim PIB",
      error: err.message,
    };
  }
}

/**
 * Sync/poll PIB status from CEISA
 * Calls GET /openapi/status/:nomorAju
 */
export async function syncPibStatus(
  nomorAju: string,
): Promise<SyncStatusResult> {
  try {
    // Get current status from database
    const { data: currentDoc } = await supabase
      .from("pib_documents")
      .select("status")
      .eq("nomor_aju", nomorAju)
      .single();

    const previousStatus = currentDoc?.status;

    // Poll CEISA for status
    const ceisaResult = await callCeisaApi<any>(
      `/openapi/status/${nomorAju}`,
      "GET",
    );

    if (!ceisaResult.success) {
      return {
        success: false,
        nomorAju,
        previousStatus,
        affected: 0,
        error: ceisaResult.error,
      };
    }

    const statusData = transformCeisaStatus(ceisaResult.data);
    const newStatus = mapCeisaStatusToLocal(statusData.kode_status);

    // Update PIB document status
    const { error: updateError } = await supabase
      .from("pib_documents")
      .update({
        status: newStatus,
        registration_number: statusData.nomor_daftar,
        registration_date: statusData.tanggal_daftar,
        ceisa_status: statusData.kode_status,
        ceisa_response_code: statusData.kode_respon,
        ceisa_message: statusData.pesan,
        updated_at: new Date().toISOString(),
      })
      .eq("nomor_aju", nomorAju);

    if (updateError) {
      return {
        success: false,
        nomorAju,
        previousStatus,
        affected: 0,
        error: updateError.message,
      };
    }

    // Update monitoring table
    await upsertToTable(
      "ceisa_monitoring",
      transformMonitoringRecord({
        nomorAju,
        jenisDokumen: "PIB",
        submitAt: new Date().toISOString(),
        statusResponse: ceisaResult.data,
      }),
    );

    // Create notification if status changed
    if (previousStatus !== newStatus) {
      await createStatusNotification(nomorAju, "PIB", newStatus);
    }

    return {
      success: true,
      nomorAju,
      previousStatus,
      newStatus,
      affected: 1,
    };
  } catch (err: any) {
    console.error("Error syncing PIB status:", err);
    return {
      success: false,
      nomorAju,
      affected: 0,
      error: err.message,
    };
  }
}

// ========== PEB DOCUMENT OPERATIONS ==========

/**
 * Save PEB as draft locally
 */
export async function savePebDraft(payload: any): Promise<SaveResult> {
  try {
    const data = transformPebFromPayload(payload);
    data.status = "DRAFT";

    const result = await upsertToTable("peb_documents", data);

    if (result.error) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      nomorAju: payload.nomorAju,
    };
  } catch (err: any) {
    console.error("Error saving PEB draft:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Submit PEB to CEISA
 */
export async function submitPeb(payload: any): Promise<SubmitResult> {
  const submitAt = new Date().toISOString();

  try {
    // 1. Update local status to SUBMITTED
    const data = transformPebFromPayload(payload);
    data.status = "SUBMITTED";
    data.ceisa_submitted_at = submitAt;

    await upsertToTable("peb_documents", data);

    // 2. Submit to CEISA
    const ceisaResult = await callCeisaApi(
      "/openapi/document?isFinal=true",
      "POST",
      payload,
    );

    if (!ceisaResult.success) {
      // Update status to FAILED
      await supabase
        .from("peb_documents")
        .update({
          status: "FAILED",
          ceisa_error: ceisaResult.error,
          updated_at: new Date().toISOString(),
        })
        .eq("nomor_aju", payload.nomorAju);

      // Log to monitoring
      await upsertToTable(
        "ceisa_monitoring",
        transformMonitoringRecord({
          nomorAju: payload.nomorAju,
          jenisDokumen: "PEB",
          submitAt,
          errorMessage: ceisaResult.error,
        }),
      );

      return {
        success: false,
        nomorAju: payload.nomorAju,
        message: "Gagal mengirim ke CEISA",
        error: ceisaResult.error,
      };
    }

    // 3. Extract nomorAju from response
    const responseNomorAju = ceisaResult.data?.nomorAju || payload.nomorAju;

    // 4. Update local record with CEISA response
    await supabase
      .from("peb_documents")
      .update({
        nomor_aju: responseNomorAju,
        ceisa_response: ceisaResult.data,
        updated_at: new Date().toISOString(),
      })
      .eq("nomor_aju", payload.nomorAju);

    // Log to monitoring
    await upsertToTable(
      "ceisa_monitoring",
      transformMonitoringRecord({
        nomorAju: responseNomorAju,
        jenisDokumen: "PEB",
        submitAt,
      }),
    );

    return {
      success: true,
      nomorAju: responseNomorAju,
      message: "PEB berhasil dikirim ke CEISA",
      rawResponse: ceisaResult.data,
    };
  } catch (err: any) {
    console.error("Error submitting PEB:", err);
    return {
      success: false,
      nomorAju: payload.nomorAju,
      message: "Error saat mengirim PEB",
      error: err.message,
    };
  }
}

/**
 * Sync/poll PEB status from CEISA
 */
export async function syncPebStatus(
  nomorAju: string,
): Promise<SyncStatusResult> {
  try {
    // Get current status from database
    const { data: currentDoc } = await supabase
      .from("peb_documents")
      .select("status")
      .eq("nomor_aju", nomorAju)
      .single();

    const previousStatus = currentDoc?.status;

    // Poll CEISA for status
    const ceisaResult = await callCeisaApi<any>(
      `/openapi/status/${nomorAju}`,
      "GET",
    );

    if (!ceisaResult.success) {
      return {
        success: false,
        nomorAju,
        previousStatus,
        affected: 0,
        error: ceisaResult.error,
      };
    }

    const statusData = transformCeisaStatus(ceisaResult.data);
    const newStatus = mapCeisaStatusToLocal(statusData.kode_status);

    // Update PEB document status
    const { error: updateError } = await supabase
      .from("peb_documents")
      .update({
        status: newStatus,
        registration_number: statusData.nomor_daftar,
        registration_date: statusData.tanggal_daftar,
        ceisa_status: statusData.kode_status,
        ceisa_response_code: statusData.kode_respon,
        ceisa_message: statusData.pesan,
        updated_at: new Date().toISOString(),
      })
      .eq("nomor_aju", nomorAju);

    if (updateError) {
      return {
        success: false,
        nomorAju,
        previousStatus,
        affected: 0,
        error: updateError.message,
      };
    }

    // Update monitoring table
    await upsertToTable(
      "ceisa_monitoring",
      transformMonitoringRecord({
        nomorAju,
        jenisDokumen: "PEB",
        submitAt: new Date().toISOString(),
        statusResponse: ceisaResult.data,
      }),
    );

    // Create notification if status changed
    if (previousStatus !== newStatus) {
      await createStatusNotification(nomorAju, "PEB", newStatus);
    }

    return {
      success: true,
      nomorAju,
      previousStatus,
      newStatus,
      affected: 1,
    };
  } catch (err: any) {
    console.error("Error syncing PEB status:", err);
    return {
      success: false,
      nomorAju,
      affected: 0,
      error: err.message,
    };
  }
}

// ========== BATCH STATUS SYNC ==========

/**
 * Sync status for all pending/submitted documents
 * Polls CEISA for each document that hasn't reached final status
 */
export async function syncAllPendingStatuses(): Promise<{
  success: boolean;
  pibSynced: number;
  pebSynced: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let pibSynced = 0;
  let pebSynced = 0;

  try {
    // Get pending PIB documents
    const { data: pendingPibs } = await supabase
      .from("pib_documents")
      .select("nomor_aju")
      .in("status", ["SUBMITTED", "PENDING", "UNDER_REVIEW"]);

    // Get pending PEB documents
    const { data: pendingPebs } = await supabase
      .from("peb_documents")
      .select("nomor_aju")
      .in("status", ["SUBMITTED", "PENDING", "UNDER_REVIEW"]);

    // Sync PIB statuses
    for (const pib of pendingPibs || []) {
      const result = await syncPibStatus(pib.nomor_aju);
      if (result.success) {
        pibSynced++;
      } else if (result.error) {
        errors.push(`PIB ${pib.nomor_aju}: ${result.error}`);
      }
    }

    // Sync PEB statuses
    for (const peb of pendingPebs || []) {
      const result = await syncPebStatus(peb.nomor_aju);
      if (result.success) {
        pebSynced++;
      } else if (result.error) {
        errors.push(`PEB ${peb.nomor_aju}: ${result.error}`);
      }
    }

    return {
      success: errors.length === 0,
      pibSynced,
      pebSynced,
      errors,
    };
  } catch (err: any) {
    console.error("Error syncing pending statuses:", err);
    return {
      success: false,
      pibSynced,
      pebSynced,
      errors: [err.message],
    };
  }
}

// ========== HELPER FUNCTIONS ==========

/**
 * Map CEISA status code to local status enum
 */
function mapCeisaStatusToLocal(ceisaStatus: string | null): string {
  if (!ceisaStatus) return "PENDING";

  const statusMap: Record<string, string> = {
    "00": "PENDING", // Waiting
    "01": "SUBMITTED", // Received
    "02": "UNDER_REVIEW", // Processing
    "03": "APPROVED", // Accepted
    "04": "REJECTED", // Rejected
    "05": "CANCELLED", // Cancelled
    PENDING: "PENDING",
    SUBMITTED: "SUBMITTED",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    CANCELLED: "CANCELLED",
  };

  return statusMap[ceisaStatus] || "PENDING";
}

/**
 * Create notification for status change
 */
async function createStatusNotification(
  nomorAju: string,
  jenisDokumen: string,
  newStatus: string,
): Promise<void> {
  try {
    const notification = {
      type: "STATUS_CHANGE",
      title: getStatusTitle(newStatus),
      message: `${jenisDokumen} ${nomorAju} ${getStatusMessage(newStatus)}`,
      reference_type: jenisDokumen.toLowerCase(),
      reference_id: nomorAju,
      nomor_aju: nomorAju,
      new_status: newStatus,
      metadata: { jenisDokumen },
    };

    await supabase.from("notifications").insert(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

function getStatusTitle(status: string): string {
  const titles: Record<string, string> = {
    APPROVED: "Dokumen Disetujui CEISA",
    REJECTED: "Dokumen Ditolak CEISA",
    SUBMITTED: "Dokumen Terkirim ke CEISA",
    PENDING: "Dokumen Menunggu Review",
    UNDER_REVIEW: "Dokumen Sedang Diproses",
    FAILED: "Pengiriman Gagal",
    CANCELLED: "Dokumen Dibatalkan",
  };
  return titles[status] || "Status Dokumen Berubah";
}

function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    APPROVED: "telah disetujui CEISA",
    REJECTED: "ditolak oleh CEISA",
    SUBMITTED: "berhasil dikirim ke CEISA",
    PENDING: "sedang menunggu review",
    UNDER_REVIEW: "sedang diproses CEISA",
    FAILED: "gagal dikirim ke CEISA",
    CANCELLED: "telah dibatalkan",
  };
  return messages[status] || `status berubah menjadi ${status}`;
}

// ========== LEGACY COMPATIBILITY (DEPRECATED) ==========

/**
 * @deprecated Use submitPib or submitPeb instead
 * This function is kept for backward compatibility only
 */
export async function syncCeisaDocuments(): Promise<{
  success: boolean;
  message: string;
}> {
  console.warn(
    "syncCeisaDocuments is deprecated. CEISA 4.0 is a submission system, not a browse/pull API. Use submitPib/submitPeb to submit documents and syncPibStatus/syncPebStatus to poll status.",
  );

  // Just sync pending statuses as that's the only valid "sync" operation
  const result = await syncAllPendingStatuses();

  return {
    success: result.success,
    message: `Synced ${result.pibSynced} PIB and ${result.pebSynced} PEB statuses${
      result.errors.length ? `. Errors: ${result.errors.join(", ")}` : ""
    }`,
  };
}

/**
 * @deprecated Not applicable in CEISA 4.0 architecture
 */
export async function syncCeisaByTable(tableName: string): Promise<{
  success: boolean;
  message: string;
}> {
  console.warn(
    `syncCeisaByTable(${tableName}) is deprecated. CEISA 4.0 does not provide browse/pull endpoints.`,
  );

  return {
    success: false,
    message:
      "CEISA 4.0 is a document submission system. Use submitPib/submitPeb to submit documents.",
  };
}
