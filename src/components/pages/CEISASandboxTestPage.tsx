import { useState, useEffect } from "react";
import { AppLayout } from "../layout/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Plus,
  FileText,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  CheckCircle,
  Copy,
  X,
  Check,
} from "lucide-react";

// Types for CEISA 4.0 document creation
type EntitasType = "IMPORTIR" | "EKSPORTIR" | "";
type JenisDocumentImportir = "BC20" | "BC24" | "";
type JenisDocumentEksportir = "BC30" | "";

// Tab names for CEISA 4.0 navigation
const TAB_NAMES = [
  "Header",
  "Entitas",
  "Dokumen",
  "Pengangkut",
  "Kemasan & Peti Kemas",
  "Transaksi",
  "Barang",
  "Pungutan",
  "Pernyataan",
] as const;

type TabName = (typeof TAB_NAMES)[number];

// Mapping jenis dokumen berdasarkan entitas
const JENIS_DOKUMEN_OPTIONS: Record<
  string,
  { value: string; label: string }[]
> = {
  IMPORTIR: [
    { value: "BC20", label: "BC 2.0 - Pemberitahuan Impor Barang" },
    { value: "BC24", label: "BC 2.4 - Pemberitahuan Impor Barang Tertentu" },
  ],
  EKSPORTIR: [{ value: "BC30", label: "BC 3.0 - Pemberitahuan Ekspor Barang" }],
};

// Hardcoded options for Header form
const PELABUHAN_OPTIONS = [
  { value: "IDACL", label: "IDACL - MARINA ANCOL" },
  { value: "IDABU", label: "IDABU - ATAMBUA" },
];

const KANTOR_PABEAN_OPTIONS = [
  { value: "160200", label: "160200 - KPPBC TMP A MARUNDA" },
  { value: "081400", label: "081400 - KPPBC TMP B ATAMBUA" },
];

const JENIS_PIB_OPTIONS = [{ value: "1", label: "1 - BIASA" }];

const JENIS_IMPOR_OPTIONS = [{ value: "1", label: "1 - UNTUK DIPAKAI" }];

const CARA_PEMBAYARAN_OPTIONS = [{ value: "1", label: "1 - BIASA / TUNAI" }];

// Hardcoded options for Entitas Importir
const JENIS_IDENTITAS_OPTIONS = [
  { value: "6", label: "6 - NPWP 16 DIGIT" },
  { value: "2", label: "2 - PASPOR" },
  { value: "3", label: "3 - KTP" },
  { value: "4", label: "4 - LAINNYA" },
];

const JENIS_PERIZINAN_OPTIONS = [{ value: "API_P", label: "API P" }];

const STATUS_IMPORTIR_OPTIONS = [{ value: "LAINNYA", label: "LAINNYA" }];

// Hardcoded options for Pemilik Barang
const AFILIASI_OPTIONS = [
  { value: "AFL", label: "AFL - Affiliated Company" },
  { value: "NON_AFL", label: "NON AFL - Non Affiliated" },
];

// Hardcoded options for Pengirim
const NEGARA_OPTIONS = [
  { value: "ID", label: "ID - INDONESIA" },
  { value: "IN", label: "IN - INDIA" },
  { value: "IO", label: "IO - BRITISH INDIAN OCEAN TERRITORY" },
  { value: "US", label: "US - UNITED STATES" },
  { value: "MY", label: "MY - MALAYSIA" },
  { value: "SG", label: "SG - SINGAPORE" },
  { value: "TH", label: "TH - THAILAND" },
  { value: "VN", label: "VN - VIETNAM" },
];

// Hardcoded options for Jenis Dokumen Lampiran
const JENIS_DOKUMEN_LAMPIRAN_OPTIONS = [
  { value: "740", label: "740 - AWB" },
  { value: "741", label: "741 - MASTER AWB" },
  { value: "380", label: "380 - INVOICE" },
];

// Saved document state after OK
interface DokumenBaruState {
  entitas: EntitasType;
  jenisDokumen: string;
  isBarangTidakBerwujud: boolean;
}

// Header form state
interface HeaderFormState {
  nomorAju: string;
  pelabuhanTujuan: string;
  kantorPabean: string;
  jenisPIB: string;
  jenisImpor: string;
  caraPembayaran: string;
}

// Importir form state
interface ImportirFormState {
  jenisIdentitas: string;
  nomorIdentitas: string;
  nitku: string;
  namaImportir: string;
  alamatImportir: string;
  jenisPerizinan: string;
  nomorPerizinan: string;
  statusImportir: string;
}

// Pemilik Barang form state
interface PemilikBarangFormState {
  jenisIdentitas: string;
  nomorIdentitas: string;
  nitku: string;
  namaPemilikBarang: string;
  alamatPemilikBarang: string;
  afiliasi: string;
}

// NPWP Pemusatan form state
interface NPWPPemusatanFormState {
  jenisIdentitas: string;
  nomorIdentitas: string;
  nama: string;
  alamat: string;
}

// Pengirim form state
interface PengirimFormState {
  nama: string;
  alamat: string;
  negara: string;
}

// Penjual form state
interface PenjualFormState {
  nama: string;
  alamat: string;
  negara: string;
}

// Dokumen Lampiran form state
interface DokumenLampiranFormState {
  seri: string;
  jenisDokumen: string;
  nomorDokumen: string;
  tanggal: string;
  fasilitas: string;
  izin: string;
  kantor: string;
  file: string;
}

