ALTER TABLE IF EXISTS ceisa_documents RENAME TO ceisa_monitoring;

CREATE TABLE IF NOT EXISTS ceisa_vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nomor_aju VARCHAR(50) NOT NULL,
    nomor_pib VARCHAR(50),
    tanggal_pib DATE,
    jenis_kendaraan VARCHAR(100),
    merek VARCHAR(100),
    tipe VARCHAR(100),
    tahun_pembuatan INTEGER,
    nomor_rangka VARCHAR(100),
    nomor_mesin VARCHAR(100),
    kapasitas_mesin INTEGER,
    warna VARCHAR(50),
    jumlah_roda INTEGER,
    jumlah_silinder INTEGER,
    jumlah_penumpang INTEGER,
    bahan_bakar VARCHAR(50),
    kondisi VARCHAR(50),
    nilai_cif NUMERIC(18, 2) DEFAULT 0,
    mata_uang VARCHAR(10) DEFAULT 'USD',
    bea_masuk NUMERIC(18, 2) DEFAULT 0,
    ppn NUMERIC(18, 2) DEFAULT 0,
    ppnbm NUMERIC(18, 2) DEFAULT 0,
    pph NUMERIC(18, 2) DEFAULT 0,
    nama_importir VARCHAR(255),
    npwp_importir VARCHAR(30),
    negara_asal VARCHAR(100),
    pelabuhan_muat VARCHAR(100),
    pelabuhan_bongkar VARCHAR(100),
    status VARCHAR(30) DEFAULT 'PENDING',
    source VARCHAR(20) DEFAULT 'MANUAL',
    metadata JSONB,
    ceisa_response JSONB,
    synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ceisa_vehicles_nomor_aju ON ceisa_vehicles(nomor_aju);
CREATE INDEX IF NOT EXISTS idx_ceisa_vehicles_nomor_rangka ON ceisa_vehicles(nomor_rangka);

INSERT INTO ceisa_vehicles (
    nomor_aju, nomor_pib, tanggal_pib, jenis_kendaraan, merek, tipe, tahun_pembuatan,
    nomor_rangka, nomor_mesin, kapasitas_mesin, warna, jumlah_roda, jumlah_silinder,
    jumlah_penumpang, bahan_bakar, kondisi, nilai_cif, mata_uang, bea_masuk, ppn, ppnbm, pph,
    nama_importir, npwp_importir, negara_asal, pelabuhan_muat, pelabuhan_bongkar, status,
    source, metadata, ceisa_response, synced_at
)
SELECT 
    nomor_aju, nomor_pib, tanggal_pib, jenis_kendaraan, merek, tipe, tahun_pembuatan,
    nomor_rangka, nomor_mesin, kapasitas_mesin, warna, jumlah_roda, jumlah_silinder,
    jumlah_penumpang, bahan_bakar, kondisi, nilai_cif, mata_uang, bea_masuk, ppn, ppnbm, pph,
    nama_importir, npwp_importir, negara_asal, pelabuhan_muat, pelabuhan_bongkar, status,
    source, metadata, ceisa_response, synced_at
FROM ceisa_kendaraan
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS ceisa_comparisons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nomor_aju VARCHAR(50) NOT NULL UNIQUE,
    pib_jumlah_kemasan INTEGER DEFAULT 0,
    manifest_jumlah_kemasan INTEGER DEFAULT 0,
    selisih_kemasan INTEGER DEFAULT 0,
    pib_berat NUMERIC(18, 4) DEFAULT 0,
    manifest_berat NUMERIC(18, 4) DEFAULT 0,
    selisih_berat NUMERIC(18, 4) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'NO_MANIFEST',
    pib_data JSONB,
    manifest_data JSONB,
    source VARCHAR(20) DEFAULT 'MANUAL',
    synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ceisa_comparisons_nomor_aju ON ceisa_comparisons(nomor_aju);
CREATE INDEX IF NOT EXISTS idx_ceisa_comparisons_status ON ceisa_comparisons(status);
