CREATE TABLE IF NOT EXISTS ceisa_manifests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nomor_aju VARCHAR(50) NOT NULL,
    nomor_manifest VARCHAR(50),
    tanggal_manifest DATE,
    nama_kapal VARCHAR(255),
    bendera VARCHAR(50),
    voyage_number VARCHAR(50),
    pelabuhan_asal VARCHAR(100),
    pelabuhan_tujuan VARCHAR(100),
    tanggal_tiba DATE,
    jumlah_kontainer INTEGER DEFAULT 0,
    jumlah_kemasan INTEGER DEFAULT 0,
    berat_kotor NUMERIC(18, 4) DEFAULT 0,
    berat_bersih NUMERIC(18, 4) DEFAULT 0,
    satuan_berat VARCHAR(20) DEFAULT 'KG',
    jenis_kemasan VARCHAR(100),
    nama_pengirim VARCHAR(255),
    nama_penerima VARCHAR(255),
    npwp_penerima VARCHAR(30),
    status VARCHAR(30) DEFAULT 'PENDING',
    xml_content TEXT,
    metadata JSONB,
    ceisa_response JSONB,
    synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ceisa_manifests_nomor_aju ON ceisa_manifests(nomor_aju);
CREATE INDEX IF NOT EXISTS idx_ceisa_manifests_nomor_manifest ON ceisa_manifests(nomor_manifest);
CREATE INDEX IF NOT EXISTS idx_ceisa_manifests_tanggal_tiba ON ceisa_manifests(tanggal_tiba);
CREATE INDEX IF NOT EXISTS idx_ceisa_manifests_npwp_penerima ON ceisa_manifests(npwp_penerima);

CREATE TABLE IF NOT EXISTS ceisa_kendaraan (
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
    metadata JSONB,
    ceisa_response JSONB,
    synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ceisa_kendaraan_nomor_aju ON ceisa_kendaraan(nomor_aju);
CREATE INDEX IF NOT EXISTS idx_ceisa_kendaraan_nomor_pib ON ceisa_kendaraan(nomor_pib);
CREATE INDEX IF NOT EXISTS idx_ceisa_kendaraan_nomor_rangka ON ceisa_kendaraan(nomor_rangka);
CREATE INDEX IF NOT EXISTS idx_ceisa_kendaraan_npwp_importir ON ceisa_kendaraan(npwp_importir);
