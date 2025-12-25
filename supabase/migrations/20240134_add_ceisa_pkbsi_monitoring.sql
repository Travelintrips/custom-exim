CREATE TABLE IF NOT EXISTS ceisa_pkbsi (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nomor_aju VARCHAR(50) NOT NULL,
    nomor_dokumen VARCHAR(50) NOT NULL,
    tanggal_dokumen DATE,
    jenis_barang_strategis VARCHAR(100),
    hs_code VARCHAR(20),
    uraian_barang TEXT,
    jumlah NUMERIC(18, 4) DEFAULT 0,
    satuan VARCHAR(20),
    nilai_barang NUMERIC(18, 2) DEFAULT 0,
    mata_uang VARCHAR(10) DEFAULT 'USD',
    negara_asal VARCHAR(100),
    nama_eksportir VARCHAR(255),
    nama_importir VARCHAR(255),
    npwp_importir VARCHAR(30),
    instansi_pengawas VARCHAR(255),
    nomor_rekomendasi VARCHAR(100),
    tanggal_rekomendasi DATE,
    masa_berlaku_rekomendasi DATE,
    kategori_lartas VARCHAR(100),
    status_lartas VARCHAR(50),
    keterangan TEXT,
    status VARCHAR(30) DEFAULT 'PENDING',
    metadata JSONB,
    ceisa_response JSONB,
    synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ceisa_pkbsi_nomor_aju ON ceisa_pkbsi(nomor_aju);
CREATE INDEX IF NOT EXISTS idx_ceisa_pkbsi_nomor_dokumen ON ceisa_pkbsi(nomor_dokumen);
CREATE INDEX IF NOT EXISTS idx_ceisa_pkbsi_npwp_importir ON ceisa_pkbsi(npwp_importir);
CREATE INDEX IF NOT EXISTS idx_ceisa_pkbsi_status ON ceisa_pkbsi(status);

CREATE TABLE IF NOT EXISTS ceisa_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nomor_aju VARCHAR(50) NOT NULL UNIQUE,
    jenis_dokumen VARCHAR(50),
    tanggal_pengajuan TIMESTAMP WITH TIME ZONE,
    tanggal_kirim_ceisa TIMESTAMP WITH TIME ZONE,
    tanggal_respon_ceisa TIMESTAMP WITH TIME ZONE,
    waktu_respon_detik INTEGER,
    status_terakhir VARCHAR(50),
    status_detail VARCHAR(100),
    kode_respon VARCHAR(20),
    pesan_respon TEXT,
    keterangan_penolakan TEXT,
    alasan_penolakan TEXT,
    saran_perbaikan TEXT,
    nomor_response VARCHAR(100),
    nama_petugas VARCHAR(255),
    kantor_pabean VARCHAR(100),
    jumlah_retry INTEGER DEFAULT 0,
    retry_terakhir TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    request_log JSONB,
    response_log JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ceisa_documents_nomor_aju ON ceisa_documents(nomor_aju);
CREATE INDEX IF NOT EXISTS idx_ceisa_documents_status ON ceisa_documents(status_terakhir);
CREATE INDEX IF NOT EXISTS idx_ceisa_documents_tanggal_kirim ON ceisa_documents(tanggal_kirim_ceisa);
CREATE INDEX IF NOT EXISTS idx_ceisa_documents_jenis_dokumen ON ceisa_documents(jenis_dokumen);
