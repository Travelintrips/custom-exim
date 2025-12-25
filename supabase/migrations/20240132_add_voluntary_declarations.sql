CREATE TABLE IF NOT EXISTS voluntary_declarations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nomor_aju VARCHAR(50) NOT NULL UNIQUE,
    tanggal DATE NOT NULL,
    npwp VARCHAR(30),
    nama_perusahaan VARCHAR(255),
    alamat TEXT,
    jenis_deklarasi VARCHAR(50),
    uraian TEXT,
    nilai_barang NUMERIC(18, 2) DEFAULT 0,
    mata_uang VARCHAR(10) DEFAULT 'IDR',
    status VARCHAR(30) DEFAULT 'DRAFT',
    kantor_pabean VARCHAR(100),
    kode_kantor VARCHAR(20),
    catatan TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_voluntary_declarations_nomor_aju ON voluntary_declarations(nomor_aju);
CREATE INDEX IF NOT EXISTS idx_voluntary_declarations_npwp ON voluntary_declarations(npwp);
CREATE INDEX IF NOT EXISTS idx_voluntary_declarations_status ON voluntary_declarations(status);
CREATE INDEX IF NOT EXISTS idx_voluntary_declarations_tanggal ON voluntary_declarations(tanggal);
