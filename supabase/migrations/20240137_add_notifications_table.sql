CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    reference_type VARCHAR(50),
    reference_id VARCHAR(100),
    nomor_aju VARCHAR(50),
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE OR REPLACE FUNCTION create_status_change_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status_terakhir IS DISTINCT FROM NEW.status_terakhir THEN
        INSERT INTO notifications (
            type,
            title,
            message,
            reference_type,
            reference_id,
            nomor_aju,
            old_status,
            new_status,
            metadata
        ) VALUES (
            'STATUS_CHANGE',
            CASE 
                WHEN NEW.status_terakhir = 'APPROVED' THEN 'Dokumen Disetujui CEISA'
                WHEN NEW.status_terakhir = 'REJECTED' THEN 'Dokumen Ditolak CEISA'
                WHEN NEW.status_terakhir = 'SUBMITTED' THEN 'Dokumen Terkirim ke CEISA'
                WHEN NEW.status_terakhir = 'PENDING' THEN 'Dokumen Menunggu Review'
                ELSE 'Status Dokumen Berubah'
            END,
            CASE 
                WHEN NEW.status_terakhir = 'APPROVED' THEN NEW.jenis_dokumen || ' ' || NEW.nomor_aju || ' telah disetujui CEISA'
                WHEN NEW.status_terakhir = 'REJECTED' THEN NEW.jenis_dokumen || ' ' || NEW.nomor_aju || ' ditolak: ' || COALESCE(NEW.keterangan_penolakan, 'Alasan tidak tersedia')
                WHEN NEW.status_terakhir = 'SUBMITTED' THEN NEW.jenis_dokumen || ' ' || NEW.nomor_aju || ' berhasil dikirim ke CEISA'
                WHEN NEW.status_terakhir = 'PENDING' THEN NEW.jenis_dokumen || ' ' || NEW.nomor_aju || ' sedang menunggu review'
                ELSE NEW.jenis_dokumen || ' ' || NEW.nomor_aju || ' status berubah menjadi ' || NEW.status_terakhir
            END,
            'ceisa_monitoring',
            NEW.id::text,
            NEW.nomor_aju,
            OLD.status_terakhir,
            NEW.status_terakhir,
            jsonb_build_object(
                'jenis_dokumen', NEW.jenis_dokumen,
                'kantor_pabean', NEW.kantor_pabean,
                'nama_petugas', NEW.nama_petugas,
                'keterangan_penolakan', NEW.keterangan_penolakan
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_monitoring_status_change ON ceisa_monitoring;
CREATE TRIGGER trigger_monitoring_status_change
    AFTER UPDATE ON ceisa_monitoring
    FOR EACH ROW
    EXECUTE FUNCTION create_status_change_notification();

CREATE TABLE IF NOT EXISTS status_counts_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL UNIQUE,
    count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO status_counts_cache (status_name, count) VALUES 
    ('SUBMITTED', 0),
    ('APPROVED', 0),
    ('REJECTED', 0),
    ('PENDING', 0)
ON CONFLICT (status_name) DO NOTHING;