// Function to generate Nomor Aju in CEISA format
const generateNomorAju = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;

  // Format: 000020-850092-YYYYMMDD-000001
  return `000020-850092-${dateStr}-000002`;
};

export default function CEISASandboxTestPage() {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state inside modal
  const [entitas, setEntitas] = useState<EntitasType>("");
  const [jenisDokumen, setJenisDokumen] = useState<string>("");
  const [isBarangTidakBerwujud, setIsBarangTidakBerwujud] = useState(false);

  // Saved state after OK
  const [savedDokumen, setSavedDokumen] = useState<DokumenBaruState | null>(
    null,
  );

  // Current step/tab
  const [currentTab, setCurrentTab] = useState<TabName>("Header");

  // Header form state
  const [headerForm, setHeaderForm] = useState<HeaderFormState>({
    nomorAju: "",
    pelabuhanTujuan: "",
    kantorPabean: "",
    jenisPIB: "1",
    jenisImpor: "1",
    caraPembayaran: "1",
  });

  // Importir form state
  const [importirForm, setImportirForm] = useState<ImportirFormState>({
    jenisIdentitas: "6",
    nomorIdentitas: "0850092743039000",
    nitku: "085009274303900000000000",
    namaImportir: "CAHAYA SEJATI TEKNOLOGI",
    alamatImportir: "JL. TERNATE NO.10C, CIDENG, GAMBIR 000/000",
    jenisPerizinan: "API_P",
    nomorPerizinan: "8120216131092",
    statusImportir: "LAINNYA",
  });

  // Pemilik Barang form state
  const [pemilikBarangForm, setPemilikBarangForm] =
    useState<PemilikBarangFormState>({
      jenisIdentitas: "6",
      nomorIdentitas: "0850092743039000",
      nitku: "085009274303900000000000",
      namaPemilikBarang: "CAHAYA SEJATI TEKNOLOGI",
      alamatPemilikBarang: "JL. TERNATE NO.10C, CIDENG, GAMBIR 000/000",
      afiliasi: "AFL",
    });

  // NPWP Pemusatan form state
  const [npwpPemusatanForm, setNpwpPemusatanForm] =
    useState<NPWPPemusatanFormState>({
      jenisIdentitas: "3",
      nomorIdentitas: "",
      nama: "",
      alamat: "",
    });

  // Pengirim form state
  const [pengirimForm, setPengirimForm] = useState<PengirimFormState>({
    nama: "",
    alamat: "",
    negara: "",
  });

  // Penjual form state
  const [penjualForm, setPenjualForm] = useState<PenjualFormState>({
    nama: "",
    alamat: "",
    negara: "",
  });

  // Dokumen Lampiran state
  const [dokumenLampiranList, setDokumenLampiranList] = useState<
    DokumenLampiranFormState[]
  >([]);
  const [showDokumenDialog, setShowDokumenDialog] = useState(false);
  const [currentDokumenForm, setCurrentDokumenForm] =
    useState<DokumenLampiranFormState>({
      seri: "1",
      jenisDokumen: "",
      nomorDokumen: "",
      tanggal: "",
      fasilitas: "",
      izin: "",
      kantor: "",
      file: "",
    });

  // State for showing next step placeholder
  const [showNextStep, setShowNextStep] = useState(false);

  // Generate Nomor Aju when entering Step 2 (Header)
  useEffect(() => {
    if (savedDokumen && !headerForm.nomorAju) {
      setHeaderForm((prev) => ({
        ...prev,
        nomorAju: generateNomorAju(),
      }));
    }
  }, [savedDokumen]);

  // Handle entitas change - reset jenis dokumen
  const handleEntitasChange = (value: EntitasType) => {
    setEntitas(value);
    setJenisDokumen(""); // Reset jenis dokumen when entitas changes
  };

  // Open modal
  const handleOpenModal = () => {
    // Reset form state when opening
    setEntitas("");
    setJenisDokumen("");
    setIsBarangTidakBerwujud(false);
    setIsModalOpen(true);
  };

  // Cancel - close modal without saving
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  // OK - save state and close modal
  const handleOk = () => {
    if (!entitas || !jenisDokumen) {
      return; // Don't allow OK if required fields are empty
    }

    setSavedDokumen({
      entitas,
      jenisDokumen,
      isBarangTidakBerwujud,
    });
    // Reset header form with new Nomor Aju
    setHeaderForm({
      nomorAju: generateNomorAju(),
      pelabuhanTujuan: "",
      kantorPabean: "",
      jenisPIB: "1",
      jenisImpor: "1",
      caraPembayaran: "1",
    });
    setCurrentTab("Header");
    setShowNextStep(false);
    setIsModalOpen(false);
  };

  // Handle Selanjutnya click from Header
  const handleSelanjutnyaHeader = () => {
    setCurrentTab("Entitas");
  };

  // Handle Sebelumnya click from Entitas (back to Header)
  const handleSebelumnyaEntitas = () => {
    setCurrentTab("Header");
  };

  // Handle Selanjutnya click from Entitas
  const handleSelanjutnyaEntitas = () => {
    setShowNextStep(true);
    setCurrentTab("Dokumen");
  };

  // Handle Sebelumnya from Dokumen (back to Entitas)
  const handleSebelumnyaDokumen = () => {
    setCurrentTab("Entitas");
  };

  // Handle Selanjutnya from Dokumen
  const handleSelanjutnyaDokumen = () => {
    setCurrentTab("Pengangkut");
  };

  // Handle add Dokumen
  const handleAddDokumen = () => {
    setShowDokumenDialog(true);
    setCurrentDokumenForm({
      seri: (dokumenLampiranList.length + 1).toString(),
      jenisDokumen: "",
      nomorDokumen: "",
      tanggal: "",
      fasilitas: "",
      izin: "",
      kantor: "",
      file: "",
    });
  };

  // Handle save Dokumen
  const handleSaveDokumen = () => {
    if (!currentDokumenForm.jenisDokumen || !currentDokumenForm.nomorDokumen) {
      return; // Don't save if required fields are empty
    }
    setDokumenLampiranList([...dokumenLampiranList, currentDokumenForm]);
    setShowDokumenDialog(false);
  };

  // Handle cancel Dokumen dialog
  const handleCancelDokumen = () => {
    setShowDokumenDialog(false);
  };

  // Handle Salin Importir - copy Importir data to Pemilik Barang
  const handleSalinImportir = () => {
    setPemilikBarangForm({
      jenisIdentitas: importirForm.jenisIdentitas,
      nomorIdentitas: importirForm.nomorIdentitas,
      nitku: importirForm.nitku,
      namaPemilikBarang: importirForm.namaImportir,
      alamatPemilikBarang: importirForm.alamatImportir,
      afiliasi: "AFL",
    });
  };

  // Handle Salin Importir for NPWP Pemusatan
  const handleSalinImportirNPWP = () => {
    setNpwpPemusatanForm({
      jenisIdentitas: importirForm.jenisIdentitas,
      nomorIdentitas: importirForm.nomorIdentitas,
      nama: importirForm.namaImportir,
      alamat: importirForm.alamatImportir,
    });
  };

  // Handle Salin Data Pengirim - copy Pengirim data to Penjual
  const handleSalinDataPengirim = () => {
    setPenjualForm({
      nama: pengirimForm.nama,
      alamat: pengirimForm.alamat,
      negara: pengirimForm.negara,
    });
  };

  // Handle back to start
  const handleBatal = () => {
    setSavedDokumen(null);
    setShowNextStep(false);
    setHeaderForm({
      nomorAju: "",
      pelabuhanTujuan: "",
      kantorPabean: "",
      jenisPIB: "1",
      jenisImpor: "1",
      caraPembayaran: "1",
    });
  };

  // Get available jenis dokumen options based on entitas
  const getJenisDokumenOptions = () => {
    if (!entitas) return [];
    return JENIS_DOKUMEN_OPTIONS[entitas] || [];
  };

  // Check if form is valid
  const isFormValid = entitas !== "" && jenisDokumen !== "";

  // Check if header form is valid for Selanjutnya
  const isHeaderValid =
    headerForm.pelabuhanTujuan !== "" && headerForm.kantorPabean !== "";

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header with Dokumen Baru button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              CEISA Sandbox Test
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Testing tool untuk integrasi CEISA 4.0 Sandbox
            </p>
          </div>

          {/* Tombol Dokumen Baru - kanan atas */}
          <Button
            onClick={handleOpenModal}
            className="bg-[#1E3A5F] hover:bg-[#2d4f7a]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Dokumen Baru
          </Button>
        </div>

        {/* Warning Banner */}
        <Alert
          variant="destructive"
          className="bg-amber-50 border-amber-300 text-amber-800"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-amber-800 font-medium">
            Sandbox Testing Only
          </AlertTitle>
          <AlertDescription className="text-amber-700">
            ⚠️ Ini hanya untuk testing Sandbox CEISA, bukan data produksi. Data
            yang dikirim tidak akan mempengaruhi sistem produksi.
          </AlertDescription>
        </Alert>

        {/* Show saved document state with Tab Navigation or placeholder */}
        {savedDokumen ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {savedDokumen.jenisDokumen} - Dokumen Baru
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {savedDokumen.entitas} | Barang Tidak Berwujud:{" "}
                    {savedDokumen.isBarangTidakBerwujud ? "Ya" : "Tidak"}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleBatal}>
                  Batal
                </Button>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="pt-4">
              {/* Tab Navigation - CEISA 4.0 Style */}
              <Tabs
                value={currentTab}
                onValueChange={(v) => setCurrentTab(v as TabName)}
              >
                <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 bg-slate-100 p-1">
                  {TAB_NAMES.map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      disabled={
                        tab !== "Header" &&
                        tab !== "Entitas" &&
                        tab !== "Dokumen"
                      }
                      className="data-[state=active]:bg-[#1E3A5F] data-[state=active]:text-white text-xs px-3 py-1.5"
                    >
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Tab Content: Header */}
                <TabsContent value="Header" className="mt-6 space-y-6">
                  {/* SECTION 1 — Pengajuan */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide border-b pb-2">
                      Pengajuan
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="nomorAju"
                          className="text-sm font-medium"
                        >
                          Nomor Aju
                        </Label>
                        <Input
                          id="nomorAju"
                          value={headerForm.nomorAju}
                          readOnly
                          className="bg-slate-100 font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Nomor pengajuan di-generate otomatis oleh sistem
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2 — Kantor Pabean */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide border-b pb-2">
                      Kantor Pabean
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="pelabuhanTujuan"
                          className="text-sm font-medium"
                        >
                          Pelabuhan Tujuan{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={headerForm.pelabuhanTujuan}
                          onValueChange={(value) =>
                            setHeaderForm((prev) => ({
                              ...prev,
                              pelabuhanTujuan: value,
                            }))
                          }
                        >
                          <SelectTrigger id="pelabuhanTujuan">
                            <SelectValue placeholder="Pilih Pelabuhan Tujuan" />
                          </SelectTrigger>
                          <SelectContent>
                            {PELABUHAN_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="kantorPabean"
                          className="text-sm font-medium"
                        >
                          Kantor Pabean <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={headerForm.kantorPabean}
                          onValueChange={(value) =>
                            setHeaderForm((prev) => ({
                              ...prev,
                              kantorPabean: value,
                            }))
                          }
                        >
                          <SelectTrigger id="kantorPabean">
                            <SelectValue placeholder="Pilih Kantor Pabean" />
                          </SelectTrigger>
                          <SelectContent>
                            {KANTOR_PABEAN_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3 — Keterangan Lain */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-[#1E3A5F] uppercase tracking-wide border-b pb-2">
                      Keterangan Lain
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="jenisPIB"
                          className="text-sm font-medium"
                        >
                          Jenis PIB
                        </Label>
                        <Select
                          value={headerForm.jenisPIB}
                          onValueChange={(value) =>
                            setHeaderForm((prev) => ({
                              ...prev,
                              jenisPIB: value,
                            }))
                          }
                        >
                          <SelectTrigger id="jenisPIB">
                            <SelectValue placeholder="Pilih Jenis PIB" />
                          </SelectTrigger>
                          <SelectContent>
                            {JENIS_PIB_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="jenisImpor"
                          className="text-sm font-medium"
                        >
                          Jenis Impor
                        </Label>
                        <Select
                          value={headerForm.jenisImpor}
                          onValueChange={(value) =>
                            setHeaderForm((prev) => ({
                              ...prev,
                              jenisImpor: value,
                            }))
                          }
                        >
                          <SelectTrigger id="jenisImpor">
                            <SelectValue placeholder="Pilih Jenis Impor" />
                          </SelectTrigger>
                          <SelectContent>
                            {JENIS_IMPOR_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="caraPembayaran"
                          className="text-sm font-medium"
                        >
                          Cara Pembayaran
                        </Label>
                        <Select
                          value={headerForm.caraPembayaran}
                          onValueChange={(value) =>
                            setHeaderForm((prev) => ({
                              ...prev,
                              caraPembayaran: value,
                            }))
                          }
                        >
                          <SelectTrigger id="caraPembayaran">
                            <SelectValue placeholder="Pilih Cara Pembayaran" />
                          </SelectTrigger>
                          <SelectContent>
                            {CARA_PEMBAYARAN_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      onClick={handleSelanjutnyaHeader}
                      disabled={!isHeaderValid}
                      className="bg-[#1E3A5F] hover:bg-[#2d4f7a]"
                    >
                      Selanjutnya
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </TabsContent>

                {/* Tab Content: Entitas - Importir */}
                <TabsContent value="Entitas" className="mt-6 space-y-6">
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold text-[#1E3A5F]">
                          Importir
                        </CardTitle>
                        <Button variant="outline" size="sm" className="text-xs">
                          Referensi
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* 1. Nomor Identitas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="jenisIdentitas"
                            className="text-sm font-medium"
                          >
                            Jenis Identitas{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={importirForm.jenisIdentitas}
                            onValueChange={(value) =>
                              setImportirForm((prev) => ({
                                ...prev,
                                jenisIdentitas: value,
                              }))
                            }
                          >
                            <SelectTrigger id="jenisIdentitas">
                              <SelectValue placeholder="Pilih Jenis Identitas" />
                            </SelectTrigger>
                            <SelectContent>
                              {JENIS_IDENTITAS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="nomorIdentitas"
                            className="text-sm font-medium"
                          >
                            Nomor Identitas{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="nomorIdentitas"
                            value={importirForm.nomorIdentitas}
                            onChange={(e) =>
                              setImportirForm((prev) => ({
                                ...prev,
                                nomorIdentitas: e.target.value,
                              }))
                            }
                            className="font-mono"
                          />
                        </div>
                      </div>

                      {/* 2. NITKU */}
                      <div className="space-y-2">
                        <Label htmlFor="nitku" className="text-sm font-medium">
                          NITKU
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="nitku"
                            value={importirForm.nitku}
                            onChange={(e) =>
                              setImportirForm((prev) => ({
                                ...prev,
                                nitku: e.target.value,
                              }))
                            }
                            className="font-mono flex-1"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="flex-shrink-0"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* 3. Nama Importir */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="namaImportir"
                          className="text-sm font-medium"
                        >
                          Nama Importir <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="namaImportir"
                          value={importirForm.namaImportir}
                          onChange={(e) =>
                            setImportirForm((prev) => ({
                              ...prev,
                              namaImportir: e.target.value,
                            }))
                          }
                        />
                      </div>

                      {/* 4. Alamat Importir */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="alamatImportir"
                          className="text-sm font-medium"
                        >
                          Alamat Importir{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="alamatImportir"
                          value={importirForm.alamatImportir}
                          onChange={(e) =>
                            setImportirForm((prev) => ({
                              ...prev,
                              alamatImportir: e.target.value,
                            }))
                          }
                          rows={3}
                        />
                      </div>

                      {/* 5. API / NIB */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="jenisPerizinan"
                              className="text-sm font-medium"
                            >
                              Jenis Perizinan
                            </Label>
                            <Select
                              value={importirForm.jenisPerizinan}
                              onValueChange={(value) =>
                                setImportirForm((prev) => ({
                                  ...prev,
                                  jenisPerizinan: value,
                                }))
                              }
                            >
                              <SelectTrigger id="jenisPerizinan">
                                <SelectValue placeholder="Pilih Jenis Perizinan" />
                              </SelectTrigger>
                              <SelectContent>
                                {JENIS_PERIZINAN_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="nomorPerizinan"
                              className="text-sm font-medium"
                            >
                              Nomor
                            </Label>
                            <Input
                              id="nomorPerizinan"
                              value={importirForm.nomorPerizinan}
                              onChange={(e) =>
                                setImportirForm((prev) => ({
                                  ...prev,
                                  nomorPerizinan: e.target.value,
                                }))
                              }
                              className="font-mono"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                          <CheckCircle className="h-4 w-4 flex-shrink-0" />
                          <span className="font-medium">NIB Valid</span>
                        </div>
                      </div>

                      {/* 6. Status Importir */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="statusImportir"
                          className="text-sm font-medium"
                        >
                          Status Importir
                        </Label>
                        <Select
                          value={importirForm.statusImportir}
                          onValueChange={(value) =>
                            setImportirForm((prev) => ({
                              ...prev,
                              statusImportir: value,
                            }))
                          }
                        >
                          <SelectTrigger
                            id="statusImportir"
                            className="w-full md:w-64"
                          >
                            <SelectValue placeholder="Pilih Status Importir" />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_IMPORTIR_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pemilik Barang Section */}
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold text-[#1E3A5F]">
                          Pemilik Barang
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={handleSalinImportir}
                          >
                            Salin Importir
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            Referensi
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* 1. Nomor Identitas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="pemilikJenisIdentitas"
                            className="text-sm font-medium"
                          >
                            Jenis Identitas{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={pemilikBarangForm.jenisIdentitas}
                            onValueChange={(value) =>
                              setPemilikBarangForm((prev) => ({
                                ...prev,
                                jenisIdentitas: value,
                              }))
                            }
                          >
                            <SelectTrigger id="pemilikJenisIdentitas">
                              <SelectValue placeholder="Pilih Jenis Identitas" />
                            </SelectTrigger>
                            <SelectContent>
                              {JENIS_IDENTITAS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="pemilikNomorIdentitas"
                            className="text-sm font-medium"
                          >
                            Nomor Identitas{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="pemilikNomorIdentitas"
                            value={pemilikBarangForm.nomorIdentitas}
                            onChange={(e) =>
                              setPemilikBarangForm((prev) => ({
                                ...prev,
                                nomorIdentitas: e.target.value,
                              }))
                            }
                            className="font-mono"
                          />
                        </div>
                      </div>

                      {/* 2. NITKU */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="pemilikNitku"
                          className="text-sm font-medium"
                        >
                          NITKU
                        </Label>
                        <Input
                          id="pemilikNitku"
                          value={pemilikBarangForm.nitku}
                          onChange={(e) =>
                            setPemilikBarangForm((prev) => ({
                              ...prev,
                              nitku: e.target.value,
                            }))
                          }
                          className="font-mono"
                        />
                      </div>

                      {/* 3. Nama Pemilik Barang */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="namaPemilikBarang"
                          className="text-sm font-medium"
                        >
                          Nama Pemilik Barang{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="namaPemilikBarang"
                          value={pemilikBarangForm.namaPemilikBarang}
                          onChange={(e) =>
                            setPemilikBarangForm((prev) => ({
                              ...prev,
                              namaPemilikBarang: e.target.value,
                            }))
                          }
                        />
                      </div>

                      {/* 4. Alamat Pemilik Barang */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="alamatPemilikBarang"
                          className="text-sm font-medium"
                        >
                          Alamat Pemilik Barang{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="alamatPemilikBarang"
                          value={pemilikBarangForm.alamatPemilikBarang}
                          onChange={(e) =>
                            setPemilikBarangForm((prev) => ({
                              ...prev,
                              alamatPemilikBarang: e.target.value,
                            }))
                          }
                          rows={3}
                        />
                      </div>

                      {/* 5. Afiliasi */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="afiliasi"
                          className="text-sm font-medium"
                        >
                          Afiliasi
                        </Label>
                        <Select
                          value={pemilikBarangForm.afiliasi}
                          onValueChange={(value) =>
                            setPemilikBarangForm((prev) => ({
                              ...prev,
                              afiliasi: value,
                            }))
                          }
                        >
                          <SelectTrigger
                            id="afiliasi"
                            className="w-full md:w-64"
                          >
                            <SelectValue placeholder="Pilih Afiliasi" />
                          </SelectTrigger>
                          <SelectContent>
                            {AFILIASI_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* NPWP Pemusatan Section */}
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold text-[#1E3A5F]">
                          NPWP Pemusatan
                        </CardTitle>
                        <Button
                          variant="default"
                          size="sm"
                          className="text-xs bg-[#0ea5e9] hover:bg-[#0284c7]"
                          onClick={handleSalinImportirNPWP}
                        >
                          Salin Importir
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* 1. Nomor Identitas */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Nomor Identitas
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Select
                            value={npwpPemusatanForm.jenisIdentitas}
                            onValueChange={(value) =>
                              setNpwpPemusatanForm((prev) => ({
                                ...prev,
                                jenisIdentitas: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Jenis Identitas" />
                            </SelectTrigger>
                            <SelectContent>
                              {JENIS_IDENTITAS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="space-y-1">
                            <Input
                              value={npwpPemusatanForm.nomorIdentitas}
                              onChange={(e) =>
                                setNpwpPemusatanForm((prev) => ({
                                  ...prev,
                                  nomorIdentitas: e.target.value,
                                }))
                              }
                              placeholder="Masukkan 16 digit nomor"
                              className={`font-mono ${!npwpPemusatanForm.nomorIdentitas ? "border-red-300" : ""}`}
                            />
                            {!npwpPemusatanForm.nomorIdentitas && (
                              <p className="text-xs text-red-500">
                                {npwpPemusatanForm.jenisIdentitas === "3"
                                  ? "KTP"
                                  : "Nomor identitas"}{" "}
                                wajib diisi
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 2. Nama */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="npwpNama"
                          className="text-sm font-medium"
                        >
                          Nama
                        </Label>
                        <Input
                          id="npwpNama"
                          value={npwpPemusatanForm.nama}
                          onChange={(e) =>
                            setNpwpPemusatanForm((prev) => ({
                              ...prev,
                              nama: e.target.value,
                            }))
                          }
                        />
                      </div>

                      {/* 3. Alamat */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="npwpAlamat"
                          className="text-sm font-medium"
                        >
                          Alamat
                        </Label>
                        <Textarea
                          id="npwpAlamat"
                          value={npwpPemusatanForm.alamat}
                          onChange={(e) =>
                            setNpwpPemusatanForm((prev) => ({
                              ...prev,
                              alamat: e.target.value,
                            }))
                          }
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pengirim Section */}
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold text-[#1E3A5F]">
                        Pengirim
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* 1. Nama */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="pengirimNama"
                          className="text-sm font-medium"
                        >
                          Nama
                        </Label>
                        <Input
                          id="pengirimNama"
                          value={pengirimForm.nama}
                          onChange={(e) =>
                            setPengirimForm((prev) => ({
                              ...prev,
                              nama: e.target.value,
                            }))
                          }
                        />
                      </div>

                      {/* 2. Alamat */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="pengirimAlamat"
                          className="text-sm font-medium"
                        >
                          Alamat
                        </Label>
                        <Textarea
                          id="pengirimAlamat"
                          value={pengirimForm.alamat}
                          onChange={(e) =>
                            setPengirimForm((prev) => ({
                              ...prev,
                              alamat: e.target.value,
                            }))
                          }
                          rows={3}
                        />
                      </div>

                      {/* 3. Negara */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="pengirimNegara"
                          className="text-sm font-medium"
                        >
                          Negara <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={pengirimForm.negara}
                          onValueChange={(value) =>
                            setPengirimForm((prev) => ({
                              ...prev,
                              negara: value,
                            }))
                          }
                        >
                          <SelectTrigger
                            id="pengirimNegara"
                            className={
                              !pengirimForm.negara ? "border-red-300" : ""
                            }
                          >
                            <SelectValue placeholder="Pilih Negara" />
                          </SelectTrigger>
                          <SelectContent>
                            {NEGARA_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!pengirimForm.negara && (
                          <p className="text-xs text-red-500">
                            Negara wajib diisi
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Penjual Section */}
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold text-[#1E3A5F]">
                          Penjual
                        </CardTitle>
                        <Button
                          variant="default"
                          size="sm"
                          className="text-xs bg-[#0ea5e9] hover:bg-[#0284c7]"
                          onClick={handleSalinDataPengirim}
                        >
                          Salin Data Pengirim
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* 1. Nama */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="penjualNama"
                          className="text-sm font-medium"
                        >
                          Nama
                        </Label>
                        <Input
                          id="penjualNama"
                          value={penjualForm.nama}
                          onChange={(e) =>
                            setPenjualForm((prev) => ({
                              ...prev,
                              nama: e.target.value,
                            }))
                          }
                        />
                      </div>

                      {/* 2. Alamat */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="penjualAlamat"
                          className="text-sm font-medium"
                        >
                          Alamat
                        </Label>
                        <Textarea
                          id="penjualAlamat"
                          value={penjualForm.alamat}
                          onChange={(e) =>
                            setPenjualForm((prev) => ({
                              ...prev,
                              alamat: e.target.value,
                            }))
                          }
                          rows={3}
                        />
                      </div>

                      {/* 3. Negara */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="penjualNegara"
                          className="text-sm font-medium"
                        >
                          Negara
                        </Label>
                        <Select
                          value={penjualForm.negara}
                          onValueChange={(value) =>
                            setPenjualForm((prev) => ({
                              ...prev,
                              negara: value,
                            }))
                          }
                        >
                          <SelectTrigger id="penjualNegara">
                            <SelectValue placeholder="Pilih Negara" />
                          </SelectTrigger>
                          <SelectContent>
                            {NEGARA_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-4 border-t">
                    <Button variant="outline" onClick={handleSebelumnyaEntitas}>
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Sebelumnya
                    </Button>
                    <Button
                      onClick={handleSelanjutnyaEntitas}
                      className="bg-[#1E3A5F] hover:bg-[#2d4f7a]"
                    >
                      Selanjutnya
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </TabsContent>

                {/* Tab Content: Dokumen */}
                <TabsContent value="Dokumen" className="mt-6">
                  {/* Warning Banner */}
                  <Alert className="mb-6 bg-yellow-50 border-yellow-200">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-sm text-gray-700">
                      Wajib Melampirkan Dokumen Invoice dan Dokumen B/L atau AWB
                    </AlertDescription>
                  </Alert>

                  {/* Dokumen Lampiran Section */}
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold text-[#1E3A5F]">
                          Dokumen Lampiran
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            Urutkan
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs bg-[#0ea5e9] hover:bg-[#0284c7]"
                            onClick={handleAddDokumen}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Tambah
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {dokumenLampiranList.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No Data</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2 text-sm font-medium text-gray-600">
                                  Seri
                                </th>
                                <th className="text-left p-2 text-sm font-medium text-gray-600">
                                  Jenis
                                </th>
                                <th className="text-left p-2 text-sm font-medium text-gray-600">
                                  Nomor
                                </th>
                                <th className="text-left p-2 text-sm font-medium text-gray-600">
                                  Tanggal
                                </th>
                                <th className="text-left p-2 text-sm font-medium text-gray-600">
                                  Fasilitas
                                </th>
                                <th className="text-left p-2 text-sm font-medium text-gray-600">
                                  Izin
                                </th>
                                <th className="text-left p-2 text-sm font-medium text-gray-600">
                                  Kantor
                                </th>
                                <th className="text-left p-2 text-sm font-medium text-gray-600">
                                  File
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {dokumenLampiranList.map((dok, idx) => (
                                <tr
                                  key={idx}
                                  className="border-b hover:bg-slate-50"
                                >
                                  <td className="p-2 text-sm">{dok.seri}</td>
                                  <td className="p-2 text-sm">
                                    {dok.jenisDokumen}
                                  </td>
                                  <td className="p-2 text-sm font-mono">
                                    {dok.nomorDokumen}
                                  </td>
                                  <td className="p-2 text-sm">{dok.tanggal}</td>
                                  <td className="p-2 text-sm">
                                    {dok.fasilitas}
                                  </td>
                                  <td className="p-2 text-sm">{dok.izin}</td>
                                  <td className="p-2 text-sm">{dok.kantor}</td>
                                  <td className="p-2 text-sm">{dok.file}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-4 border-t">
                    <Button variant="outline" onClick={handleSebelumnyaDokumen}>
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Sebelumnya
                    </Button>
                    <Button
                      onClick={handleSelanjutnyaDokumen}
                      className="bg-[#1E3A5F] hover:bg-[#2d4f7a]"
                    >
                      Selanjutnya
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mulai Buat Dokumen</CardTitle>
              <CardDescription>
                Klik tombol "Dokumen Baru" di kanan atas untuk memulai proses
                pembuatan dokumen CEISA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <p className="text-slate-500">
                  Belum ada dokumen yang dibuat. Klik tombol "Dokumen Baru"
                  untuk memulai.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal Dokumen Baru - CEISA 4.0 Style */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Dokumen Baru
              </DialogTitle>
              <DialogDescription>
                Pilih entitas dan jenis dokumen untuk memulai pembuatan dokumen
                baru
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Entitas Select - Wajib */}
              <div className="space-y-2">
                <Label htmlFor="entitas" className="text-sm font-medium">
                  Entitas <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={entitas}
                  onValueChange={(value: EntitasType) =>
                    handleEntitasChange(value)
                  }
                >
                  <SelectTrigger id="entitas" className="w-full">
                    <SelectValue placeholder="Pilih Entitas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMPORTIR">IMPORTIR</SelectItem>
                    <SelectItem value="EKSPORTIR">EKSPORTIR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Jenis Dokumen Select - Conditional based on Entitas */}
              <div className="space-y-2">
                <Label htmlFor="jenisDokumen" className="text-sm font-medium">
                  Jenis Dokumen <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={jenisDokumen}
                  onValueChange={setJenisDokumen}
                  disabled={!entitas}
                >
                  <SelectTrigger id="jenisDokumen" className="w-full">
                    <SelectValue
                      placeholder={
                        entitas
                          ? "Pilih Jenis Dokumen"
                          : "Pilih Entitas terlebih dahulu"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {getJenisDokumenOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Checkbox - Khusus Barang Tidak Berwujud */}
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="barangTidakBerwujud"
                  checked={isBarangTidakBerwujud}
                  onCheckedChange={(checked) =>
                    setIsBarangTidakBerwujud(checked === true)
                  }
                />
                <Label
                  htmlFor="barangTidakBerwujud"
                  className="text-sm font-normal cursor-pointer"
                >
                  Khusus Barang Tidak Berwujud
                </Label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleOk}
                className="bg-[#1E3A5F] hover:bg-[#2d4f7a]"
                disabled={!entitas || !jenisDokumen}
              >
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Dokumen Lampiran */}
        <Dialog open={showDokumenDialog} onOpenChange={setShowDokumenDialog}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Dokumen Lampiran
              </DialogTitle>
            </DialogHeader>

            <Card className="border-slate-200">
              <CardContent className="pt-4 space-y-5">
                {/* Seri */}
                <div className="space-y-2">
                  <Label htmlFor="seri" className="text-sm font-medium">
                    Seri
                  </Label>
                  <Input
                    id="seri"
                    value={currentDokumenForm.seri}
                    onChange={(e) =>
                      setCurrentDokumenForm((prev) => ({
                        ...prev,
                        seri: e.target.value,
                      }))
                    }
                    disabled
                    className="bg-slate-50"
                  />
                </div>

                {/* Jenis Dokumen */}
                <div className="space-y-2">
                  <Label
                    htmlFor="jenisDokumenLampiran"
                    className="text-sm font-medium"
                  >
                    Jenis Dokumen
                  </Label>
                  <Select
                    value={currentDokumenForm.jenisDokumen}
                    onValueChange={(value) =>
                      setCurrentDokumenForm((prev) => ({
                        ...prev,
                        jenisDokumen: value,
                        fasilitas: "",
                      }))
                    }
                  >
                    <SelectTrigger
                      id="jenisDokumenLampiran"
                      className={
                        !currentDokumenForm.jenisDokumen ? "border-red-300" : ""
                      }
                    >
                      <SelectValue placeholder="Pilih Jenis Dokumen" />
                    </SelectTrigger>
                    <SelectContent>
                      {JENIS_DOKUMEN_LAMPIRAN_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!currentDokumenForm.jenisDokumen && (
                    <p className="text-xs text-red-500">Jenis Dokumen Kosong</p>
                  )}
                </div>

                {/* Nomor Dokumen + Tanggal Dokumen - two columns */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="nomorDokumenLampiran"
                      className="text-sm font-medium"
                    >
                      Nomor Dokumen
                    </Label>
                    <Input
                      id="nomorDokumenLampiran"
                      value={currentDokumenForm.nomorDokumen}
                      onChange={(e) =>
                        setCurrentDokumenForm((prev) => ({
                          ...prev,
                          nomorDokumen: e.target.value,
                        }))
                      }
                      className={
                        !currentDokumenForm.nomorDokumen ? "border-red-300" : ""
                      }
                    />
                    {!currentDokumenForm.nomorDokumen && (
                      <p className="text-xs text-red-500">
                        Nomor Dokumen Kosong
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="tanggalDokumen"
                      className="text-sm font-medium"
                    >
                      Tanggal Dokumen
                    </Label>
                    <Input
                      id="tanggalDokumen"
                      type="date"
                      placeholder="Select date"
                      value={currentDokumenForm.tanggal}
                      onChange={(e) =>
                        setCurrentDokumenForm((prev) => ({
                          ...prev,
                          tanggal: e.target.value,
                        }))
                      }
                      className={
                        !currentDokumenForm.tanggal ? "border-red-300" : ""
                      }
                    />
                    {!currentDokumenForm.tanggal && (
                      <p className="text-xs text-red-500">
                        Tanggal Dokumen Kosong
                      </p>
                    )}
                  </div>
                </div>

                {/* Fasilitas Dokumen - only for 0282 */}
                {currentDokumenForm.jenisDokumen === "0282" && (
                  <>
                    <div className="space-y-2">
                      <Label
                        htmlFor="fasilitasDokumen"
                        className="text-sm font-medium"
                      >
                        Fasilitas Dokumen
                      </Label>
                      <Select
                        value={currentDokumenForm.fasilitas}
                        onValueChange={(value) =>
                          setCurrentDokumenForm((prev) => ({
                            ...prev,
                            fasilitas: value,
                          }))
                        }
                      >
                        <SelectTrigger
                          id="fasilitasDokumen"
                          className={
                            !currentDokumenForm.fasilitas
                              ? "border-red-300"
                              : ""
                          }
                        >
                          <SelectValue placeholder="Pilih Fasilitas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="KB">
                            KB - Kawasan Berikat
                          </SelectItem>
                          <SelectItem value="KITE">
                            KITE - Kemudahan Impor Tujuan Ekspor
                          </SelectItem>
                          <SelectItem value="GB">
                            GB - Gudang Berikat
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {!currentDokumenForm.fasilitas && (
                        <p className="text-xs text-red-500">
                          Dokumen Fasilitas/Izin Kosong
                        </p>
                      )}
                    </div>

                    {/* Barang Fasilitas Section */}
                    <Card className="border-[#0ea5e9] border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-semibold text-slate-700">
                            Barang Fasilitas
                          </CardTitle>
                          <Button
                            size="sm"
                            className="text-xs bg-[#0ea5e9] hover:bg-[#0284c7]"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Tambah
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-slate-50 rounded-lg p-4">
                          {/* Table Header */}
                          <div className="grid grid-cols-3 gap-4 mb-3">
                            <Label className="text-sm font-medium text-slate-600">
                              Seri
                            </Label>
                            <Label className="text-sm font-medium text-slate-600">
                              HS
                            </Label>
                            <Label className="text-sm font-medium text-slate-600">
                              Uraian
                            </Label>
                          </div>
                          {/* Search inputs row */}
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <Input placeholder="" className="bg-white" />
                            <Input placeholder="" className="bg-white" />
                            <Input placeholder="" className="bg-white" />
                          </div>
                          {/* Empty State */}
                          <div className="text-center py-6 text-slate-400">
                            <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No Data</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </CardContent>
            </Card>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleCancelDokumen}>
                <X className="h-4 w-4 mr-1" />
                Batal
              </Button>
              <Button
                onClick={handleSaveDokumen}
                className="bg-[#0ea5e9] hover:bg-[#0284c7]"
                disabled={
                  !currentDokumenForm.jenisDokumen ||
                  !currentDokumenForm.nomorDokumen ||
                  !currentDokumenForm.tanggal ||
                  (currentDokumenForm.jenisDokumen === "0282" &&
                    !currentDokumenForm.fasilitas)
                }
              >
                <Check className="h-4 w-4 mr-1" />
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
