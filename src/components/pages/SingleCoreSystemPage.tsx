import { AppLayout } from '../layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  FileText, 
  Download, 
  Eye, 
  RefreshCw,
  Plus,
  Ship,
  Package,
  Car,
  Users,
  BarChart3,
  FileCheck,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchAndSaveManifest, ManifestFetchParams } from '@/lib/edi/manifest-fetch';
import { fetchAndSaveKendaraan, KendaraanFetchParams } from '@/lib/edi/kendaraan-fetch';
import { fetchAndSavePKBSI, PKBSIFetchParams } from '@/lib/edi/pkbsi-fetch';
import { syncCeisaDocuments, SyncAllResult, syncCeisaByTable, testCeisaConnection } from '@/lib/edi/ceisa-sync-service';
import { Badge } from '@/components/ui/badge';
import { MobileCardView, ResponsiveDataView } from '@/components/ui/mobile-card-view';

// Interfaces
interface DocumentPabean {
  id: string;
  nomor_aju: string;
  tanggal_aju: string;
  jenis_dokumen: string;
  pelabuhan_tujuan: string;
  kantor_pabean: string;
  kode_kantor: string;
  cara_pembayaran: string;
  jenis_pib: string;
  jenis_impor: string;
  keterangan_lain: string;
  status: string;
  created_at: string;
}

interface VoluntaryDeclaration {
  id: string;
  nomor_aju: string;
  tanggal: string;
  npwp: string;
  nama_perusahaan: string;
  alamat: string;
  jenis_deklarasi: string;
  uraian: string;
  nilai_barang: number;
  mata_uang: string;
  status: string;
  kantor_pabean: string;
  kode_kantor: string;
  catatan: string;
  created_at: string;
}

interface KantorPabean {
  id: string;
  kode_kantor: string;
  nama_kantor: string;
  kode_pelabuhan: string;
}

interface ManifestData {
  id: string;
  nomor_aju: string;
  nomor_manifest: string;
  tanggal_manifest: string;
  nama_kapal: string;
  bendera: string;
  voyage_number: string;
  pelabuhan_asal: string;
  pelabuhan_tujuan: string;
  tanggal_tiba: string;
  jumlah_kontainer: number;
  jumlah_kemasan: number;
  berat_kotor: number;
  berat_bersih: number;
  satuan_berat: string;
  jenis_kemasan: string;
  nama_pengirim: string;
  nama_penerima: string;
  npwp_penerima: string;
  status: string;
  synced_at: string;
}

interface KendaraanData {
  id: string;
  nomor_aju: string;
  nomor_pib: string;
  tanggal_pib: string;
  jenis_kendaraan: string;
  merek: string;
  tipe: string;
  tahun_pembuatan: number;
  nomor_rangka: string;
  nomor_mesin: string;
  kapasitas_mesin: number;
  warna: string;
  jumlah_roda: number;
  jumlah_silinder: number;
  jumlah_penumpang: number;
  bahan_bakar: string;
  kondisi: string;
  nilai_cif: number;
  mata_uang: string;
  bea_masuk: number;
  ppn: number;
  ppnbm: number;
  pph: number;
  nama_importir: string;
  npwp_importir: string;
  negara_asal: string;
  pelabuhan_muat: string;
  pelabuhan_bongkar: string;
  status: string;
  synced_at: string;
}

interface PerbandinganData {
  nomor_aju: string;
  pib_jumlah_kemasan: number;
  manifest_jumlah_kemasan: number;
  selisih_kemasan: number;
  pib_berat: number;
  manifest_berat: number;
  selisih_berat: number;
  status: 'MATCH' | 'MISMATCH' | 'NO_MANIFEST';
  pib_data?: any;
  manifest_data?: any;
}

interface PKBSIData {
  id: string;
  nomor_aju: string;
  nomor_dokumen: string;
  tanggal_dokumen: string;
  jenis_barang_strategis: string;
  hs_code: string;
  uraian_barang: string;
  jumlah: number;
  satuan: string;
  nilai_barang: number;
  mata_uang: string;
  negara_asal: string;
  nama_eksportir: string;
  nama_importir: string;
  npwp_importir: string;
  instansi_pengawas: string;
  nomor_rekomendasi: string;
  tanggal_rekomendasi: string;
  masa_berlaku_rekomendasi: string;
  kategori_lartas: string;
  status_lartas: string;
  keterangan: string;
  status: string;
  synced_at: string;
}

interface MonitoringData {
  id: string;
  nomor_aju: string;
  jenis_dokumen: string;
  tanggal_pengajuan: string;
  tanggal_kirim_ceisa: string;
  tanggal_respon_ceisa: string;
  waktu_respon_detik: number;
  status_terakhir: string;
  status_detail: string;
  kode_respon: string;
  pesan_respon: string;
  keterangan_penolakan: string;
  alasan_penolakan: string;
  saran_perbaikan: string;
  nomor_response: string;
  nama_petugas: string;
  kantor_pabean: string;
  jumlah_retry: number;
  retry_terakhir: string;
  created_at: string;
  updated_at: string;
}

