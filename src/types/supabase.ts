export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          after_data: Json | null
          before_data: Json | null
          created_at: string | null
          document_number: string
          document_type: string
          id: string
          ip_address: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string | null
          document_number: string
          document_type: string
          id?: string
          ip_address?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string | null
          document_number?: string
          document_type?: string
          id?: string
          ip_address?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      buyers: {
        Row: {
          address: string | null
          code: string
          country: string | null
          country_id: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          code: string
          country?: string | null
          country_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          country?: string | null
          country_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyers_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      ceisa_comparisons: {
        Row: {
          created_at: string | null
          id: string
          manifest_berat: number | null
          manifest_data: Json | null
          manifest_jumlah_kemasan: number | null
          nomor_aju: string
          pib_berat: number | null
          pib_data: Json | null
          pib_jumlah_kemasan: number | null
          selisih_berat: number | null
          selisih_kemasan: number | null
          source: string | null
          status: string | null
          synced_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          manifest_berat?: number | null
          manifest_data?: Json | null
          manifest_jumlah_kemasan?: number | null
          nomor_aju: string
          pib_berat?: number | null
          pib_data?: Json | null
          pib_jumlah_kemasan?: number | null
          selisih_berat?: number | null
          selisih_kemasan?: number | null
          source?: string | null
          status?: string | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          manifest_berat?: number | null
          manifest_data?: Json | null
          manifest_jumlah_kemasan?: number | null
          nomor_aju?: string
          pib_berat?: number | null
          pib_data?: Json | null
          pib_jumlah_kemasan?: number | null
          selisih_berat?: number | null
          selisih_kemasan?: number | null
          source?: string | null
          status?: string | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ceisa_kendaraan: {
        Row: {
          bahan_bakar: string | null
          bea_masuk: number | null
          ceisa_response: Json | null
          created_at: string | null
          id: string
          jenis_kendaraan: string | null
          jumlah_penumpang: number | null
          jumlah_roda: number | null
          jumlah_silinder: number | null
          kapasitas_mesin: number | null
          kondisi: string | null
          mata_uang: string | null
          merek: string | null
          metadata: Json | null
          nama_importir: string | null
          negara_asal: string | null
          nilai_cif: number | null
          nomor_aju: string
          nomor_mesin: string | null
          nomor_pib: string | null
          nomor_rangka: string | null
          npwp_importir: string | null
          pelabuhan_bongkar: string | null
          pelabuhan_muat: string | null
          pph: number | null
          ppn: number | null
          ppnbm: number | null
          source: string | null
          status: string | null
          synced_at: string | null
          tahun_pembuatan: number | null
          tanggal_pib: string | null
          tipe: string | null
          updated_at: string | null
          warna: string | null
        }
        Insert: {
          bahan_bakar?: string | null
          bea_masuk?: number | null
          ceisa_response?: Json | null
          created_at?: string | null
          id?: string
          jenis_kendaraan?: string | null
          jumlah_penumpang?: number | null
          jumlah_roda?: number | null
          jumlah_silinder?: number | null
          kapasitas_mesin?: number | null
          kondisi?: string | null
          mata_uang?: string | null
          merek?: string | null
          metadata?: Json | null
          nama_importir?: string | null
          negara_asal?: string | null
          nilai_cif?: number | null
          nomor_aju: string
          nomor_mesin?: string | null
          nomor_pib?: string | null
          nomor_rangka?: string | null
          npwp_importir?: string | null
          pelabuhan_bongkar?: string | null
          pelabuhan_muat?: string | null
          pph?: number | null
          ppn?: number | null
          ppnbm?: number | null
          source?: string | null
          status?: string | null
          synced_at?: string | null
          tahun_pembuatan?: number | null
          tanggal_pib?: string | null
          tipe?: string | null
          updated_at?: string | null
          warna?: string | null
        }
        Update: {
          bahan_bakar?: string | null
          bea_masuk?: number | null
          ceisa_response?: Json | null
          created_at?: string | null
          id?: string
          jenis_kendaraan?: string | null
          jumlah_penumpang?: number | null
          jumlah_roda?: number | null
          jumlah_silinder?: number | null
          kapasitas_mesin?: number | null
          kondisi?: string | null
          mata_uang?: string | null
          merek?: string | null
          metadata?: Json | null
          nama_importir?: string | null
          negara_asal?: string | null
          nilai_cif?: number | null
          nomor_aju?: string
          nomor_mesin?: string | null
          nomor_pib?: string | null
          nomor_rangka?: string | null
          npwp_importir?: string | null
          pelabuhan_bongkar?: string | null
          pelabuhan_muat?: string | null
          pph?: number | null
          ppn?: number | null
          ppnbm?: number | null
          source?: string | null
          status?: string | null
          synced_at?: string | null
          tahun_pembuatan?: number | null
          tanggal_pib?: string | null
          tipe?: string | null
          updated_at?: string | null
          warna?: string | null
        }
        Relationships: []
      }
      ceisa_manifests: {
        Row: {
          bendera: string | null
          berat_bersih: number | null
          berat_kotor: number | null
          ceisa_response: Json | null
          created_at: string | null
          id: string
          jenis_kemasan: string | null
          jumlah_kemasan: number | null
          jumlah_kontainer: number | null
          metadata: Json | null
          nama_kapal: string | null
          nama_penerima: string | null
          nama_pengirim: string | null
          nomor_aju: string
          nomor_manifest: string | null
          npwp_penerima: string | null
          pelabuhan_asal: string | null
          pelabuhan_tujuan: string | null
          satuan_berat: string | null
          source: string | null
          status: string | null
          synced_at: string | null
          tanggal_manifest: string | null
          tanggal_tiba: string | null
          updated_at: string | null
          voyage_number: string | null
          xml_content: string | null
        }
        Insert: {
          bendera?: string | null
          berat_bersih?: number | null
          berat_kotor?: number | null
          ceisa_response?: Json | null
          created_at?: string | null
          id?: string
          jenis_kemasan?: string | null
          jumlah_kemasan?: number | null
          jumlah_kontainer?: number | null
          metadata?: Json | null
          nama_kapal?: string | null
          nama_penerima?: string | null
          nama_pengirim?: string | null
          nomor_aju: string
          nomor_manifest?: string | null
          npwp_penerima?: string | null
          pelabuhan_asal?: string | null
          pelabuhan_tujuan?: string | null
          satuan_berat?: string | null
          source?: string | null
          status?: string | null
          synced_at?: string | null
          tanggal_manifest?: string | null
          tanggal_tiba?: string | null
          updated_at?: string | null
          voyage_number?: string | null
          xml_content?: string | null
        }
        Update: {
          bendera?: string | null
          berat_bersih?: number | null
          berat_kotor?: number | null
          ceisa_response?: Json | null
          created_at?: string | null
          id?: string
          jenis_kemasan?: string | null
          jumlah_kemasan?: number | null
          jumlah_kontainer?: number | null
          metadata?: Json | null
          nama_kapal?: string | null
          nama_penerima?: string | null
          nama_pengirim?: string | null
          nomor_aju?: string
          nomor_manifest?: string | null
          npwp_penerima?: string | null
          pelabuhan_asal?: string | null
          pelabuhan_tujuan?: string | null
          satuan_berat?: string | null
          source?: string | null
          status?: string | null
          synced_at?: string | null
          tanggal_manifest?: string | null
          tanggal_tiba?: string | null
          updated_at?: string | null
          voyage_number?: string | null
          xml_content?: string | null
        }
        Relationships: []
      }
      ceisa_monitoring: {
        Row: {
          alasan_penolakan: string | null
          created_at: string | null
          id: string
          jenis_dokumen: string | null
          jumlah_retry: number | null
          kantor_pabean: string | null
          keterangan_penolakan: string | null
          kode_respon: string | null
          metadata: Json | null
          nama_petugas: string | null
          nomor_aju: string
          nomor_response: string | null
          pesan_respon: string | null
          request_log: Json | null
          response_log: Json | null
          retry_terakhir: string | null
          saran_perbaikan: string | null
          status_detail: string | null
          status_terakhir: string | null
          tanggal_kirim_ceisa: string | null
          tanggal_pengajuan: string | null
          tanggal_respon_ceisa: string | null
          updated_at: string | null
          waktu_respon_detik: number | null
        }
        Insert: {
          alasan_penolakan?: string | null
          created_at?: string | null
          id?: string
          jenis_dokumen?: string | null
          jumlah_retry?: number | null
          kantor_pabean?: string | null
          keterangan_penolakan?: string | null
          kode_respon?: string | null
          metadata?: Json | null
          nama_petugas?: string | null
          nomor_aju: string
          nomor_response?: string | null
          pesan_respon?: string | null
          request_log?: Json | null
          response_log?: Json | null
          retry_terakhir?: string | null
          saran_perbaikan?: string | null
          status_detail?: string | null
          status_terakhir?: string | null
          tanggal_kirim_ceisa?: string | null
          tanggal_pengajuan?: string | null
          tanggal_respon_ceisa?: string | null
          updated_at?: string | null
          waktu_respon_detik?: number | null
        }
        Update: {
          alasan_penolakan?: string | null
          created_at?: string | null
          id?: string
          jenis_dokumen?: string | null
          jumlah_retry?: number | null
          kantor_pabean?: string | null
          keterangan_penolakan?: string | null
          kode_respon?: string | null
          metadata?: Json | null
          nama_petugas?: string | null
          nomor_aju?: string
          nomor_response?: string | null
          pesan_respon?: string | null
          request_log?: Json | null
          response_log?: Json | null
          retry_terakhir?: string | null
          saran_perbaikan?: string | null
          status_detail?: string | null
          status_terakhir?: string | null
          tanggal_kirim_ceisa?: string | null
          tanggal_pengajuan?: string | null
          tanggal_respon_ceisa?: string | null
          updated_at?: string | null
          waktu_respon_detik?: number | null
        }
        Relationships: []
      }
      ceisa_pkbsi: {
        Row: {
          ceisa_response: Json | null
          created_at: string | null
          hs_code: string | null
          id: string
          instansi_pengawas: string | null
          jenis_barang_strategis: string | null
          jumlah: number | null
          kategori_lartas: string | null
          keterangan: string | null
          masa_berlaku_rekomendasi: string | null
          mata_uang: string | null
          metadata: Json | null
          nama_eksportir: string | null
          nama_importir: string | null
          negara_asal: string | null
          nilai_barang: number | null
          nomor_aju: string
          nomor_dokumen: string
          nomor_rekomendasi: string | null
          npwp_importir: string | null
          satuan: string | null
          source: string | null
          status: string | null
          status_lartas: string | null
          synced_at: string | null
          tanggal_dokumen: string | null
          tanggal_rekomendasi: string | null
          updated_at: string | null
          uraian_barang: string | null
        }
        Insert: {
          ceisa_response?: Json | null
          created_at?: string | null
          hs_code?: string | null
          id?: string
          instansi_pengawas?: string | null
          jenis_barang_strategis?: string | null
          jumlah?: number | null
          kategori_lartas?: string | null
          keterangan?: string | null
          masa_berlaku_rekomendasi?: string | null
          mata_uang?: string | null
          metadata?: Json | null
          nama_eksportir?: string | null
          nama_importir?: string | null
          negara_asal?: string | null
          nilai_barang?: number | null
          nomor_aju: string
          nomor_dokumen: string
          nomor_rekomendasi?: string | null
          npwp_importir?: string | null
          satuan?: string | null
          source?: string | null
          status?: string | null
          status_lartas?: string | null
          synced_at?: string | null
          tanggal_dokumen?: string | null
          tanggal_rekomendasi?: string | null
          updated_at?: string | null
          uraian_barang?: string | null
        }
        Update: {
          ceisa_response?: Json | null
          created_at?: string | null
          hs_code?: string | null
          id?: string
          instansi_pengawas?: string | null
          jenis_barang_strategis?: string | null
          jumlah?: number | null
          kategori_lartas?: string | null
          keterangan?: string | null
          masa_berlaku_rekomendasi?: string | null
          mata_uang?: string | null
          metadata?: Json | null
          nama_eksportir?: string | null
          nama_importir?: string | null
          negara_asal?: string | null
          nilai_barang?: number | null
          nomor_aju?: string
          nomor_dokumen?: string
          nomor_rekomendasi?: string | null
          npwp_importir?: string | null
          satuan?: string | null
          source?: string | null
          status?: string | null
          status_lartas?: string | null
          synced_at?: string | null
          tanggal_dokumen?: string | null
          tanggal_rekomendasi?: string | null
          updated_at?: string | null
          uraian_barang?: string | null
        }
        Relationships: []
      }
      ceisa_submission_logs: {
        Row: {
          attempt_number: number | null
          created_at: string | null
          document_number: string | null
          error_code: string | null
          error_type: string | null
          id: string
          is_success: boolean | null
          processed_by: string | null
          ref_id: string
          ref_type: string
          registration_number: string | null
          request_hash: string | null
          request_xml: string | null
          response_message: string | null
          response_raw: string | null
          response_status: string | null
          retry_allowed: boolean | null
        }
        Insert: {
          attempt_number?: number | null
          created_at?: string | null
          document_number?: string | null
          error_code?: string | null
          error_type?: string | null
          id?: string
          is_success?: boolean | null
          processed_by?: string | null
          ref_id: string
          ref_type: string
          registration_number?: string | null
          request_hash?: string | null
          request_xml?: string | null
          response_message?: string | null
          response_raw?: string | null
          response_status?: string | null
          retry_allowed?: boolean | null
        }
        Update: {
          attempt_number?: number | null
          created_at?: string | null
          document_number?: string | null
          error_code?: string | null
          error_type?: string | null
          id?: string
          is_success?: boolean | null
          processed_by?: string | null
          ref_id?: string
          ref_type?: string
          registration_number?: string | null
          request_hash?: string | null
          request_xml?: string | null
          response_message?: string | null
          response_raw?: string | null
          response_status?: string | null
          retry_allowed?: boolean | null
        }
        Relationships: []
      }
      ceisa_vehicles: {
        Row: {
          bahan_bakar: string | null
          bea_masuk: number | null
          ceisa_response: Json | null
          created_at: string | null
          id: string
          jenis_kendaraan: string | null
          jumlah_penumpang: number | null
          jumlah_roda: number | null
          jumlah_silinder: number | null
          kapasitas_mesin: number | null
          kondisi: string | null
          mata_uang: string | null
          merek: string | null
          metadata: Json | null
          nama_importir: string | null
          negara_asal: string | null
          nilai_cif: number | null
          nomor_aju: string
          nomor_mesin: string | null
          nomor_pib: string | null
          nomor_rangka: string | null
          npwp_importir: string | null
          pelabuhan_bongkar: string | null
          pelabuhan_muat: string | null
          pph: number | null
          ppn: number | null
          ppnbm: number | null
          source: string | null
          status: string | null
          synced_at: string | null
          tahun_pembuatan: number | null
          tanggal_pib: string | null
          tipe: string | null
          updated_at: string | null
          warna: string | null
        }
        Insert: {
          bahan_bakar?: string | null
          bea_masuk?: number | null
          ceisa_response?: Json | null
          created_at?: string | null
          id?: string
          jenis_kendaraan?: string | null
          jumlah_penumpang?: number | null
          jumlah_roda?: number | null
          jumlah_silinder?: number | null
          kapasitas_mesin?: number | null
          kondisi?: string | null
          mata_uang?: string | null
          merek?: string | null
          metadata?: Json | null
          nama_importir?: string | null
          negara_asal?: string | null
          nilai_cif?: number | null
          nomor_aju: string
          nomor_mesin?: string | null
          nomor_pib?: string | null
          nomor_rangka?: string | null
          npwp_importir?: string | null
          pelabuhan_bongkar?: string | null
          pelabuhan_muat?: string | null
          pph?: number | null
          ppn?: number | null
          ppnbm?: number | null
          source?: string | null
          status?: string | null
          synced_at?: string | null
          tahun_pembuatan?: number | null
          tanggal_pib?: string | null
          tipe?: string | null
          updated_at?: string | null
          warna?: string | null
        }
        Update: {
          bahan_bakar?: string | null
          bea_masuk?: number | null
          ceisa_response?: Json | null
          created_at?: string | null
          id?: string
          jenis_kendaraan?: string | null
          jumlah_penumpang?: number | null
          jumlah_roda?: number | null
          jumlah_silinder?: number | null
          kapasitas_mesin?: number | null
          kondisi?: string | null
          mata_uang?: string | null
          merek?: string | null
          metadata?: Json | null
          nama_importir?: string | null
          negara_asal?: string | null
          nilai_cif?: number | null
          nomor_aju?: string
          nomor_mesin?: string | null
          nomor_pib?: string | null
          nomor_rangka?: string | null
          npwp_importir?: string | null
          pelabuhan_bongkar?: string | null
          pelabuhan_muat?: string | null
          pph?: number | null
          ppn?: number | null
          ppnbm?: number | null
          source?: string | null
          status?: string | null
          synced_at?: string | null
          tahun_pembuatan?: number | null
          tanggal_pib?: string | null
          tipe?: string | null
          updated_at?: string | null
          warna?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          code: string
          country: string | null
          country_id: string | null
          created_at: string | null
          created_by: string | null
          effective_date: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          npwp: string | null
          phone: string | null
          source: string | null
          type: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          country?: string | null
          country_id?: string | null
          created_at?: string | null
          created_by?: string | null
          effective_date?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          npwp?: string | null
          phone?: string | null
          source?: string | null
          type: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          country?: string | null
          country_id?: string | null
          created_at?: string | null
          created_by?: string | null
          effective_date?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          npwp?: string | null
          phone?: string | null
          source?: string | null
          type?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          effective_date: string | null
          id: string
          is_active: boolean | null
          iso_alpha3: string | null
          iso_numeric: string | null
          name: string
          name_en: string | null
          name_local: string | null
          region: string | null
          source: string | null
          sub_region: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          effective_date?: string | null
          id?: string
          is_active?: boolean | null
          iso_alpha3?: string | null
          iso_numeric?: string | null
          name: string
          name_en?: string | null
          name_local?: string | null
          region?: string | null
          source?: string | null
          sub_region?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          effective_date?: string | null
          id?: string
          is_active?: boolean | null
          iso_alpha3?: string | null
          iso_numeric?: string | null
          name?: string
          name_en?: string | null
          name_local?: string | null
          region?: string | null
          source?: string | null
          sub_region?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      currencies: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          exchange_rate: number | null
          id: string
          is_active: boolean | null
          name: string
          rate_date: string | null
          symbol: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          exchange_rate?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          rate_date?: string | null
          symbol?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          exchange_rate?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          rate_date?: string | null
          symbol?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      customs_offices: {
        Row: {
          address: string | null
          city: string | null
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          province: string | null
          source: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          province?: string | null
          source?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          province?: string | null
          source?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      document_hashes: {
        Row: {
          created_at: string | null
          document_number: string | null
          generated_at: string
          generated_by: string | null
          hash_algorithm: string | null
          id: string
          is_immutable: boolean | null
          ref_id: string
          ref_type: string
          xml_hash: string
        }
        Insert: {
          created_at?: string | null
          document_number?: string | null
          generated_at?: string
          generated_by?: string | null
          hash_algorithm?: string | null
          id?: string
          is_immutable?: boolean | null
          ref_id: string
          ref_type: string
          xml_hash: string
        }
        Update: {
          created_at?: string | null
          document_number?: string | null
          generated_at?: string
          generated_by?: string | null
          hash_algorithm?: string | null
          id?: string
          is_immutable?: boolean | null
          ref_id?: string
          ref_type?: string
          xml_hash?: string
        }
        Relationships: []
      }
      edi_xml_metadata: {
        Row: {
          created_at: string | null
          document_number: string | null
          file_size: number | null
          generated_at: string
          generated_by: string | null
          id: string
          ref_id: string
          ref_type: string
          storage_success: boolean | null
          xml_content: string | null
          xml_hash: string
          xml_path: string
        }
        Insert: {
          created_at?: string | null
          document_number?: string | null
          file_size?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          ref_id: string
          ref_type: string
          storage_success?: boolean | null
          xml_content?: string | null
          xml_hash: string
          xml_path: string
        }
        Update: {
          created_at?: string | null
          document_number?: string | null
          file_size?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          ref_id?: string
          ref_type?: string
          storage_success?: boolean | null
          xml_content?: string | null
          xml_hash?: string
          xml_path?: string
        }
        Relationships: []
      }
      hs_codes: {
        Row: {
          bm_rate: number | null
          code: string
          created_at: string | null
          created_by: string | null
          description: string
          description_id: string | null
          effective_date: string | null
          id: string
          is_active: boolean | null
          is_restricted: boolean | null
          name: string | null
          pph_rate: number | null
          ppn_rate: number | null
          source: string | null
          unit: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          bm_rate?: number | null
          code: string
          created_at?: string | null
          created_by?: string | null
          description: string
          description_id?: string | null
          effective_date?: string | null
          id?: string
          is_active?: boolean | null
          is_restricted?: boolean | null
          name?: string | null
          pph_rate?: number | null
          ppn_rate?: number | null
          source?: string | null
          unit?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          bm_rate?: number | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          description_id?: string | null
          effective_date?: string | null
          id?: string
          is_active?: boolean | null
          is_restricted?: boolean | null
          name?: string | null
          pph_rate?: number | null
          ppn_rate?: number | null
          source?: string | null
          unit?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      incoterms: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      master_data_history: {
        Row: {
          action: string
          after_data: Json | null
          before_data: Json | null
          changed_at: string | null
          changed_by: string | null
          changed_by_email: string | null
          id: string
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          after_data?: Json | null
          before_data?: Json | null
          changed_at?: string | null
          changed_by?: string | null
          changed_by_email?: string | null
          id?: string
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          after_data?: Json | null
          before_data?: Json | null
          changed_at?: string | null
          changed_by?: string | null
          changed_by_email?: string | null
          id?: string
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          metadata: Json | null
          new_status: string | null
          nomor_aju: string | null
          old_status: string | null
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          new_status?: string | null
          nomor_aju?: string | null
          old_status?: string | null
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          new_status?: string | null
          nomor_aju?: string | null
          old_status?: string | null
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      packaging: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      peb_attachments: {
        Row: {
          document_name: string
          document_type: string
          file_hash: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          peb_id: string
          status: string | null
          uploaded_at: string | null
          uploaded_by: string | null
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          document_name: string
          document_type: string
          file_hash?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          peb_id: string
          status?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          document_name?: string
          document_type?: string
          file_hash?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          peb_id?: string
          status?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "peb_attachments_peb_id_fkey"
            columns: ["peb_id"]
            isOneToOne: false
            referencedRelation: "peb_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      peb_documents: {
        Row: {
          buyer_address: string | null
          buyer_country: string | null
          buyer_id: string | null
          buyer_name: string | null
          ceisa_last_error: string | null
          ceisa_response: string | null
          ceisa_response_at: string | null
          ceisa_retry_count: number | null
          ceisa_submitted_at: string | null
          created_at: string | null
          created_by: string | null
          currency_code: string | null
          currency_id: string | null
          customs_office_code: string | null
          customs_office_id: string | null
          customs_office_name: string | null
          destination_country: string | null
          destination_port_code: string | null
          destination_port_id: string | null
          destination_port_name: string | null
          document_number: string | null
          eksportir_alamat: string | null
          eksportir_nama: string | null
          eksportir_npwp: string | null
          exchange_rate: number | null
          exporter_address: string | null
          exporter_id: string | null
          exporter_name: string | null
          exporter_npwp: string | null
          freight_value: number | null
          gross_weight: number | null
          id: string
          incoterm_code: string | null
          incoterm_id: string | null
          insurance_value: number | null
          loading_port_code: string | null
          loading_port_id: string | null
          loading_port_name: string | null
          locked: boolean | null
          locked_at: string | null
          locked_by: string | null
          metadata: Json | null
          negara_tujuan: string | null
          net_weight: number | null
          nomor_aju: string | null
          nomor_pendaftaran: string | null
          notes: string | null
          npe_date: string | null
          npe_number: string | null
          package_unit: string | null
          pelabuhan_muat: string | null
          ppjk_id: string | null
          ppjk_name: string | null
          ppjk_npwp: string | null
          registration_date: string | null
          registration_number: string | null
          source: string | null
          status: Database["public"]["Enums"]["peb_status"] | null
          submitted_at: string | null
          submitted_by: string | null
          synced_at: string | null
          tanggal_aju: string | null
          tanggal_pendaftaran: string | null
          total_fob_idr: number | null
          total_fob_value: number | null
          total_nilai_fob: number | null
          total_packages: number | null
          transport_mode: string | null
          updated_at: string | null
          updated_by: string | null
          vessel_name: string | null
          voyage_number: string | null
          xml_content: string | null
        }
        Insert: {
          buyer_address?: string | null
          buyer_country?: string | null
          buyer_id?: string | null
          buyer_name?: string | null
          ceisa_last_error?: string | null
          ceisa_response?: string | null
          ceisa_response_at?: string | null
          ceisa_retry_count?: number | null
          ceisa_submitted_at?: string | null
          created_at?: string | null
          created_by?: string | null
          currency_code?: string | null
          currency_id?: string | null
          customs_office_code?: string | null
          customs_office_id?: string | null
          customs_office_name?: string | null
          destination_country?: string | null
          destination_port_code?: string | null
          destination_port_id?: string | null
          destination_port_name?: string | null
          document_number?: string | null
          eksportir_alamat?: string | null
          eksportir_nama?: string | null
          eksportir_npwp?: string | null
          exchange_rate?: number | null
          exporter_address?: string | null
          exporter_id?: string | null
          exporter_name?: string | null
          exporter_npwp?: string | null
          freight_value?: number | null
          gross_weight?: number | null
          id?: string
          incoterm_code?: string | null
          incoterm_id?: string | null
          insurance_value?: number | null
          loading_port_code?: string | null
          loading_port_id?: string | null
          loading_port_name?: string | null
          locked?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          metadata?: Json | null
          negara_tujuan?: string | null
          net_weight?: number | null
          nomor_aju?: string | null
          nomor_pendaftaran?: string | null
          notes?: string | null
          npe_date?: string | null
          npe_number?: string | null
          package_unit?: string | null
          pelabuhan_muat?: string | null
          ppjk_id?: string | null
          ppjk_name?: string | null
          ppjk_npwp?: string | null
          registration_date?: string | null
          registration_number?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["peb_status"] | null
          submitted_at?: string | null
          submitted_by?: string | null
          synced_at?: string | null
          tanggal_aju?: string | null
          tanggal_pendaftaran?: string | null
          total_fob_idr?: number | null
          total_fob_value?: number | null
          total_nilai_fob?: number | null
          total_packages?: number | null
          transport_mode?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vessel_name?: string | null
          voyage_number?: string | null
          xml_content?: string | null
        }
        Update: {
          buyer_address?: string | null
          buyer_country?: string | null
          buyer_id?: string | null
          buyer_name?: string | null
          ceisa_last_error?: string | null
          ceisa_response?: string | null
          ceisa_response_at?: string | null
          ceisa_retry_count?: number | null
          ceisa_submitted_at?: string | null
          created_at?: string | null
          created_by?: string | null
          currency_code?: string | null
          currency_id?: string | null
          customs_office_code?: string | null
          customs_office_id?: string | null
          customs_office_name?: string | null
          destination_country?: string | null
          destination_port_code?: string | null
          destination_port_id?: string | null
          destination_port_name?: string | null
          document_number?: string | null
          eksportir_alamat?: string | null
          eksportir_nama?: string | null
          eksportir_npwp?: string | null
          exchange_rate?: number | null
          exporter_address?: string | null
          exporter_id?: string | null
          exporter_name?: string | null
          exporter_npwp?: string | null
          freight_value?: number | null
          gross_weight?: number | null
          id?: string
          incoterm_code?: string | null
          incoterm_id?: string | null
          insurance_value?: number | null
          loading_port_code?: string | null
          loading_port_id?: string | null
          loading_port_name?: string | null
          locked?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          metadata?: Json | null
          negara_tujuan?: string | null
          net_weight?: number | null
          nomor_aju?: string | null
          nomor_pendaftaran?: string | null
          notes?: string | null
          npe_date?: string | null
          npe_number?: string | null
          package_unit?: string | null
          pelabuhan_muat?: string | null
          ppjk_id?: string | null
          ppjk_name?: string | null
          ppjk_npwp?: string | null
          registration_date?: string | null
          registration_number?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["peb_status"] | null
          submitted_at?: string | null
          submitted_by?: string | null
          synced_at?: string | null
          tanggal_aju?: string | null
          tanggal_pendaftaran?: string | null
          total_fob_idr?: number | null
          total_fob_value?: number | null
          total_nilai_fob?: number | null
          total_packages?: number | null
          transport_mode?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vessel_name?: string | null
          voyage_number?: string | null
          xml_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "peb_documents_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peb_documents_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peb_documents_customs_office_id_fkey"
            columns: ["customs_office_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peb_documents_destination_port_id_fkey"
            columns: ["destination_port_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peb_documents_exporter_id_fkey"
            columns: ["exporter_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peb_documents_incoterm_id_fkey"
            columns: ["incoterm_id"]
            isOneToOne: false
            referencedRelation: "incoterms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peb_documents_loading_port_id_fkey"
            columns: ["loading_port_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peb_documents_ppjk_id_fkey"
            columns: ["ppjk_id"]
            isOneToOne: false
            referencedRelation: "ppjk"
            referencedColumns: ["id"]
          },
        ]
      }
      peb_items: {
        Row: {
          country_of_origin: string | null
          created_at: string | null
          fob_idr: number | null
          fob_value: number | null
          gross_weight: number | null
          hs_code: string | null
          hs_code_id: string | null
          id: string
          item_number: number
          net_weight: number | null
          notes: string | null
          package_count: number | null
          packaging_code: string | null
          packaging_id: string | null
          peb_id: string
          product_code: string | null
          product_description: string | null
          product_id: string | null
          quantity: number
          quantity_unit: string | null
          total_price: number | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          country_of_origin?: string | null
          created_at?: string | null
          fob_idr?: number | null
          fob_value?: number | null
          gross_weight?: number | null
          hs_code?: string | null
          hs_code_id?: string | null
          id?: string
          item_number: number
          net_weight?: number | null
          notes?: string | null
          package_count?: number | null
          packaging_code?: string | null
          packaging_id?: string | null
          peb_id: string
          product_code?: string | null
          product_description?: string | null
          product_id?: string | null
          quantity?: number
          quantity_unit?: string | null
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          country_of_origin?: string | null
          created_at?: string | null
          fob_idr?: number | null
          fob_value?: number | null
          gross_weight?: number | null
          hs_code?: string | null
          hs_code_id?: string | null
          id?: string
          item_number?: number
          net_weight?: number | null
          notes?: string | null
          package_count?: number | null
          packaging_code?: string | null
          packaging_id?: string | null
          peb_id?: string
          product_code?: string | null
          product_description?: string | null
          product_id?: string | null
          quantity?: number
          quantity_unit?: string | null
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "peb_items_hs_code_id_fkey"
            columns: ["hs_code_id"]
            isOneToOne: false
            referencedRelation: "hs_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peb_items_packaging_id_fkey"
            columns: ["packaging_id"]
            isOneToOne: false
            referencedRelation: "packaging"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peb_items_peb_id_fkey"
            columns: ["peb_id"]
            isOneToOne: false
            referencedRelation: "peb_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peb_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      peb_status_history: {
        Row: {
          changed_by: string | null
          changed_by_email: string | null
          created_at: string | null
          from_status: Database["public"]["Enums"]["peb_status"] | null
          id: string
          notes: string | null
          peb_id: string
          to_status: Database["public"]["Enums"]["peb_status"]
        }
        Insert: {
          changed_by?: string | null
          changed_by_email?: string | null
          created_at?: string | null
          from_status?: Database["public"]["Enums"]["peb_status"] | null
          id?: string
          notes?: string | null
          peb_id: string
          to_status: Database["public"]["Enums"]["peb_status"]
        }
        Update: {
          changed_by?: string | null
          changed_by_email?: string | null
          created_at?: string | null
          from_status?: Database["public"]["Enums"]["peb_status"] | null
          id?: string
          notes?: string | null
          peb_id?: string
          to_status?: Database["public"]["Enums"]["peb_status"]
        }
        Relationships: [
          {
            foreignKeyName: "peb_status_history_peb_id_fkey"
            columns: ["peb_id"]
            isOneToOne: false
            referencedRelation: "peb_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      pib_attachments: {
        Row: {
          document_name: string
          document_type: string
          file_hash: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          pib_id: string
          status: string | null
          uploaded_at: string | null
          uploaded_by: string | null
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          document_name: string
          document_type: string
          file_hash?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          pib_id: string
          status?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          document_name?: string
          document_type?: string
          file_hash?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          pib_id?: string
          status?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pib_attachments_pib_id_fkey"
            columns: ["pib_id"]
            isOneToOne: false
            referencedRelation: "pib_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      pib_documents: {
        Row: {
          bl_awb_date: string | null
          bl_awb_number: string | null
          ceisa_last_error: string | null
          ceisa_response: string | null
          ceisa_response_at: string | null
          ceisa_retry_count: number | null
          ceisa_submitted_at: string | null
          created_at: string | null
          created_by: string | null
          currency_code: string | null
          currency_id: string | null
          customs_office_code: string | null
          customs_office_id: string | null
          customs_office_name: string | null
          discharge_port_code: string | null
          discharge_port_id: string | null
          discharge_port_name: string | null
          document_number: string | null
          exchange_rate: number | null
          fob_value: number | null
          freight_value: number | null
          gross_weight: number | null
          id: string
          importer_address: string | null
          importer_api: string | null
          importer_id: string | null
          importer_name: string | null
          importer_npwp: string | null
          importir_alamat: string | null
          importir_nama: string | null
          importir_npwp: string | null
          incoterm_code: string | null
          incoterm_id: string | null
          insurance_value: number | null
          lane: Database["public"]["Enums"]["pib_lane"] | null
          loading_country: string | null
          loading_port_code: string | null
          loading_port_id: string | null
          loading_port_name: string | null
          locked: boolean | null
          locked_at: string | null
          locked_by: string | null
          metadata: Json | null
          nama_importir: string | null
          net_weight: number | null
          nilai_cif: number | null
          nomor_aju: string | null
          nomor_pendaftaran: string | null
          notes: string | null
          package_unit: string | null
          ppjk_id: string | null
          ppjk_name: string | null
          ppjk_npwp: string | null
          registration_date: string | null
          registration_number: string | null
          source: string | null
          sppb_date: string | null
          sppb_number: string | null
          status: Database["public"]["Enums"]["pib_status"] | null
          submitted_at: string | null
          submitted_by: string | null
          supplier_address: string | null
          supplier_country: string | null
          supplier_id: string | null
          supplier_name: string | null
          synced_at: string | null
          tanggal_aju: string | null
          tanggal_pendaftaran: string | null
          total_bea_masuk: number | null
          total_bm: number | null
          total_cif_idr: number | null
          total_cif_value: number | null
          total_nilai_pabean: number | null
          total_packages: number | null
          total_pph: number | null
          total_ppn: number | null
          total_tax: number | null
          transport_mode: string | null
          updated_at: string | null
          updated_by: string | null
          vessel_name: string | null
          voyage_number: string | null
          xml_content: string | null
          xml_hash: string | null
        }
        Insert: {
          bl_awb_date?: string | null
          bl_awb_number?: string | null
          ceisa_last_error?: string | null
          ceisa_response?: string | null
          ceisa_response_at?: string | null
          ceisa_retry_count?: number | null
          ceisa_submitted_at?: string | null
          created_at?: string | null
          created_by?: string | null
          currency_code?: string | null
          currency_id?: string | null
          customs_office_code?: string | null
          customs_office_id?: string | null
          customs_office_name?: string | null
          discharge_port_code?: string | null
          discharge_port_id?: string | null
          discharge_port_name?: string | null
          document_number?: string | null
          exchange_rate?: number | null
          fob_value?: number | null
          freight_value?: number | null
          gross_weight?: number | null
          id?: string
          importer_address?: string | null
          importer_api?: string | null
          importer_id?: string | null
          importer_name?: string | null
          importer_npwp?: string | null
          importir_alamat?: string | null
          importir_nama?: string | null
          importir_npwp?: string | null
          incoterm_code?: string | null
          incoterm_id?: string | null
          insurance_value?: number | null
          lane?: Database["public"]["Enums"]["pib_lane"] | null
          loading_country?: string | null
          loading_port_code?: string | null
          loading_port_id?: string | null
          loading_port_name?: string | null
          locked?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          metadata?: Json | null
          nama_importir?: string | null
          net_weight?: number | null
          nilai_cif?: number | null
          nomor_aju?: string | null
          nomor_pendaftaran?: string | null
          notes?: string | null
          package_unit?: string | null
          ppjk_id?: string | null
          ppjk_name?: string | null
          ppjk_npwp?: string | null
          registration_date?: string | null
          registration_number?: string | null
          source?: string | null
          sppb_date?: string | null
          sppb_number?: string | null
          status?: Database["public"]["Enums"]["pib_status"] | null
          submitted_at?: string | null
          submitted_by?: string | null
          supplier_address?: string | null
          supplier_country?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          synced_at?: string | null
          tanggal_aju?: string | null
          tanggal_pendaftaran?: string | null
          total_bea_masuk?: number | null
          total_bm?: number | null
          total_cif_idr?: number | null
          total_cif_value?: number | null
          total_nilai_pabean?: number | null
          total_packages?: number | null
          total_pph?: number | null
          total_ppn?: number | null
          total_tax?: number | null
          transport_mode?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vessel_name?: string | null
          voyage_number?: string | null
          xml_content?: string | null
          xml_hash?: string | null
        }
        Update: {
          bl_awb_date?: string | null
          bl_awb_number?: string | null
          ceisa_last_error?: string | null
          ceisa_response?: string | null
          ceisa_response_at?: string | null
          ceisa_retry_count?: number | null
          ceisa_submitted_at?: string | null
          created_at?: string | null
          created_by?: string | null
          currency_code?: string | null
          currency_id?: string | null
          customs_office_code?: string | null
          customs_office_id?: string | null
          customs_office_name?: string | null
          discharge_port_code?: string | null
          discharge_port_id?: string | null
          discharge_port_name?: string | null
          document_number?: string | null
          exchange_rate?: number | null
          fob_value?: number | null
          freight_value?: number | null
          gross_weight?: number | null
          id?: string
          importer_address?: string | null
          importer_api?: string | null
          importer_id?: string | null
          importer_name?: string | null
          importer_npwp?: string | null
          importir_alamat?: string | null
          importir_nama?: string | null
          importir_npwp?: string | null
          incoterm_code?: string | null
          incoterm_id?: string | null
          insurance_value?: number | null
          lane?: Database["public"]["Enums"]["pib_lane"] | null
          loading_country?: string | null
          loading_port_code?: string | null
          loading_port_id?: string | null
          loading_port_name?: string | null
          locked?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          metadata?: Json | null
          nama_importir?: string | null
          net_weight?: number | null
          nilai_cif?: number | null
          nomor_aju?: string | null
          nomor_pendaftaran?: string | null
          notes?: string | null
          package_unit?: string | null
          ppjk_id?: string | null
          ppjk_name?: string | null
          ppjk_npwp?: string | null
          registration_date?: string | null
          registration_number?: string | null
          source?: string | null
          sppb_date?: string | null
          sppb_number?: string | null
          status?: Database["public"]["Enums"]["pib_status"] | null
          submitted_at?: string | null
          submitted_by?: string | null
          supplier_address?: string | null
          supplier_country?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          synced_at?: string | null
          tanggal_aju?: string | null
          tanggal_pendaftaran?: string | null
          total_bea_masuk?: number | null
          total_bm?: number | null
          total_cif_idr?: number | null
          total_cif_value?: number | null
          total_nilai_pabean?: number | null
          total_packages?: number | null
          total_pph?: number | null
          total_ppn?: number | null
          total_tax?: number | null
          transport_mode?: string | null
          updated_at?: string | null
          updated_by?: string | null
          vessel_name?: string | null
          voyage_number?: string | null
          xml_content?: string | null
          xml_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pib_documents_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pib_documents_customs_office_id_fkey"
            columns: ["customs_office_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pib_documents_discharge_port_id_fkey"
            columns: ["discharge_port_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pib_documents_importer_id_fkey"
            columns: ["importer_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pib_documents_incoterm_id_fkey"
            columns: ["incoterm_id"]
            isOneToOne: false
            referencedRelation: "incoterms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pib_documents_loading_port_id_fkey"
            columns: ["loading_port_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pib_documents_ppjk_id_fkey"
            columns: ["ppjk_id"]
            isOneToOne: false
            referencedRelation: "ppjk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pib_documents_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      pib_items: {
        Row: {
          bm_amount: number | null
          bm_rate: number | null
          cif_idr: number | null
          cif_value: number | null
          country_of_origin: string | null
          created_at: string | null
          gross_weight: number | null
          hs_code: string | null
          hs_code_id: string | null
          id: string
          item_number: number
          net_weight: number | null
          notes: string | null
          package_count: number | null
          packaging_code: string | null
          packaging_id: string | null
          pib_id: string
          pph_amount: number | null
          pph_rate: number | null
          ppn_amount: number | null
          ppn_rate: number | null
          product_code: string | null
          product_description: string | null
          product_id: string | null
          quantity: number
          quantity_unit: string | null
          total_price: number | null
          total_tax: number | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          bm_amount?: number | null
          bm_rate?: number | null
          cif_idr?: number | null
          cif_value?: number | null
          country_of_origin?: string | null
          created_at?: string | null
          gross_weight?: number | null
          hs_code?: string | null
          hs_code_id?: string | null
          id?: string
          item_number: number
          net_weight?: number | null
          notes?: string | null
          package_count?: number | null
          packaging_code?: string | null
          packaging_id?: string | null
          pib_id: string
          pph_amount?: number | null
          pph_rate?: number | null
          ppn_amount?: number | null
          ppn_rate?: number | null
          product_code?: string | null
          product_description?: string | null
          product_id?: string | null
          quantity?: number
          quantity_unit?: string | null
          total_price?: number | null
          total_tax?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          bm_amount?: number | null
          bm_rate?: number | null
          cif_idr?: number | null
          cif_value?: number | null
          country_of_origin?: string | null
          created_at?: string | null
          gross_weight?: number | null
          hs_code?: string | null
          hs_code_id?: string | null
          id?: string
          item_number?: number
          net_weight?: number | null
          notes?: string | null
          package_count?: number | null
          packaging_code?: string | null
          packaging_id?: string | null
          pib_id?: string
          pph_amount?: number | null
          pph_rate?: number | null
          ppn_amount?: number | null
          ppn_rate?: number | null
          product_code?: string | null
          product_description?: string | null
          product_id?: string | null
          quantity?: number
          quantity_unit?: string | null
          total_price?: number | null
          total_tax?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pib_items_hs_code_id_fkey"
            columns: ["hs_code_id"]
            isOneToOne: false
            referencedRelation: "hs_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pib_items_packaging_id_fkey"
            columns: ["packaging_id"]
            isOneToOne: false
            referencedRelation: "packaging"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pib_items_pib_id_fkey"
            columns: ["pib_id"]
            isOneToOne: false
            referencedRelation: "pib_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pib_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pib_status_history: {
        Row: {
          changed_by: string | null
          changed_by_email: string | null
          created_at: string | null
          from_status: Database["public"]["Enums"]["pib_status"] | null
          id: string
          lane: Database["public"]["Enums"]["pib_lane"] | null
          notes: string | null
          pib_id: string
          to_status: Database["public"]["Enums"]["pib_status"]
        }
        Insert: {
          changed_by?: string | null
          changed_by_email?: string | null
          created_at?: string | null
          from_status?: Database["public"]["Enums"]["pib_status"] | null
          id?: string
          lane?: Database["public"]["Enums"]["pib_lane"] | null
          notes?: string | null
          pib_id: string
          to_status: Database["public"]["Enums"]["pib_status"]
        }
        Update: {
          changed_by?: string | null
          changed_by_email?: string | null
          created_at?: string | null
          from_status?: Database["public"]["Enums"]["pib_status"] | null
          id?: string
          lane?: Database["public"]["Enums"]["pib_lane"] | null
          notes?: string | null
          pib_id?: string
          to_status?: Database["public"]["Enums"]["pib_status"]
        }
        Relationships: [
          {
            foreignKeyName: "pib_status_history_pib_id_fkey"
            columns: ["pib_id"]
            isOneToOne: false
            referencedRelation: "pib_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      ports: {
        Row: {
          code: string
          country_code: string | null
          country_id: string | null
          created_at: string | null
          created_by: string | null
          customs_office: string | null
          customs_office_code: string | null
          customs_office_id: string | null
          id: string
          is_active: boolean | null
          name: string
          port_code: string | null
          port_name: string | null
          source: string | null
          type: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          code: string
          country_code?: string | null
          country_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customs_office?: string | null
          customs_office_code?: string | null
          customs_office_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          port_code?: string | null
          port_name?: string | null
          source?: string | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          code?: string
          country_code?: string | null
          country_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customs_office?: string | null
          customs_office_code?: string | null
          customs_office_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          port_code?: string | null
          port_name?: string | null
          source?: string | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ports_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ports_customs_office_id_fkey"
            columns: ["customs_office_id"]
            isOneToOne: false
            referencedRelation: "customs_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      ppjk: {
        Row: {
          address: string | null
          city: string | null
          code: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          license_expiry: string | null
          license_number: string | null
          name: string
          nib: string | null
          npwp: string | null
          phone: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          license_expiry?: string | null
          license_number?: string | null
          name: string
          nib?: string | null
          npwp?: string | null
          phone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          license_expiry?: string | null
          license_number?: string | null
          name?: string
          nib?: string | null
          npwp?: string | null
          phone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          hs_code_id: string | null
          id: string
          is_active: boolean | null
          name: string
          unit: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          hs_code_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          unit?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          hs_code_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          unit?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_hs_code_id_fkey"
            columns: ["hs_code_id"]
            isOneToOne: false
            referencedRelation: "hs_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      status_counts_cache: {
        Row: {
          count: number | null
          id: string
          status_name: string
          updated_at: string | null
        }
        Insert: {
          count?: number | null
          id?: string
          status_name: string
          updated_at?: string | null
        }
        Update: {
          count?: number | null
          id?: string
          status_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          code: string
          country: string | null
          country_id: string | null
          created_at: string | null
          created_by: string | null
          effective_date: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          source: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          code: string
          country?: string | null
          country_id?: string | null
          created_at?: string | null
          created_by?: string | null
          effective_date?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          source?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          country?: string | null
          country_id?: string | null
          created_at?: string | null
          created_by?: string | null
          effective_date?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          source?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      supporting_documents: {
        Row: {
          created_at: string | null
          created_by: string | null
          doc_date: string | null
          doc_no: string | null
          doc_type: string | null
          file_hash: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          mime_type: string | null
          notes: string | null
          ref_id: string
          ref_type: string
          status: string | null
          updated_at: string | null
          validated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          doc_date?: string | null
          doc_no?: string | null
          doc_type?: string | null
          file_hash?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          ref_id: string
          ref_type: string
          status?: string | null
          updated_at?: string | null
          validated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          doc_date?: string | null
          doc_no?: string | null
          doc_type?: string | null
          file_hash?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          ref_id?: string
          ref_type?: string
          status?: string | null
          updated_at?: string | null
          validated_at?: string | null
        }
        Relationships: []
      }
      transport_modes: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          requires_vessel: boolean | null
          requires_voyage: boolean | null
          source: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          requires_vessel?: boolean | null
          requires_voyage?: boolean | null
          source?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          requires_vessel?: boolean | null
          requires_voyage?: boolean | null
          source?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          image: string | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          token_identifier: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          image?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          token_identifier: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          image?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          token_identifier?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      voluntary_declarations: {
        Row: {
          alamat: string | null
          catatan: string | null
          created_at: string | null
          created_by: string | null
          id: string
          jenis_deklarasi: string | null
          kantor_pabean: string | null
          kode_kantor: string | null
          mata_uang: string | null
          metadata: Json | null
          nama_perusahaan: string | null
          nilai_barang: number | null
          nomor_aju: string
          npwp: string | null
          status: string | null
          tanggal: string
          updated_at: string | null
          updated_by: string | null
          uraian: string | null
        }
        Insert: {
          alamat?: string | null
          catatan?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          jenis_deklarasi?: string | null
          kantor_pabean?: string | null
          kode_kantor?: string | null
          mata_uang?: string | null
          metadata?: Json | null
          nama_perusahaan?: string | null
          nilai_barang?: number | null
          nomor_aju: string
          npwp?: string | null
          status?: string | null
          tanggal: string
          updated_at?: string | null
          updated_by?: string | null
          uraian?: string | null
        }
        Update: {
          alamat?: string | null
          catatan?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          jenis_deklarasi?: string | null
          kantor_pabean?: string | null
          kode_kantor?: string | null
          mata_uang?: string | null
          metadata?: Json | null
          nama_perusahaan?: string | null
          nilai_barang?: number | null
          nomor_aju?: string
          npwp?: string | null
          status?: string | null
          tanggal?: string
          updated_at?: string | null
          updated_by?: string | null
          uraian?: string | null
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          address: string | null
          city: string | null
          code: string
          created_at: string | null
          created_by: string | null
          customs_office: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          created_at?: string | null
          created_by?: string | null
          customs_office?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          customs_office?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_country_iso_alpha2: { Args: { country_id: string }; Returns: string }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      peb_status:
        | "DRAFT"
        | "SUBMITTED"
        | "SENT_TO_PPJK"
        | "CEISA_ACCEPTED"
        | "CEISA_REJECTED"
        | "NPE_ISSUED"
        | "COMPLETED"
      pib_lane: "GREEN" | "YELLOW" | "RED"
      pib_status:
        | "DRAFT"
        | "SUBMITTED"
        | "SENT_TO_PPJK"
        | "CEISA_ACCEPTED"
        | "CEISA_REJECTED"
        | "SPPB_ISSUED"
        | "COMPLETED"
      user_role:
        | "export_staff"
        | "import_staff"
        | "finance"
        | "viewer"
        | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      peb_status: [
        "DRAFT",
        "SUBMITTED",
        "SENT_TO_PPJK",
        "CEISA_ACCEPTED",
        "CEISA_REJECTED",
        "NPE_ISSUED",
        "COMPLETED",
      ],
      pib_lane: ["GREEN", "YELLOW", "RED"],
      pib_status: [
        "DRAFT",
        "SUBMITTED",
        "SENT_TO_PPJK",
        "CEISA_ACCEPTED",
        "CEISA_REJECTED",
        "SPPB_ISSUED",
        "COMPLETED",
      ],
      user_role: [
        "export_staff",
        "import_staff",
        "finance",
        "viewer",
        "super_admin",
      ],
    },
  },
} as const