export default function SingleCoreSystemPage() {
  // Document Pabean States
  const [documents, setDocuments] = useState<DocumentPabean[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentPabean | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  
  // Voluntary Declaration States
  const [voluntaryDeclarations, setVoluntaryDeclarations] = useState<VoluntaryDeclaration[]>([]);
  const [loadingVoluntary, setLoadingVoluntary] = useState(false);
  const [showVoluntaryForm, setShowVoluntaryForm] = useState(false);
  const [voluntaryForm, setVoluntaryForm] = useState({
    nomor_aju: '',
    tanggal: new Date().toISOString().split('T')[0],
    npwp: '',
    nama_perusahaan: '',
    alamat: '',
    jenis_deklarasi: '',
    uraian: '',
    nilai_barang: 0,
    mata_uang: 'IDR',
    kantor_pabean: '',
    kode_kantor: '',
    catatan: ''
  });
  const [editingVoluntary, setEditingVoluntary] = useState<VoluntaryDeclaration | null>(null);
  
  // Manifest States
  const [manifests, setManifests] = useState<ManifestData[]>([]);
  const [loadingManifest, setLoadingManifest] = useState(false);
  const [manifestSearch, setManifestSearch] = useState('');
  const [syncingManifest, setSyncingManifest] = useState(false);
  
  // Kendaraan States
  const [kendaraanList, setKendaraanList] = useState<KendaraanData[]>([]);
  const [loadingKendaraan, setLoadingKendaraan] = useState(false);
  const [kendaraanSearch, setKendaraanSearch] = useState('');
  const [syncingKendaraan, setSyncingKendaraan] = useState(false);
  const [selectedKendaraan, setSelectedKendaraan] = useState<KendaraanData | null>(null);
  const [showKendaraanDetail, setShowKendaraanDetail] = useState(false);
  
  // Perbandingan States
  const [perbandinganData, setPerbandinganData] = useState<PerbandinganData[]>([]);
  const [loadingPerbandingan, setLoadingPerbandingan] = useState(false);
  
  // PKBSI States
  const [pkbsiList, setPkbsiList] = useState<PKBSIData[]>([]);
  const [loadingPkbsi, setLoadingPkbsi] = useState(false);
  const [pkbsiSearch, setPkbsiSearch] = useState('');
  const [syncingPkbsi, setSyncingPkbsi] = useState(false);
  
  // Monitoring States
  const [monitoringData, setMonitoringData] = useState<MonitoringData[]>([]);
  const [loadingMonitoring, setLoadingMonitoring] = useState(false);
  const [monitoringSearch, setMonitoringSearch] = useState('');
  
  // Filter states
  const [searchNomorAju, setSearchNomorAju] = useState('');
  const [kantorPabean, setKantorPabean] = useState('');
  const [jenisDokumen, setJenisDokumen] = useState('BC20');
  const [jenisImpor, setJenisImpor] = useState('1');
  const [caraPembayaran, setCaraPembayaran] = useState('1');
  
  const [kantorList, setKantorList] = useState<KantorPabean[]>([]);

  // Active tab state
  const [activeTab, setActiveTab] = useState('dokumen-pabean');
  
  // Sync All States
  const [syncAllLoading, setSyncAllLoading] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncAllResult | null>(null);

  // Fetch kantor pabean list
  useEffect(() => {
    fetchKantorPabean();
  }, []);

  // Cache to prevent redundant fetches
  const [fetchedTabs, setFetchedTabs] = useState<Set<string>>(new Set());

  // Fetch data when tab changes (only once per tab)
  useEffect(() => {
    if (fetchedTabs.has(activeTab)) return; // Skip if already fetched

    if (activeTab === 'voluntary') {
      fetchVoluntaryDeclarations();
    } else if (activeTab === 'manifes') {
      fetchManifests();
    } else if (activeTab === 'kendaraan') {
      fetchKendaraan();
    } else if (activeTab === 'perbandingan') {
      fetchPerbandinganData();
    } else if (activeTab === 'pkbsi') {
      fetchPKBSI();
    } else if (activeTab === 'pantauan') {
      fetchMonitoringData();
    }

    setFetchedTabs(prev => new Set([...prev, activeTab]));
  }, [activeTab]);

  const fetchKantorPabean = async () => {
    try {
      // Fetch dari customs_offices table
      const { data, error } = await supabase
        .from('customs_offices')
        .select('id, code, name, type, city, province')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const kantorData: KantorPabean[] = (data || []).map((item: any) => ({
        id: item.id,
        kode_kantor: item.code,
        nama_kantor: `${item.name} ${item.city ? `(${item.city})` : ''}`,
        kode_pelabuhan: item.code,
      }));

      setKantorList(kantorData);
      
      // Log untuk debugging
      console.log('Kantor Pabean loaded:', kantorData.length);
      
      if (kantorData.length === 0) {
        toast.warning('Data Kantor Pabean kosong. Jalankan migrasi database atau sync CEISA.');
      }
    } catch (error) {
      console.error('Error fetching kantor pabean:', error);
      toast.error('Gagal memuat Kantor Pabean');
    }
  };

  // Voluntary Declaration Functions
  const fetchVoluntaryDeclarations = async () => {
    setLoadingVoluntary(true);
    try {
      const { data, error } = await supabase
        .from('voluntary_declarations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setVoluntaryDeclarations(data || []);
    } catch (error: any) {
      console.error('Error fetching voluntary declarations:', error);
      toast.error('Gagal memuat data Voluntary Declaration');
    } finally {
      setLoadingVoluntary(false);
    }
  };

  const handleSaveVoluntary = async () => {
    if (!voluntaryForm.nomor_aju || !voluntaryForm.tanggal) {
      toast.error('Nomor Aju dan Tanggal wajib diisi');
      return;
    }

    try {
      if (editingVoluntary) {
        const { error } = await supabase
          .from('voluntary_declarations')
          .update({
            ...voluntaryForm,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingVoluntary.id);

        if (error) throw error;
        toast.success('Voluntary Declaration berhasil diupdate');
      } else {
        const { error } = await supabase
          .from('voluntary_declarations')
          .insert([{
            ...voluntaryForm,
            status: 'DRAFT'
          }]);

        if (error) throw error;
        toast.success('Voluntary Declaration berhasil dibuat');
      }

      setShowVoluntaryForm(false);
      setEditingVoluntary(null);
      resetVoluntaryForm();
      fetchVoluntaryDeclarations();
    } catch (error: any) {
      console.error('Error saving voluntary declaration:', error);
      toast.error('Gagal menyimpan: ' + error.message);
    }
  };

  const handleEditVoluntary = (item: VoluntaryDeclaration) => {
    setEditingVoluntary(item);
    setVoluntaryForm({
      nomor_aju: item.nomor_aju,
      tanggal: item.tanggal,
      npwp: item.npwp || '',
      nama_perusahaan: item.nama_perusahaan || '',
      alamat: item.alamat || '',
      jenis_deklarasi: item.jenis_deklarasi || '',
      uraian: item.uraian || '',
      nilai_barang: item.nilai_barang || 0,
      mata_uang: item.mata_uang || 'IDR',
      kantor_pabean: item.kantor_pabean || '',
      kode_kantor: item.kode_kantor || '',
      catatan: item.catatan || ''
    });
    setShowVoluntaryForm(true);
  };

  const handleDeleteVoluntary = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;

    try {
      const { error } = await supabase
        .from('voluntary_declarations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Voluntary Declaration berhasil dihapus');
      fetchVoluntaryDeclarations();
    } catch (error: any) {
      console.error('Error deleting voluntary declaration:', error);
      toast.error('Gagal menghapus: ' + error.message);
    }
  };

  const resetVoluntaryForm = () => {
    setVoluntaryForm({
      nomor_aju: '',
      tanggal: new Date().toISOString().split('T')[0],
      npwp: '',
      nama_perusahaan: '',
      alamat: '',
      jenis_deklarasi: '',
      uraian: '',
      nilai_barang: 0,
      mata_uang: 'IDR',
      kantor_pabean: '',
      kode_kantor: '',
      catatan: ''
    });
  };

  // ========== MANIFEST FUNCTIONS ==========
  const fetchManifests = async () => {
    setLoadingManifest(true);
    try {
      const { data, error } = await supabase
        .from('ceisa_manifests')
        .select('*')
        .order('tanggal_tiba', { ascending: false })
        .limit(20);

      if (error) throw error;
      setManifests(data || []);
    } catch (error: any) {
      console.error('Error fetching manifests:', error);
      toast.error('Gagal memuat data manifest');
    } finally {
      setLoadingManifest(false);
    }
  };

  const searchManifests = async () => {
    if (!manifestSearch.trim()) {
      fetchManifests();
      return;
    }

    setLoadingManifest(true);
    try {
      const { data, error } = await supabase
        .from('ceisa_manifests')
        .select('*')
        .or(`nomor_aju.ilike.%${manifestSearch}%,nomor_manifest.ilike.%${manifestSearch}%,nama_kapal.ilike.%${manifestSearch}%`)
        .order('tanggal_tiba', { ascending: false });

      if (error) throw error;
      setManifests(data || []);
      toast.success(`Ditemukan ${data?.length || 0} manifest`);
    } catch (error: any) {
      console.error('Search manifest error:', error);
      toast.error('Gagal mencari manifest: ' + error.message);
    } finally {
      setLoadingManifest(false);
    }
  };

  const handleSyncManifest = async () => {
    setSyncingManifest(true);
    try {
      const params: ManifestFetchParams = {};
      if (manifestSearch) params.nomorAju = manifestSearch;
      
      const result = await fetchAndSaveManifest(params);
      
      if (result.success) {
        toast.success(`Berhasil sync ${result.count} manifest dari CEISA`);
        fetchManifests();
      } else {
        toast.error(result.error || 'Gagal sync manifest');
      }
    } catch (error: any) {
      toast.error('Gagal sync manifest: ' + error.message);
    } finally {
      setSyncingManifest(false);
    }
  };

  // ========== KENDARAAN FUNCTIONS ==========
  const fetchKendaraan = async () => {
    setLoadingKendaraan(true);
    try {
      const { data, error } = await supabase
        .from('ceisa_vehicles')
        .select('*')
        .order('tanggal_pib', { ascending: false })
        .limit(20);

      if (error) throw error;
      setKendaraanList(data || []);
    } catch (error: any) {
      console.error('Error fetching kendaraan:', error);
      toast.error('Gagal memuat data kendaraan');
    } finally {
      setLoadingKendaraan(false);
    }
  };

  const searchKendaraan = async () => {
    if (!kendaraanSearch.trim()) {
      fetchKendaraan();
      return;
    }

    setLoadingKendaraan(true);
    try {
      const { data, error } = await supabase
        .from('ceisa_vehicles')
        .select('*')
        .or(`nomor_aju.ilike.%${kendaraanSearch}%,nomor_rangka.ilike.%${kendaraanSearch}%,merek.ilike.%${kendaraanSearch}%,tipe.ilike.%${kendaraanSearch}%`)
        .order('tanggal_pib', { ascending: false });

      if (error) throw error;
      setKendaraanList(data || []);
      toast.success(`Ditemukan ${data?.length || 0} kendaraan`);
    } catch (error: any) {
      console.error('Search kendaraan error:', error);
      toast.error('Gagal mencari kendaraan: ' + error.message);
    } finally {
      setLoadingKendaraan(false);
    }
  };

  const handleSyncKendaraan = async () => {
    setSyncingKendaraan(true);
    try {
      const params: KendaraanFetchParams = {};
      if (kendaraanSearch) params.nomorAju = kendaraanSearch;
      
      const result = await fetchAndSaveKendaraan(params);
      
      if (result.success) {
        toast.success(`Berhasil sync ${result.count} kendaraan dari CEISA`);
        fetchKendaraan();
      } else {
        toast.error(result.error || 'Gagal sync kendaraan');
      }
    } catch (error: any) {
      toast.error('Gagal sync kendaraan: ' + error.message);
    } finally {
      setSyncingKendaraan(false);
    }
  };

  // ========== PERBANDINGAN FUNCTIONS ==========
  const fetchPerbandinganData = async () => {
    setLoadingPerbandingan(true);
    try {
      // First try to fetch from ceisa_comparisons table
      const { data: comparisonData, error: comparisonError } = await supabase
        .from('ceisa_comparisons')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!comparisonError && comparisonData && comparisonData.length > 0) {
        // Use data from ceisa_comparisons table
        const comparisons: PerbandinganData[] = comparisonData.map((c: any) => ({
          nomor_aju: c.nomor_aju,
          pib_jumlah_kemasan: c.pib_jumlah_kemasan || 0,
          manifest_jumlah_kemasan: c.manifest_jumlah_kemasan || 0,
          selisih_kemasan: c.selisih_kemasan || 0,
          pib_berat: c.pib_berat || 0,
          manifest_berat: c.manifest_berat || 0,
          selisih_berat: c.selisih_berat || 0,
          status: c.status || 'NO_MANIFEST',
          pib_data: c.pib_data,
          manifest_data: c.manifest_data,
        }));
        setPerbandinganData(comparisons);
      } else {
        // Fallback: Generate comparison from pib_documents and ceisa_manifests
        const { data: pibData, error: pibError } = await supabase
          .from('pib_documents')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (pibError) throw pibError;

        const { data: manifestData, error: manifestError } = await supabase
          .from('ceisa_manifests')
          .select('*');

        if (manifestError) throw manifestError;

        const comparisons: PerbandinganData[] = (pibData || []).map((pib: any) => {
          const manifest = (manifestData || []).find((m: any) => m.nomor_aju === pib.nomor_aju);
          
          const pibKemasan = pib.metadata?.jumlah_kemasan || pib.jumlah_kemasan || 0;
          const pibBerat = pib.metadata?.berat_bersih || pib.berat_bersih || 0;
          const manifestKemasan = manifest?.jumlah_kemasan || 0;
          const manifestBerat = manifest?.berat_bersih || 0;
          
          const selisihKemasan = Math.abs(pibKemasan - manifestKemasan);
          const selisihBerat = Math.abs(pibBerat - manifestBerat);

          let status: 'MATCH' | 'MISMATCH' | 'NO_MANIFEST' = 'NO_MANIFEST';
          if (manifest) {
            status = (selisihKemasan === 0 && selisihBerat < 1) ? 'MATCH' : 'MISMATCH';
          }

          return {
            nomor_aju: pib.nomor_aju,
            pib_jumlah_kemasan: pibKemasan,
            manifest_jumlah_kemasan: manifestKemasan,
            selisih_kemasan: selisihKemasan,
            pib_berat: pibBerat,
            manifest_berat: manifestBerat,
            selisih_berat: selisihBerat,
            status,
            pib_data: pib,
            manifest_data: manifest,
          };
        });

        setPerbandinganData(comparisons);
      }
    } catch (error: any) {
      console.error('Error fetching perbandingan:', error);
      toast.error('Gagal memuat data perbandingan');
    } finally {
      setLoadingPerbandingan(false);
    }
  };

  const saveComparisonData = async () => {
    if (perbandinganData.length === 0) return;

    try {
      const dataToSave = perbandinganData.map(p => ({
        nomor_aju: p.nomor_aju,
        pib_jumlah_kemasan: p.pib_jumlah_kemasan,
        manifest_jumlah_kemasan: p.manifest_jumlah_kemasan,
        selisih_kemasan: p.selisih_kemasan,
        pib_berat: p.pib_berat,
        manifest_berat: p.manifest_berat,
        selisih_berat: p.selisih_berat,
        status: p.status,
        pib_data: p.pib_data,
        manifest_data: p.manifest_data,
        source: 'CEISA',
        synced_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('ceisa_comparisons')
        .upsert(dataToSave, { onConflict: 'nomor_aju' });

      if (error) throw error;
      toast.success('Data perbandingan tersimpan');
    } catch (error: any) {
      console.error('Error saving comparison:', error);
      toast.error('Gagal menyimpan data perbandingan');
    }
  };

  // ========== PKBSI FUNCTIONS ==========
  const fetchPKBSI = async () => {
    setLoadingPkbsi(true);
    try {
      const { data, error } = await supabase
        .from('ceisa_pkbsi')
        .select('*')
        .order('tanggal_dokumen', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPkbsiList(data || []);
    } catch (error: any) {
      console.error('Error fetching PKBSI:', error);
      toast.error('Gagal memuat data PKBSI');
    } finally {
      setLoadingPkbsi(false);
    }
  };

  const searchPKBSI = async () => {
    if (!pkbsiSearch.trim()) {
      fetchPKBSI();
      return;
    }

    setLoadingPkbsi(true);
    try {
      const { data, error } = await supabase
        .from('ceisa_pkbsi')
        .select('*')
        .or(`nomor_aju.ilike.%${pkbsiSearch}%,nomor_dokumen.ilike.%${pkbsiSearch}%,uraian_barang.ilike.%${pkbsiSearch}%`)
        .order('tanggal_dokumen', { ascending: false });

      if (error) throw error;
      setPkbsiList(data || []);
      toast.success(`Ditemukan ${data?.length || 0} dokumen PKBSI`);
    } catch (error: any) {
      console.error('Search PKBSI error:', error);
      toast.error('Gagal mencari PKBSI: ' + error.message);
    } finally {
      setLoadingPkbsi(false);
    }
  };

  const handleSyncPKBSI = async () => {
    setSyncingPkbsi(true);
    try {
      const params: PKBSIFetchParams = {};
      if (pkbsiSearch) params.nomorAju = pkbsiSearch;
      
      const result = await fetchAndSavePKBSI(params);
      
      if (result.success) {
        toast.success(`Berhasil sync ${result.count} dokumen PKBSI dari CEISA`);
        fetchPKBSI();
      } else {
        toast.error(result.error || 'Gagal sync PKBSI');
      }
    } catch (error: any) {
      toast.error('Gagal sync PKBSI: ' + error.message);
    } finally {
      setSyncingPkbsi(false);
    }
  };

  // ========== MONITORING FUNCTIONS ==========
  const fetchMonitoringData = async () => {
    setLoadingMonitoring(true);
    try {
      const { data, error } = await supabase
        .from('ceisa_monitoring')
        .select('*')
        .order('tanggal_kirim_ceisa', { ascending: false })
        .limit(20);

      if (error) throw error;
      setMonitoringData(data || []);
    } catch (error: any) {
      console.error('Error fetching monitoring data:', error);
      toast.error('Gagal memuat data monitoring');
    } finally {
      setLoadingMonitoring(false);
    }
  };

  const searchMonitoring = async () => {
    if (!monitoringSearch.trim()) {
      fetchMonitoringData();
      return;
    }

    setLoadingMonitoring(true);
    try {
      const { data, error } = await supabase
        .from('ceisa_monitoring')
        .select('*')
        .or(`nomor_aju.ilike.%${monitoringSearch}%,status_terakhir.ilike.%${monitoringSearch}%`)
        .order('tanggal_kirim_ceisa', { ascending: false });

      if (error) throw error;
      setMonitoringData(data || []);
      toast.success(`Ditemukan ${data?.length || 0} dokumen`);
    } catch (error: any) {
      console.error('Search monitoring error:', error);
      toast.error('Gagal mencari dokumen: ' + error.message);
    } finally {
      setLoadingMonitoring(false);
    }
  };

  // ========== SYNC ALL CEISA ==========
  const handleSyncAllCeisa = async () => {
    setSyncAllLoading(true);
    try {
      // Test connection first
      toast.info('Testing CEISA connection...');
      const connectionTest = await testCeisaConnection();
      
      if (!connectionTest.success) {
        toast.warning(`API CEISA tidak tersedia: ${connectionTest.message}. Menggunakan mock data.`);
      } else {
        toast.success('CEISA connected!');
      }

      const result = await syncCeisaDocuments();
      setLastSyncResult(result);
      
      if (result.success) {
        toast.success(
          `Sync selesai! ${result.total_inserted} inserted, ${result.total_updated} updated (${result.duration_ms}ms)`
        );
        // Refresh current tab data and kantor pabean
        fetchKantorPabean();
        if (activeTab === 'manifes') fetchManifests();
        else if (activeTab === 'kendaraan') fetchKendaraan();
        else if (activeTab === 'pkbsi') fetchPKBSI();
        else if (activeTab === 'pantauan') fetchMonitoringData();
      } else {
        const errorCount = result.results.filter(r => !r.success).length;
        toast.error(`Sync selesai dengan ${errorCount} error`);
      }
    } catch (error: any) {
      toast.error('Gagal sync CEISA: ' + error.message);
    } finally {
      setSyncAllLoading(false);
    }
  };

  // Document Pabean Functions
  const searchDocuments = async () => {
    if (!searchNomorAju.trim()) {
      toast.error('Nomor Pengajuan harus diisi');
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('pib_documents')
        .select('*')
        .ilike('nomor_aju', `%${searchNomorAju}%`);

      const { data, error } = await query;

      if (error) throw error;

      const mappedDocs: DocumentPabean[] = (data || []).map((doc: any) => ({
        id: doc.id,
        nomor_aju: doc.nomor_aju,
        tanggal_aju: doc.tanggal_aju,
        jenis_dokumen: 'BC 2.0',
        pelabuhan_tujuan: doc.metadata?.pelabuhan || '-',
        kantor_pabean: doc.metadata?.kantor_pabean || kantorPabean,
        kode_kantor: doc.metadata?.kode_kantor || kantorPabean,
        cara_pembayaran: caraPembayaran === '1' ? 'BIASA' : 'LUAR BIASA',
        jenis_pib: jenisDokumen,
        jenis_impor: jenisImpor === '1' ? 'UNTUK DIPAKAI' : 'SEMENTARA',
        keterangan_lain: doc.metadata?.keterangan || '-',
        status: doc.status,
        created_at: doc.created_at,
      }));

      setDocuments(mappedDocs);
      
      if (mappedDocs.length === 0) {
        toast.info('Tidak ada dokumen ditemukan');
      } else {
        toast.success(`Ditemukan ${mappedDocs.length} dokumen`);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error('Gagal mencari dokumen: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (doc: DocumentPabean) => {
    setSelectedDoc(doc);
    setShowDetail(true);
  };

  // Column definitions
  const documentColumns: Column<DocumentPabean>[] = [
    {
      header: 'Nomor Pengajuan',
      accessor: 'nomor_aju',
      render: (value: string) => (
        <span className="font-mono text-xs">{value}</span>
      ),
    },
    {
      header: 'Tanggal Pengajuan',
      accessor: 'tanggal_aju',
      render: (value: string) => (
        <span className="text-xs">{new Date(value).toLocaleDateString('id-ID')}</span>
      ),
    },
    {
      header: 'Kantor Pabean',
      accessor: 'kantor_pabean',
    },
    {
      header: 'Jenis Impor',
      accessor: 'jenis_impor',
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value: string) => (
        <StatusBadge status={value as any} />
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (_: any, row: DocumentPabean) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetail(row)}
          >
            <Eye size={14} />
          </Button>
        </div>
      ),
    },
  ];

  const voluntaryColumns: Column<VoluntaryDeclaration>[] = [
    {
      header: 'Nomor Aju',
      accessor: 'nomor_aju',
      render: (value: string) => (
        <span className="font-mono text-xs">{value}</span>
      ),
    },
    {
      header: 'Tanggal',
      accessor: 'tanggal',
      render: (value: string) => (
        <span className="text-xs">{new Date(value).toLocaleDateString('id-ID')}</span>
      ),
    },
    {
      header: 'NPWP',
      accessor: 'npwp',
      render: (value: string) => (
        <span className="font-mono text-xs">{value || '-'}</span>
      ),
    },
    {
      header: 'Nama Perusahaan',
      accessor: 'nama_perusahaan',
    },
    {
      header: 'Jenis Deklarasi',
      accessor: 'jenis_deklarasi',
    },
    {
      header: 'Nilai',
      accessor: 'nilai_barang',
      render: (value: number, row: VoluntaryDeclaration) => (
        <span className="text-xs">
          {row.mata_uang} {value?.toLocaleString('id-ID') || '0'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value: string) => (
        <StatusBadge status={value as any} />
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (_: any, row: VoluntaryDeclaration) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditVoluntary(row)}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteVoluntary(row.id)}
          >
            <Trash2 size={14} className="text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-3 sm:space-y-4">
        {/* Header - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-semibold text-[#1E3A5F]">Single Core System</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Browse Surat Kuasa & Dokumen Pabean</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {lastSyncResult && (
              <div className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                Last sync: {lastSyncResult.total_inserted + lastSyncResult.total_updated} records ({lastSyncResult.duration_ms}ms)
              </div>
            )}
            <Button
              onClick={async () => {
                const result = await testCeisaConnection();
                if (result.success) {
                  toast.success('✅ ' + result.message);
                } else {
                  toast.error('❌ ' + result.message);
                }
              }}
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#1E3A5F]/10"
            >
              <CheckCircle2 size={14} className="mr-1 sm:mr-1.5" />
              <span className="hidden sm:inline">Test Connection</span>
              <span className="sm:hidden">Test</span>
            </Button>
            <Button
              onClick={handleSyncAllCeisa}
              disabled={syncAllLoading}
              variant="default"
              size="sm"
              className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90 text-xs sm:text-sm"
            >
              {syncAllLoading ? (
                <>
                  <RefreshCw size={14} className="mr-1 sm:mr-1.5 animate-spin" />
                  <span className="hidden sm:inline">Syncing...</span>
                  <span className="sm:hidden">Sync</span>
                </>
              ) : (
                <>
                  <Download size={14} className="mr-1 sm:mr-1.5" />
                  <span className="hidden sm:inline">Sync All CEISA</span>
                  <span className="sm:hidden">Sync</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-4">
          {/* Mobile Tab Selector (Dropdown Style) */}
          <div className="block sm:hidden">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Tab" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="voluntary">
                  <span className="flex items-center gap-2"><FileCheck size={14} /> Voluntary Declaration</span>
                </SelectItem>
                <SelectItem value="dokumen-pabean">
                  <span className="flex items-center gap-2"><FileText size={14} /> Dokumen Pabean</span>
                </SelectItem>
                <SelectItem value="manifes">
                  <span className="flex items-center gap-2"><Ship size={14} /> Manifes Online</span>
                </SelectItem>
                <SelectItem value="perbandingan">
                  <span className="flex items-center gap-2"><BarChart3 size={14} /> Perbandingan</span>
                </SelectItem>
                <SelectItem value="kendaraan">
                  <span className="flex items-center gap-2"><Car size={14} /> Kendaraan</span>
                </SelectItem>
                <SelectItem value="pkbsi">
                  <span className="flex items-center gap-2"><Package size={14} /> PKBSI</span>
                </SelectItem>
                <SelectItem value="pantauan">
                  <span className="flex items-center gap-2"><Eye size={14} /> Pantauan</span>
                </SelectItem>
                <SelectItem value="user">
                  <span className="flex items-center gap-2"><Users size={14} /> User Mgmt</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Tabs */}
          <TabsList className="hidden sm:flex flex-wrap h-auto gap-1">
            <TabsTrigger value="voluntary" className="gap-1.5 text-xs lg:text-sm">
              <FileCheck size={14} />
              <span className="hidden lg:inline">Voluntary Declaration</span>
              <span className="lg:hidden">Voluntary</span>
            </TabsTrigger>
            <TabsTrigger value="dokumen-pabean" className="gap-1.5 text-xs lg:text-sm">
              <FileText size={14} />
              <span className="hidden lg:inline">Dokumen Pabean</span>
              <span className="lg:hidden">Dokumen</span>
            </TabsTrigger>
            <TabsTrigger value="manifes" className="gap-1.5 text-xs lg:text-sm">
              <Ship size={14} />
              <span className="hidden lg:inline">Manifes Online</span>
              <span className="lg:hidden">Manifes</span>
            </TabsTrigger>
            <TabsTrigger value="perbandingan" className="gap-1.5 text-xs lg:text-sm">
              <BarChart3 size={14} />
              <span className="hidden xl:inline">Perbandingan Online</span>
              <span className="xl:hidden">Perbandingan</span>
            </TabsTrigger>
            <TabsTrigger value="kendaraan" className="gap-1.5 text-xs lg:text-sm">
              <Car size={14} />
              <span className="hidden xl:inline">Kendaraan Bermotor</span>
              <span className="xl:hidden">Kendaraan</span>
            </TabsTrigger>
            <TabsTrigger value="pkbsi" className="gap-1.5 text-xs lg:text-sm">
              <Package size={14} />
              PKBSI
            </TabsTrigger>
            <TabsTrigger value="pantauan" className="gap-1.5 text-xs lg:text-sm">
              <Eye size={14} />
              <span className="hidden lg:inline">Pantauan Online</span>
              <span className="lg:hidden">Pantauan</span>
            </TabsTrigger>
            <TabsTrigger value="user" className="gap-1.5 text-xs lg:text-sm">
              <Users size={14} />
              <span className="hidden lg:inline">User Management</span>
              <span className="lg:hidden">Users</span>
            </TabsTrigger>
          </TabsList>

          {/* =============== VOLUNTARY DECLARATION TAB =============== */}
          <TabsContent value="voluntary" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Voluntary Declaration</CardTitle>
                <Button size="sm" onClick={() => {
                  setEditingVoluntary(null);
                  resetVoluntaryForm();
                  setShowVoluntaryForm(true);
                }}>
                  <Plus size={16} className="mr-1.5" />
                  New Declaration
                </Button>
              </CardHeader>
              <CardContent>
                {loadingVoluntary ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : voluntaryDeclarations.length > 0 ? (
                  <DataTable
                    columns={voluntaryColumns}
                    data={voluntaryDeclarations}
                    selectedRows={[]}
                    onSelectionChange={() => {}}
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileCheck size={56} className="mx-auto mb-4 opacity-40" />
                    <p className="text-lg font-medium">Belum ada data hasil sinkronisasi CEISA</p>
                    <p className="text-sm mt-2">Data Voluntary Declaration dari tabel <code>voluntary_declarations</code></p>
                    <p className="text-sm">Klik tombol <strong>"New Declaration"</strong> untuk menambah data baru</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* =============== DOKUMEN PABEAN TAB =============== */}
          <TabsContent value="dokumen-pabean" className="space-y-3 sm:space-y-4">
            {/* Search Card */}
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-sm sm:text-base">Browse Surat Kuasa</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pelabuhan" className="text-xs sm:text-sm">Pelabuhan Tujuan</Label>
                    <Input
                      id="pelabuhan"
                      placeholder="ID122"
                      defaultValue=""
                      disabled
                      className="bg-muted h-9 sm:h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kantorPabean" className="text-xs sm:text-sm">Kantor Pabean</Label>
                    <Select value={kantorPabean} onValueChange={setKantorPabean}>
                      <SelectTrigger className="h-9 sm:h-10 text-sm">
                        <SelectValue placeholder="Pilih Kantor Pabean" />
                      </SelectTrigger>
                      <SelectContent>
                        {kantorList.map((kantor) => (
                          <SelectItem key={kantor.id} value={kantor.kode_kantor}>
                            {kantor.kode_kantor} - {kantor.nama_kantor}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nomorAju" className="text-xs sm:text-sm">Nomor Pengajuan</Label>
                    <Input
                      id="nomorAju"
                      value={searchNomorAju}
                      onChange={(e) => setSearchNomorAju(e.target.value)}
                      placeholder="000000-000000-20250101-000001"
                      className="font-mono text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') searchDocuments();
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Search Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">HUAN IMPOR BARANG</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="ikhtisar" className="w-full">
                  <TabsList className="grid w-full grid-cols-8">
                    <TabsTrigger value="ikhtisar">Ikhtisar</TabsTrigger>
                    <TabsTrigger value="dokumen">Dokumen</TabsTrigger>
                    <TabsTrigger value="pengangkut">Pengangkut</TabsTrigger>
                    <TabsTrigger value="kemasan">Kemasan & Peti Kemas</TabsTrigger>
                    <TabsTrigger value="transaksi">Transaksi</TabsTrigger>
                    <TabsTrigger value="barang">Barang</TabsTrigger>
                    <TabsTrigger value="pungutan">Pungutan</TabsTrigger>
                    <TabsTrigger value="pernyataan">Pernyataan</TabsTrigger>
                  </TabsList>

                  <TabsContent value="ikhtisar" className="space-y-4 pt-4">
                    {/* Kantor Pabean Section */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <h3 className="text-sm font-semibold">Kantor Pabean</h3>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Pelabuhan Tujuan</Label>
                          <Input
                            placeholder="ID122"
                            className="h-8"
                            disabled
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Kantor Pabean</Label>
                          <Input
                            value={kantorPabean}
                            placeholder="040300 - KPU BEA DAN CUKAI TIPE A TJ PRIOK"
                            className="h-8"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>

                    {/* Keterangan Lain Section */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <h3 className="text-sm font-semibold">Keterangan Lain</h3>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Jenis PIB</Label>
                          <Select value={jenisDokumen} onValueChange={setJenisDokumen}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BC20">1 - BIASA</SelectItem>
                              <SelectItem value="BC23">2 - BERKALA</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Jenis Impor</Label>
                          <Select value={jenisImpor} onValueChange={setJenisImpor}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 - UNTUK DIPAKAI</SelectItem>
                              <SelectItem value="2">2 - SEMENTARA</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Cara Pembayaran</Label>
                          <Select value={caraPembayaran} onValueChange={setCaraPembayaran}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 - BIASA / LUAR</SelectItem>
                              <SelectItem value="2">2 - BERKALA</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Search Section */}
                    <div className="border rounded-lg p-4">
                      <div className="flex gap-3 items-end">
                        <Button
                          onClick={searchDocuments}
                          disabled={loading}
                          className="h-10"
                        >
                          {loading ? (
                            <RefreshCw size={16} className="animate-spin mr-1.5" />
                          ) : (
                            <>
                              <Search size={16} className="mr-1.5" />
                              Cari Dokumen
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="dokumen" className="pt-4">
                    <div className="border rounded-lg p-6 text-center text-muted-foreground">
                      <FileText size={40} className="mx-auto mb-3 opacity-40" />
                      <p className="font-medium">Belum ada data untuk sub-tab ini</p>
                      <p className="text-sm mt-1">Data dokumen pendukung akan ditampilkan setelah pencarian</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="pengangkut" className="pt-4">
                    <div className="border rounded-lg p-6 text-center text-muted-foreground">
                      <Ship size={40} className="mx-auto mb-3 opacity-40" />
                      <p className="font-medium">Belum ada data untuk sub-tab ini</p>
                      <p className="text-sm mt-1">Data pengangkut akan ditampilkan setelah pencarian</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="kemasan" className="pt-4">
                    <div className="border rounded-lg p-6 text-center text-muted-foreground">
                      <Package size={40} className="mx-auto mb-3 opacity-40" />
                      <p className="font-medium">Belum ada data untuk sub-tab ini</p>
                      <p className="text-sm mt-1">Data kemasan & peti kemas akan ditampilkan setelah pencarian</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="transaksi" className="pt-4">
                    <div className="border rounded-lg p-6 text-center text-muted-foreground">
                      <BarChart3 size={40} className="mx-auto mb-3 opacity-40" />
                      <p className="font-medium">Belum ada data untuk sub-tab ini</p>
                      <p className="text-sm mt-1">Data transaksi akan ditampilkan setelah pencarian</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="barang" className="pt-4">
                    <div className="border rounded-lg p-6 text-center text-muted-foreground">
                      <Package size={40} className="mx-auto mb-3 opacity-40" />
                      <p className="font-medium">Belum ada data untuk sub-tab ini</p>
                      <p className="text-sm mt-1">Data barang akan ditampilkan setelah pencarian</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="pungutan" className="pt-4">
                    <div className="border rounded-lg p-6 text-center text-muted-foreground">
                      <FileText size={40} className="mx-auto mb-3 opacity-40" />
                      <p className="font-medium">Belum ada data untuk sub-tab ini</p>
                      <p className="text-sm mt-1">Data pungutan akan ditampilkan setelah pencarian</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="pernyataan" className="pt-4">
                    <div className="border rounded-lg p-6 text-center text-muted-foreground">
                      <FileCheck size={40} className="mx-auto mb-3 opacity-40" />
                      <p className="font-medium">Belum ada data untuk sub-tab ini</p>
                      <p className="text-sm mt-1">Data pernyataan akan ditampilkan setelah pencarian</p>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Results Table */}
                {documents.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-sm font-semibold mb-3">Hasil Pencarian</h3>
                    <DataTable
                      columns={documentColumns}
                      data={documents}
                      selectedRows={[]}
                      onSelectionChange={() => {}}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* =============== MANIFES ONLINE TAB =============== */}
          <TabsContent value="manifes" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Manifes Online - CEISA</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncManifest}
                    disabled={syncingManifest}
                  >
                    {syncingManifest ? (
                      <RefreshCw size={14} className="mr-1.5 animate-spin" />
                    ) : (
                      <Download size={14} className="mr-1.5" />
                    )}
                    Sync CEISA
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="flex gap-3">
                  <Input
                    value={manifestSearch}
                    onChange={(e) => setManifestSearch(e.target.value)}
                    placeholder="Cari nomor aju, manifest, atau nama kapal..."
                    className="max-w-md"
                    onKeyDown={(e) => { if (e.key === 'Enter') searchManifests(); }}
                  />
                  <Button onClick={searchManifests} disabled={loadingManifest}>
                    <Search size={16} className="mr-1.5" />
                    Cari
                  </Button>
                </div>

                {/* Table */}
                {loadingManifest ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : manifests.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-3 py-2 text-left font-medium">Nomor Aju</th>
                          <th className="px-3 py-2 text-left font-medium">No. Manifest</th>
                          <th className="px-3 py-2 text-left font-medium">Nama Kapal</th>
                          <th className="px-3 py-2 text-left font-medium">Pelabuhan</th>
                          <th className="px-3 py-2 text-left font-medium">Tgl Tiba</th>
                          <th className="px-3 py-2 text-right font-medium">Kontainer</th>
                          <th className="px-3 py-2 text-right font-medium">Kemasan</th>
                          <th className="px-3 py-2 text-right font-medium">Berat (KG)</th>
                          <th className="px-3 py-2 text-left font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {manifests.map((m) => (
                          <tr key={m.id} className="border-b hover:bg-muted/30">
                            <td className="px-3 py-2 font-mono text-xs">{m.nomor_aju}</td>
                            <td className="px-3 py-2 font-mono text-xs">{m.nomor_manifest}</td>
                            <td className="px-3 py-2">{m.nama_kapal}</td>
                            <td className="px-3 py-2 text-xs">
                              <div>{m.pelabuhan_asal}</div>
                              <div className="text-muted-foreground">→ {m.pelabuhan_tujuan}</div>
                            </td>
                            <td className="px-3 py-2 text-xs">
                              {m.tanggal_tiba && new Date(m.tanggal_tiba).toLocaleDateString('id-ID')}
                            </td>
                            <td className="px-3 py-2 text-right">{m.jumlah_kontainer}</td>
                            <td className="px-3 py-2 text-right">{m.jumlah_kemasan}</td>
                            <td className="px-3 py-2 text-right">{m.berat_bersih?.toLocaleString('id-ID')}</td>
                            <td className="px-3 py-2">
                              <StatusBadge status={m.status as any} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Ship size={56} className="mx-auto mb-4 opacity-40" />
                    <p className="text-lg font-medium">Belum ada data hasil sinkronisasi CEISA</p>
                    <p className="text-sm mt-2">Data Manifest Online dari tabel <code>ceisa_manifests</code></p>
                    <p className="text-sm">Klik tombol <strong>"Sync CEISA"</strong> untuk mengambil data dari CEISA</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* =============== PERBANDINGAN ONLINE TAB =============== */}
          <TabsContent value="perbandingan" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Perbandingan PIB vs Manifest</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Membandingkan data PIB dengan Manifest untuk mendeteksi selisih
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchPerbandinganData} disabled={loadingPerbandingan}>
                  <RefreshCw size={14} className={loadingPerbandingan ? 'mr-1.5 animate-spin' : 'mr-1.5'} />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {loadingPerbandingan ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : perbandinganData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-3 py-2 text-left font-medium">Nomor Aju</th>
                          <th className="px-3 py-2 text-center font-medium" colSpan={2}>Kemasan</th>
                          <th className="px-3 py-2 text-center font-medium" colSpan={2}>Berat (KG)</th>
                          <th className="px-3 py-2 text-center font-medium">Status</th>
                        </tr>
                        <tr className="border-b bg-muted/30 text-xs">
                          <th className="px-3 py-1"></th>
                          <th className="px-3 py-1 text-right">PIB</th>
                          <th className="px-3 py-1 text-right">Manifest</th>
                          <th className="px-3 py-1 text-right">PIB</th>
                          <th className="px-3 py-1 text-right">Manifest</th>
                          <th className="px-3 py-1"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {perbandinganData.map((p, idx) => (
                          <tr key={idx} className={`border-b ${p.status === 'MISMATCH' ? 'bg-red-50' : p.status === 'NO_MANIFEST' ? 'bg-yellow-50' : ''}`}>
                            <td className="px-3 py-2 font-mono text-xs">{p.nomor_aju}</td>
                            <td className="px-3 py-2 text-right">{p.pib_jumlah_kemasan}</td>
                            <td className="px-3 py-2 text-right">
                              {p.status === 'NO_MANIFEST' ? '-' : p.manifest_jumlah_kemasan}
                              {p.selisih_kemasan > 0 && p.status !== 'NO_MANIFEST' && (
                                <span className="text-red-600 text-xs ml-1">({p.selisih_kemasan > 0 ? '+' : ''}{p.selisih_kemasan})</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right">{p.pib_berat?.toLocaleString('id-ID')}</td>
                            <td className="px-3 py-2 text-right">
                              {p.status === 'NO_MANIFEST' ? '-' : p.manifest_berat?.toLocaleString('id-ID')}
                              {p.selisih_berat > 0.1 && p.status !== 'NO_MANIFEST' && (
                                <span className="text-red-600 text-xs ml-1">({p.selisih_berat?.toFixed(2)})</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {p.status === 'MATCH' && (
                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                  <CheckCircle2 size={12} className="mr-1" />
                                  Match
                                </Badge>
                              )}
                              {p.status === 'MISMATCH' && (
                                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                                  <XCircle size={12} className="mr-1" />
                                  Selisih
                                </Badge>
                              )}
                              {p.status === 'NO_MANIFEST' && (
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                  <AlertTriangle size={12} className="mr-1" />
                                  No Manifest
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 size={56} className="mx-auto mb-4 opacity-40" />
                    <p className="text-lg font-medium">Belum ada data hasil sinkronisasi CEISA</p>
                    <p className="text-sm mt-2">Perbandingan PIB vs Manifest dari tabel <code>ceisa_comparisons</code></p>
                    <p className="text-sm">Pastikan sudah ada data PIB dan Manifest untuk perbandingan</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* =============== KENDARAAN BERMOTOR TAB =============== */}
          <TabsContent value="kendaraan" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Kendaraan Bermotor - CEISA</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncKendaraan}
                    disabled={syncingKendaraan}
                  >
                    {syncingKendaraan ? (
                      <RefreshCw size={14} className="mr-1.5 animate-spin" />
                    ) : (
                      <Download size={14} className="mr-1.5" />
                    )}
                    Sync CEISA
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="flex gap-3">
                  <Input
                    value={kendaraanSearch}
                    onChange={(e) => setKendaraanSearch(e.target.value)}
                    placeholder="Cari nomor aju, rangka, merek, atau tipe..."
                    className="max-w-md"
                    onKeyDown={(e) => { if (e.key === 'Enter') searchKendaraan(); }}
                  />
                  <Button onClick={searchKendaraan} disabled={loadingKendaraan}>
                    <Search size={16} className="mr-1.5" />
                    Cari
                  </Button>
                </div>

                {/* Table */}
                {loadingKendaraan ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : kendaraanList.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-3 py-2 text-left font-medium">Nomor Aju</th>
                          <th className="px-3 py-2 text-left font-medium">Jenis</th>
                          <th className="px-3 py-2 text-left font-medium">Merek / Tipe</th>
                          <th className="px-3 py-2 text-left font-medium">No. Rangka</th>
                          <th className="px-3 py-2 text-right font-medium">CC</th>
                          <th className="px-3 py-2 text-left font-medium">Warna</th>
                          <th className="px-3 py-2 text-right font-medium">Nilai CIF</th>
                          <th className="px-3 py-2 text-left font-medium">Status</th>
                          <th className="px-3 py-2 text-center font-medium">Detail</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kendaraanList.map((k) => (
                          <tr key={k.id} className="border-b hover:bg-muted/30">
                            <td className="px-3 py-2 font-mono text-xs">{k.nomor_aju}</td>
                            <td className="px-3 py-2">{k.jenis_kendaraan}</td>
                            <td className="px-3 py-2">
                              <div className="font-medium">{k.merek}</div>
                              <div className="text-xs text-muted-foreground">{k.tipe}</div>
                            </td>
                            <td className="px-3 py-2 font-mono text-xs">{k.nomor_rangka}</td>
                            <td className="px-3 py-2 text-right">{k.kapasitas_mesin}</td>
                            <td className="px-3 py-2">{k.warna}</td>
                            <td className="px-3 py-2 text-right">
                              {k.mata_uang} {k.nilai_cif?.toLocaleString('id-ID')}
                            </td>
                            <td className="px-3 py-2">
                              <StatusBadge status={k.status as any} />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedKendaraan(k);
                                  setShowKendaraanDetail(true);
                                }}
                              >
                                <Eye size={14} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Car size={56} className="mx-auto mb-4 opacity-40" />
                    <p className="text-lg font-medium">Belum ada data hasil sinkronisasi CEISA</p>
                    <p className="text-sm mt-2">Data Kendaraan Bermotor dari tabel <code>ceisa_vehicles</code></p>
                    <p className="text-sm">Klik tombol <strong>"Sync CEISA"</strong> untuk mengambil data dari CEISA</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* =============== PKBSI TAB =============== */}
          <TabsContent value="pkbsi" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">PKBSI - Barang Strategis & Lartas</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pusat Keamanan Barang Strategis Indonesia
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncPKBSI}
                    disabled={syncingPkbsi}
                  >
                    {syncingPkbsi ? (
                      <RefreshCw size={14} className="mr-1.5 animate-spin" />
                    ) : (
                      <Download size={14} className="mr-1.5" />
                    )}
                    Sync CEISA
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="flex gap-3">
                  <Input
                    value={pkbsiSearch}
                    onChange={(e) => setPkbsiSearch(e.target.value)}
                    placeholder="Cari nomor aju, dokumen, atau uraian barang..."
                    className="max-w-md"
                    onKeyDown={(e) => { if (e.key === 'Enter') searchPKBSI(); }}
                  />
                  <Button onClick={searchPKBSI} disabled={loadingPkbsi}>
                    <Search size={16} className="mr-1.5" />
                    Cari
                  </Button>
                </div>

                {/* Table */}
                {loadingPkbsi ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : pkbsiList.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-3 py-2 text-left font-medium">Nomor Aju</th>
                          <th className="px-3 py-2 text-left font-medium">No. Dokumen</th>
                          <th className="px-3 py-2 text-left font-medium">Jenis Barang</th>
                          <th className="px-3 py-2 text-left font-medium">HS Code</th>
                          <th className="px-3 py-2 text-left font-medium">Uraian Barang</th>
                          <th className="px-3 py-2 text-left font-medium">Instansi Pengawas</th>
                          <th className="px-3 py-2 text-left font-medium">No. Rekomendasi</th>
                          <th className="px-3 py-2 text-left font-medium">Kategori</th>
                          <th className="px-3 py-2 text-left font-medium">Status Lartas</th>
                          <th className="px-3 py-2 text-left font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pkbsiList.map((p) => (
                          <tr key={p.id} className="border-b hover:bg-muted/30">
                            <td className="px-3 py-2 font-mono text-xs">{p.nomor_aju}</td>
                            <td className="px-3 py-2 font-mono text-xs">{p.nomor_dokumen}</td>
                            <td className="px-3 py-2">
                              <div className="font-medium">{p.jenis_barang_strategis}</div>
                            </td>
                            <td className="px-3 py-2 font-mono text-xs">{p.hs_code}</td>
                            <td className="px-3 py-2 max-w-xs truncate" title={p.uraian_barang}>
                              {p.uraian_barang}
                            </td>
                            <td className="px-3 py-2">{p.instansi_pengawas}</td>
                            <td className="px-3 py-2 font-mono text-xs">{p.nomor_rekomendasi}</td>
                            <td className="px-3 py-2">
                              <Badge variant="outline" className="text-xs">
                                {p.kategori_lartas}
                              </Badge>
                            </td>
                            <td className="px-3 py-2">
                              {p.status_lartas === 'APPROVED' ? (
                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                  <CheckCircle2 size={12} className="mr-1" />
                                  Approved
                                </Badge>
                              ) : p.status_lartas === 'PENDING_REVIEW' ? (
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                  <AlertTriangle size={12} className="mr-1" />
                                  Pending
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                                  <XCircle size={12} className="mr-1" />
                                  Rejected
                                </Badge>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <StatusBadge status={p.status as any} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package size={56} className="mx-auto mb-4 opacity-40" />
                    <p className="text-lg font-medium">Belum ada data hasil sinkronisasi CEISA</p>
                    <p className="text-sm mt-2">Data PKBSI (Barang Strategis & Lartas) dari tabel <code>ceisa_pkbsi</code></p>
                    <p className="text-sm">Klik tombol <strong>"Sync CEISA"</strong> untuk mengambil data dari CEISA</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* =============== PANTAUAN ONLINE TAB =============== */}
          <TabsContent value="pantauan" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Pantauan Online - CEISA Monitoring</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Real-time monitoring komunikasi dengan CEISA
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchMonitoringData} disabled={loadingMonitoring}>
                  <RefreshCw size={14} className={loadingMonitoring ? 'mr-1.5 animate-spin' : 'mr-1.5'} />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="flex gap-3">
                  <Input
                    value={monitoringSearch}
                    onChange={(e) => setMonitoringSearch(e.target.value)}
                    placeholder="Cari nomor aju atau status..."
                    className="max-w-md"
                    onKeyDown={(e) => { if (e.key === 'Enter') searchMonitoring(); }}
                  />
                  <Button onClick={searchMonitoring} disabled={loadingMonitoring}>
                    <Search size={16} className="mr-1.5" />
                    Cari
                  </Button>
                </div>

                {/* Table */}
                {loadingMonitoring ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : monitoringData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-3 py-2 text-left font-medium">Nomor Aju</th>
                          <th className="px-3 py-2 text-left font-medium">Jenis Dokumen</th>
                          <th className="px-3 py-2 text-left font-medium">Tgl Kirim</th>
                          <th className="px-3 py-2 text-left font-medium">Tgl Respon</th>
                          <th className="px-3 py-2 text-right font-medium">Waktu Respon</th>
                          <th className="px-3 py-2 text-left font-medium">Status</th>
                          <th className="px-3 py-2 text-left font-medium">Kode</th>
                          <th className="px-3 py-2 text-left font-medium">Pesan</th>
                          <th className="px-3 py-2 text-left font-medium">Keterangan Penolakan</th>
                          <th className="px-3 py-2 text-right font-medium">Retry</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monitoringData.map((m) => (
                          <tr key={m.id} className={`border-b hover:bg-muted/30 ${m.status_terakhir === 'REJECTED' ? 'bg-red-50' : m.status_terakhir === 'PENDING' ? 'bg-yellow-50' : ''}`}>
                            <td className="px-3 py-2 font-mono text-xs">{m.nomor_aju}</td>
                            <td className="px-3 py-2">{m.jenis_dokumen}</td>
                            <td className="px-3 py-2 text-xs">
                              {m.tanggal_kirim_ceisa && new Date(m.tanggal_kirim_ceisa).toLocaleString('id-ID')}
                            </td>
                            <td className="px-3 py-2 text-xs">
                              {m.tanggal_respon_ceisa && new Date(m.tanggal_respon_ceisa).toLocaleString('id-ID')}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {m.waktu_respon_detik ? (
                                <span className={m.waktu_respon_detik > 60 ? 'text-red-600' : m.waktu_respon_detik > 30 ? 'text-yellow-600' : 'text-green-600'}>
                                  {m.waktu_respon_detik}s
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-3 py-2">
                              <div>
                                <StatusBadge status={m.status_terakhir as any} />
                              </div>
                              {m.status_detail && (
                                <div className="text-xs text-muted-foreground mt-1">{m.status_detail}</div>
                              )}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs">{m.kode_respon || '-'}</td>
                            <td className="px-3 py-2 max-w-xs truncate" title={m.pesan_respon}>
                              {m.pesan_respon || '-'}
                            </td>
                            <td className="px-3 py-2 max-w-xs">
                              {m.keterangan_penolakan && (
                                <div className="space-y-1">
                                  <div className="text-xs text-red-600 font-medium">{m.keterangan_penolakan}</div>
                                  {m.alasan_penolakan && (
                                    <div className="text-xs text-muted-foreground">{m.alasan_penolakan}</div>
                                  )}
                                  {m.saran_perbaikan && (
                                    <div className="text-xs text-blue-600">💡 {m.saran_perbaikan}</div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {m.jumlah_retry > 0 && (
                                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                                  {m.jumlah_retry}x
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Eye size={56} className="mx-auto mb-4 opacity-40" />
                    <p className="text-lg font-medium">Belum ada data hasil sinkronisasi CEISA</p>
                    <p className="text-sm mt-2">Data Pantauan Online dari tabel <code>ceisa_monitoring</code></p>
                    <p className="text-sm">Sistem akan mencatat komunikasi dengan CEISA secara otomatis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* =============== USER MANAGEMENT TAB =============== */}
          <TabsContent value="user" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">User Management - Single Core System</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Users size={56} className="mx-auto mb-4 opacity-40" />
                  <p className="text-lg font-medium">Belum ada data untuk tab ini</p>
                  <p className="text-sm mt-2">Manajemen pengguna Single Core System</p>
                  <p className="text-sm">Gunakan menu <strong>System → User Management</strong> untuk mengelola pengguna</p>
                  <a href="/user-management" className="inline-block mt-4">
                    <Button variant="outline" size="sm">
                      <Users size={14} className="mr-1.5" />
                      Buka User Management
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Detail Dialog */}
        <Dialog open={showDetail} onOpenChange={setShowDetail}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Dokumen Pabean</DialogTitle>
            </DialogHeader>
            {selectedDoc && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Nomor Pengajuan</Label>
                    <p className="font-mono mt-1">{selectedDoc.nomor_aju}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Tanggal Pengajuan</Label>
                    <p className="mt-1">{new Date(selectedDoc.tanggal_aju).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Kantor Pabean</Label>
                    <p className="mt-1">{selectedDoc.kantor_pabean}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Jenis Impor</Label>
                    <p className="mt-1">{selectedDoc.jenis_impor}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Cara Pembayaran</Label>
                    <p className="mt-1">{selectedDoc.cara_pembayaran}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <StatusBadge status={selectedDoc.status as any} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Voluntary Declaration Form Dialog */}
        <Dialog open={showVoluntaryForm} onOpenChange={setShowVoluntaryForm}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVoluntary ? 'Edit Voluntary Declaration' : 'New Voluntary Declaration'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nomor Aju *</Label>
                  <Input
                    value={voluntaryForm.nomor_aju}
                    onChange={(e) => setVoluntaryForm({ ...voluntaryForm, nomor_aju: e.target.value })}
                    placeholder="Nomor pengajuan"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal *</Label>
                  <Input
                    type="date"
                    value={voluntaryForm.tanggal}
                    onChange={(e) => setVoluntaryForm({ ...voluntaryForm, tanggal: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>NPWP</Label>
                  <Input
                    value={voluntaryForm.npwp}
                    onChange={(e) => setVoluntaryForm({ ...voluntaryForm, npwp: e.target.value })}
                    placeholder="00.000.000.0-000.000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nama Perusahaan</Label>
                  <Input
                    value={voluntaryForm.nama_perusahaan}
                    onChange={(e) => setVoluntaryForm({ ...voluntaryForm, nama_perusahaan: e.target.value })}
                    placeholder="Nama perusahaan"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Alamat</Label>
                <Textarea
                  value={voluntaryForm.alamat}
                  onChange={(e) => setVoluntaryForm({ ...voluntaryForm, alamat: e.target.value })}
                  placeholder="Alamat lengkap"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jenis Deklarasi</Label>
                  <Select
                    value={voluntaryForm.jenis_deklarasi}
                    onValueChange={(value) => setVoluntaryForm({ ...voluntaryForm, jenis_deklarasi: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SELF_ASSESSMENT">Self Assessment</SelectItem>
                      <SelectItem value="VOLUNTARY_DISCLOSURE">Voluntary Disclosure</SelectItem>
                      <SelectItem value="CORRECTION">Correction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Kantor Pabean</Label>
                  <Select
                    value={voluntaryForm.kode_kantor}
                    onValueChange={(value) => {
                      const kantor = kantorList.find(k => k.kode_kantor === value);
                      setVoluntaryForm({
                        ...voluntaryForm,
                        kode_kantor: value,
                        kantor_pabean: kantor?.nama_kantor || ''
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kantor" />
                    </SelectTrigger>
                    <SelectContent>
                      {kantorList.map((kantor) => (
                        <SelectItem key={kantor.id} value={kantor.kode_kantor}>
                          {kantor.kode_kantor} - {kantor.nama_kantor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nilai Barang</Label>
                  <Input
                    type="number"
                    value={voluntaryForm.nilai_barang}
                    onChange={(e) => setVoluntaryForm({ ...voluntaryForm, nilai_barang: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mata Uang</Label>
                  <Select
                    value={voluntaryForm.mata_uang}
                    onValueChange={(value) => setVoluntaryForm({ ...voluntaryForm, mata_uang: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IDR">IDR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="SGD">SGD</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Uraian</Label>
                <Textarea
                  value={voluntaryForm.uraian}
                  onChange={(e) => setVoluntaryForm({ ...voluntaryForm, uraian: e.target.value })}
                  placeholder="Uraian deklarasi"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Catatan</Label>
                <Textarea
                  value={voluntaryForm.catatan}
                  onChange={(e) => setVoluntaryForm({ ...voluntaryForm, catatan: e.target.value })}
                  placeholder="Catatan tambahan"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowVoluntaryForm(false)}>
                Batal
              </Button>
              <Button onClick={handleSaveVoluntary}>
                {editingVoluntary ? 'Update' : 'Simpan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Kendaraan Detail Dialog */}
        <Dialog open={showKendaraanDetail} onOpenChange={setShowKendaraanDetail}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Kendaraan Bermotor</DialogTitle>
            </DialogHeader>
            {selectedKendaraan && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="col-span-2 border-b pb-2">
                    <h4 className="font-semibold text-base">Informasi Dokumen</h4>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Nomor Aju</Label>
                    <p className="font-mono mt-1">{selectedKendaraan.nomor_aju}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Nomor PIB</Label>
                    <p className="font-mono mt-1">{selectedKendaraan.nomor_pib}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Tanggal PIB</Label>
                    <p className="mt-1">{selectedKendaraan.tanggal_pib && new Date(selectedKendaraan.tanggal_pib).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <StatusBadge status={selectedKendaraan.status as any} />
                    </div>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="col-span-3 border-b pb-2">
                    <h4 className="font-semibold text-base">Spesifikasi Kendaraan</h4>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Jenis</Label>
                    <p className="mt-1">{selectedKendaraan.jenis_kendaraan}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Merek</Label>
                    <p className="mt-1 font-semibold">{selectedKendaraan.merek}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Tipe</Label>
                    <p className="mt-1">{selectedKendaraan.tipe}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Tahun Pembuatan</Label>
                    <p className="mt-1">{selectedKendaraan.tahun_pembuatan}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Nomor Rangka</Label>
                    <p className="font-mono mt-1 text-xs">{selectedKendaraan.nomor_rangka}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Nomor Mesin</Label>
                    <p className="font-mono mt-1 text-xs">{selectedKendaraan.nomor_mesin}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Kapasitas Mesin</Label>
                    <p className="mt-1">{selectedKendaraan.kapasitas_mesin} cc</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Jumlah Silinder</Label>
                    <p className="mt-1">{selectedKendaraan.jumlah_silinder}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Warna</Label>
                    <p className="mt-1">{selectedKendaraan.warna}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Jumlah Roda</Label>
                    <p className="mt-1">{selectedKendaraan.jumlah_roda}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Kapasitas Penumpang</Label>
                    <p className="mt-1">{selectedKendaraan.jumlah_penumpang} orang</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Bahan Bakar</Label>
                    <p className="mt-1">{selectedKendaraan.bahan_bakar}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Kondisi</Label>
                    <p className="mt-1">{selectedKendaraan.kondisi}</p>
                  </div>
                </div>

                {/* Import Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="col-span-2 border-b pb-2">
                    <h4 className="font-semibold text-base">Informasi Importir</h4>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Nama Importir</Label>
                    <p className="mt-1">{selectedKendaraan.nama_importir}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">NPWP Importir</Label>
                    <p className="font-mono mt-1">{selectedKendaraan.npwp_importir}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Negara Asal</Label>
                    <p className="mt-1">{selectedKendaraan.negara_asal}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Pelabuhan</Label>
                    <p className="mt-1 text-xs">{selectedKendaraan.pelabuhan_muat} → {selectedKendaraan.pelabuhan_bongkar}</p>
                  </div>
                </div>

                {/* Tax Info */}
                <div className="grid grid-cols-5 gap-4 text-sm">
                  <div className="col-span-5 border-b pb-2">
                    <h4 className="font-semibold text-base">Pungutan</h4>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Nilai CIF</Label>
                    <p className="mt-1 font-semibold">{selectedKendaraan.mata_uang} {selectedKendaraan.nilai_cif?.toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Bea Masuk</Label>
                    <p className="mt-1">Rp {selectedKendaraan.bea_masuk?.toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">PPN</Label>
                    <p className="mt-1">Rp {selectedKendaraan.ppn?.toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">PPnBM</Label>
                    <p className="mt-1">Rp {selectedKendaraan.ppnbm?.toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">PPh</Label>
                    <p className="mt-1">Rp {selectedKendaraan.pph?.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
