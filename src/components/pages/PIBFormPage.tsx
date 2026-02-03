import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  Code,
  AlertCircle,
  Check,
  ChevronsUpDown,
  Plus,
} from "lucide-react";
import {
  PIBFormStepper,
  PIB_FORM_STEPS,
} from "@/components/pib/PIBFormStepper";
import { PIBItemsTable } from "@/components/pib/PIBItemsTable";
import { PIBAttachments } from "@/components/pib/PIBAttachments";
import { PIBReviewSummary } from "@/components/pib/PIBReviewSummary";
import { PIBXMLPreview } from "@/components/pib/PIBXMLPreview";
import { PIBTaxBreakdown } from "@/components/pib/PIBTaxBreakdown";
import { PPJKSearchDialog } from "@/components/pib/PPJKSearchDialog";
import {
  PIBItem,
  PIBDocument,
  validatePIBDocument,
  calculateTotalPIBTax,
} from "@/types/pib";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/lib/supabase";
import {
  INCOTERM_TRANSPORT_RULES,
  isValidIncotermForTransport,
  getIncotermTransportError,
  isSeaOnlyIncoterm,
  getAllowedIncoterms,
} from "@/lib/validation/incoterm-transport-rules";
import {
  buildPIBMetadata,
  validatePIBMetadata,
  PIBMetadata,
} from "@/lib/pib/pib-metadata";

// Types for master data
interface Company {
  id: string;
  code: string;
  name: string;
  npwp: string;
  address: string;
  api?: string;
  importer_api?: string;
}

interface Supplier {
  id: string;
  code: string;
  name: string;
  country: string;
  address: string;
}

interface PPJK {
  id: string;
  code: string;
  name: string;
  npwp: string;
}

interface Port {
  id: string;
  code: string;
  name: string;
  type: string;
  country_code?: string;
}

interface TransportMode {
  id: string;
  code: string;
  name: string;
  requires_vessel: boolean;
  requires_voyage: boolean;
}

interface Incoterm {
  id: string;
  code: string;
  name: string;
}

interface Currency {
  id: string;
  code: string;
  name: string;
  exchange_rate: number;
}

interface AttachmentWithFile {
  id?: string;
  document_type: string;
  file: File | null;
  name?: string;
  url?: string;
  preview?: string;
  uploadedAt?: string;
}

interface FormData {
  document_number: string;
  document_type: string;
  jenis_dokumen: string;
  importer_id: string;
  importer_npwp: string;
  importer_name: string;
  importer_address: string;
  importer_api: string;
  supplier_id: string;
  supplier_name: string;
  supplier_address: string;
  supplier_country: string;
  ppjk_id: string;
  ppjk_npwp: string;
  ppjk_name: string;
  customs_office_id: string;
  customs_office_code: string;
  customs_office_name: string;
  pelabuhan_tujuan_id: string;
  pelabuhan_tujuan_code: string;
  pelabuhan_tujuan_name: string;
  loading_port_id: string;
  loading_port_code: string;
  loading_port_name: string;
  loading_country: string;
  discharge_port_id: string;
  discharge_port_code: string;
  discharge_port_name: string;
  incoterm_id: string;
  incoterm_code: string;
  currency_id: string;
  currency_code: string;
  exchange_rate: number;
  transport_mode: string;
  vessel_name: string;
  voyage_number: string;
  bl_awb_number: string;
  bl_awb_date: string;
  total_packages: number;
  package_unit: string;
  gross_weight: number;
  net_weight: number;
  fob_value: number;
  freight_value: number;
  insurance_value: number;
  total_cif_value: number;
  total_cif_idr: number;
  total_bm: number;
  total_ppn: number;
  total_pph: number;
  total_tax: number;
  notes: string;
}

const initialFormData: FormData = {
  importer_id: "",
  document_number: "",
  document_type: "",
  jenis_dokumen: "2.0",
  importer_npwp: "",
  importer_name: "",
  importer_address: "",
  importer_api: "",
  supplier_id: "",
  supplier_name: "",
  supplier_address: "",
  supplier_country: "",
  ppjk_id: "",
  ppjk_npwp: "",
  ppjk_name: "",
  customs_office_id: "",
  customs_office_code: "",
  customs_office_name: "",
  pelabuhan_tujuan_id: "",
  pelabuhan_tujuan_code: "",
  pelabuhan_tujuan_name: "",
  loading_port_id: "",
  loading_port_code: "",
  loading_port_name: "",
  loading_country: "",
  discharge_port_id: "",
  discharge_port_code: "",
  discharge_port_name: "",
  incoterm_id: "",
  incoterm_code: "",
  currency_id: "",
  currency_code: "",
  exchange_rate: 0,
  transport_mode: "SEA",
  vessel_name: "",
  voyage_number: "",
  bl_awb_number: "",
  bl_awb_date: "",
  total_packages: 0,
  package_unit: "CTN",
  gross_weight: 0,
  net_weight: 0,
  fob_value: 0,
  freight_value: 0,
  insurance_value: 0,
  total_cif_value: 0,
  total_cif_idr: 0,
  total_bm: 0,
  total_ppn: 0,
  total_pph: 0,
  total_tax: 0,
  notes: "",
};

export default function PIBFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { permissions } = useRole();
  const isEditMode = !!id;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [items, setItems] = useState<Partial<PIBItem>[]>([]);
  const [attachments, setAttachments] = useState<AttachmentWithFile[]>([]);
  const [xmlPreviewOpen, setXmlPreviewOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [customsOfficeError, setCustomsOfficeError] = useState<string>("");

  // Loading port combobox state
  const [loadingPortOpen, setLoadingPortOpen] = useState(false);
  const [loadingPortSearch, setLoadingPortSearch] = useState("");
  const [isCreatingPort, setIsCreatingPort] = useState(false);
  const [showCreatePortDialog, setShowCreatePortDialog] = useState(false);

  // Discharge port combobox state
  const [dischargePortOpen, setDischargePortOpen] = useState(false);
  const [dischargePortSearch, setDischargePortSearch] = useState("");

  // Destination port combobox state
  const [destinationPortOpen, setDestinationPortOpen] = useState(false);
  const [destinationPortSearch, setDestinationPortSearch] = useState("");
  const [newPortData, setNewPortData] = useState({
    code: "",
    name: "",
    country_code: "",
    type: "",
  });

  // Supplier combobox state
  const [supplierComboboxOpen, setSupplierComboboxOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);
  const [showCreateSupplierDialog, setShowCreateSupplierDialog] = useState(false);
  const [newSupplierData, setNewSupplierData] = useState({
    code: "",
    name: "",
    country: "",
    address: "",
    phone: "",
    email: "",
    is_active: true,
  });

  // PPJK dialog state
  const [ppjkDialogOpen, setPpjkDialogOpen] = useState(false);

  // Master data from Supabase
  const [companies, setCompanies] = useState<Company[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ppjkList, setPpjkList] = useState<PPJK[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [transportModes, setTransportModes] = useState<TransportMode[]>([]);
  const [incoterms, setIncoterms] = useState<Incoterm[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  // Fetch master data from Supabase
  const fetchMasterData = useCallback(async () => {
    try {
      const [
        companiesRes,
        suppliersRes,
        ppjkRes,
        portsRes,
        transportModesRes,
        incotermsRes,
        currenciesRes,
      ] = await Promise.all([
        supabase
          .from("companies")
          .select("id, code, name, npwp, address, importer_api")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("suppliers")
          .select("id, code, name, country, address")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("ppjk")
          .select("id, code, name, npwp")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("ports")
          .select("id, code, name, type, country_code")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("transport_modes")
          .select("id, code, name, requires_vessel, requires_voyage")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("incoterms")
          .select("id, code, name")
          .eq("is_active", true)
          .order("code"),
        supabase
          .from("currencies")
          .select("id, code, name, exchange_rate")
          .eq("is_active", true)
          .order("code"),
      ]);

      if (companiesRes.data) setCompanies(companiesRes.data);
      if (suppliersRes.data) setSuppliers(suppliersRes.data);
      if (ppjkRes.data) setPpjkList(ppjkRes.data);
      if (portsRes.data) setPorts(portsRes.data);
      if (transportModesRes.data) setTransportModes(transportModesRes.data);
      if (incotermsRes.data) setIncoterms(incotermsRes.data);
      if (currenciesRes.data) setCurrencies(currenciesRes.data);
    } catch (error) {
      console.error("Error fetching master data:", error);
    }
  }, []);

  // Fetch master data on mount
  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  // Fetch existing PIB data when in edit mode
  const fetchPIBData = useCallback(async () => {
    if (!id) return;

    try {
      // Fetch PIB document
      const { data: pibData, error: pibError } = await supabase
        .from("pib_documents")
        .select("*")
        .eq("id", id)
        .single();

      if (pibError) throw pibError;

      if (pibData) {
        // Map database fields to form data
        setFormData({
          document_number: pibData.document_number || "",
          document_type: pibData.jenis_dokumen || "",
          jenis_dokumen: pibData.jenis_dokumen || "",
          document_date: pibData.document_date || "",
          registration_number: pibData.registration_number || "",
          registration_date: pibData.registration_date || "",

          // Importer
          importer_id: pibData.importer_id || "",
          importer_npwp: pibData.importer_npwp || "",
          importer_name: pibData.importer_name || "",
          importer_address: pibData.importer_address || "",
          importer_api: pibData.importer_api || "",

          // Supplier
          supplier_id: pibData.supplier_id || "",
          supplier_name: pibData.supplier_name || "",
          supplier_address: pibData.supplier_address || "",
          supplier_country: pibData.supplier_country || "",

          // PPJK
          ppjk_id: pibData.ppjk_id || "",
          ppjk_npwp: pibData.ppjk_npwp || "",
          ppjk_name: pibData.ppjk_name || "",

          // Customs office
          customs_office_id: pibData.customs_office_id || "",
          customs_office_code: pibData.customs_office_code || "",
          customs_office_name: pibData.customs_office_name || "",

          // Ports
          pelabuhan_tujuan_id: pibData.pelabuhan_tujuan_id || "",
          pelabuhan_tujuan_code: pibData.pelabuhan_tujuan_code || "",
          pelabuhan_tujuan_name: pibData.pelabuhan_tujuan_name || "",
          loading_port_id: pibData.loading_port_id || "",
          loading_port_code: pibData.loading_port_code || "",
          loading_port_name: pibData.loading_port_name || "",
          loading_country: pibData.loading_country || "",
          discharge_port_id: pibData.discharge_port_id || "",
          discharge_port_code: pibData.discharge_port_code || "",
          discharge_port_name: pibData.discharge_port_name || "",

          // Incoterm & Currency
          incoterm_id: pibData.incoterm_id || "",
          incoterm_code: pibData.incoterm_code || "",
          currency_id: pibData.currency_id || "",
          currency_code: pibData.currency_code || "",
          exchange_rate: pibData.exchange_rate || 0,

          // Transport
          transport_mode: pibData.transport_mode || "",
          vessel_name: pibData.vessel_name || "",
          voyage_number: pibData.voyage_number || "",
          bl_awb_number: pibData.bl_awb_number || "",
          bl_awb_date: pibData.bl_awb_date || "",

          // Package & Weight
          total_packages: pibData.total_packages || 0,
          package_unit: pibData.package_unit || "",
          gross_weight: pibData.gross_weight || 0,
          net_weight: pibData.net_weight || 0,

          // Values
          fob_value: pibData.fob_value || 0,
          freight_value: pibData.freight_value || 0,
          insurance_value: pibData.insurance_value || 0,
          total_cif_value: pibData.total_cif_value || 0,
          total_cif_idr: pibData.total_cif_idr || 0,

          // Tax
          total_bm: pibData.total_bm || 0,
          total_ppn: pibData.total_ppn || 0,
          total_pph: pibData.total_pph || 0,
          total_tax: pibData.total_tax || 0,

          // Notes
          notes: pibData.notes || "",
        });
      }

      // Fetch PIB items
      const { data: itemsData, error: itemsError } = await supabase
        .from("pib_items")
        .select("*")
        .eq("pib_id", id)
        .order("item_number", { ascending: true });

      if (itemsError) {
        console.error("Error fetching PIB items:", itemsError);
      } else if (itemsData && itemsData.length > 0) {
        // Map database fields to item format
        const mappedItems: Partial<PIBItem>[] = itemsData.map((item: any) => ({
          id: item.id,
          item_number: item.item_number || 0,
          hs_code: item.hs_code || "",
          product_description: item.product_description || "",
          description: item.product_description || "",
          country_of_origin: item.country_of_origin || "",
          quantity: item.quantity || 0,
          quantity_unit: item.quantity_unit || "",
          unit: item.quantity_unit || "",
          net_weight: item.net_weight || 0,
          gross_weight: item.gross_weight || 0,
          unit_price: item.unit_price || 0,
          total_price: item.total_price || item.cif_value || 0,
          cif_value: item.cif_value || 0,
          cifValue: item.cif_value || 0,
          cif_idr: item.cif_idr || 0,
          cifValueIdr: item.cif_idr || 0,
          bm_rate: item.bm_rate || 0,
          bmRate: item.bm_rate || 0,
          bm_amount: item.bm_amount || 0,
          bmAmount: item.bm_amount || 0,
          ppn_rate: item.ppn_rate || 11,
          ppnRate: item.ppn_rate || 11,
          ppn_amount: item.ppn_amount || 0,
          ppnAmount: item.ppn_amount || 0,
          pph_rate: item.pph_rate || 2.5,
          pphRate: item.pph_rate || 2.5,
          pph_amount: item.pph_amount || 0,
          pphAmount: item.pph_amount || 0,
          packaging_code: item.packaging_code || "",
          package_count: item.package_count || 0,
        }));
        setItems(mappedItems);
      }

      // Fetch attachments
      // Column names: ref_type (not document_type), ref_id (not document_id)
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from("supporting_documents")
        .select("*")
        .eq("ref_type", "PIB")
        .eq("ref_id", id);

      if (attachmentsError) {
        console.error("Error fetching attachments:", attachmentsError);
      } else if (attachmentsData && attachmentsData.length > 0) {
        const mappedAttachments: AttachmentWithFile[] = attachmentsData.map(
          (doc: any) => ({
            id: doc.id,
            name: doc.file_name,
            document_type: doc.doc_type,
            file: null,
            url: doc.file_url,
            preview: doc.file_url,
            uploadedAt: doc.created_at,
          }),
        );
        setAttachments(mappedAttachments);
      }
    } catch (error: any) {
      console.error("Error fetching PIB data:", error);
      toast.error("Gagal memuat data PIB");
    }
  }, [id]);

  // Fetch PIB data when in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchPIBData();
    }
  }, [isEditMode, fetchPIBData]);

  // Calculate freight and insurance percentages for proportional distribution
  const freightPercentage =
    formData.fob_value > 0
      ? (formData.freight_value / formData.fob_value) * 100
      : 5;
  const insurancePercentage =
    formData.fob_value > 0
      ? (formData.insurance_value / formData.fob_value) * 100
      : 0.5;

  useEffect(() => {
    // Recalculate totals when items change
    const totals = calculateTotalPIBTax(items as PIBItem[]);
    const totalNetWeight = items.reduce(
      (sum, item) => sum + (item.net_weight || 0),
      0,
    );
    const totalGrossWeight = items.reduce(
      (sum, item) => sum + (item.gross_weight || 0),
      0,
    );
    const totalPackages = items.reduce(
      (sum, item) => sum + (item.package_count || 0),
      0,
    );
    const totalFOB = items.reduce(
      (sum, item) => sum + (item.total_price || 0),
      0,
    );

    // Auto-detect most common packaging code from items for header package_unit
    const packageCodes = items
      .map((item) => item.packaging_code)
      .filter(Boolean);

    let headerPackageUnit = formData.package_unit || "CTN";
    if (packageCodes.length > 0) {
      // Find most common package code
      const codeCounts = packageCodes.reduce(
        (acc, code) => {
          acc[code] = (acc[code] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      headerPackageUnit = Object.entries(codeCounts).sort(
        ([, a], [, b]) => b - a,
      )[0][0];
    }

    setFormData((prev) => ({
      ...prev,
      total_cif_value: totals.totalCIF,
      total_cif_idr: totals.totalCIFIDR,
      total_bm: totals.totalBM,
      total_ppn: totals.totalPPN,
      total_pph: totals.totalPPh,
      total_tax: totals.totalTax,
      net_weight: totalNetWeight,
      gross_weight: totalGrossWeight,
      total_packages: totalPackages,
      fob_value: totalFOB,
      package_unit: headerPackageUnit,
    }));
  }, [items]);

  // Create new loading port
  const handleCreateLoadingPort = async () => {
    if (
      !newPortData.code.trim() ||
      !newPortData.name.trim() ||
      !newPortData.country_code.trim() ||
      !newPortData.type
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsCreatingPort(true);
    try {
      const { data, error } = await supabase
        .from("ports")
        .insert({
          code: newPortData.code.trim().toUpperCase(),
          name: newPortData.name.trim(),
          country_code: newPortData.country_code.trim().toUpperCase(),
          type: newPortData.type,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to ports list
      setPorts((prev) => [...prev, data]);

      // Select the newly created port and sync country
      handleChange("loading_port_id", data.id);
      handleChange("loading_country", data.country_code);

      toast.success("New loading port created successfully");
      setShowCreatePortDialog(false);
      setLoadingPortOpen(false);
      setLoadingPortSearch("");
      setNewPortData({ code: "", name: "", country_code: "", type: "" });
    } catch (error: any) {
      console.error("Error creating port:", error);
      toast.error(error.message || "Failed to create loading port");
    } finally {
      setIsCreatingPort(false);
    }
  };

  const openCreatePortDialog = () => {
    setNewPortData({
      code: loadingPortSearch
        .trim()
        .substring(0, 5)
        .toUpperCase()
        .replace(/\s/g, ""),
      name: loadingPortSearch.trim(),
      country_code: "",
      type: "",
    });
    setShowCreatePortDialog(true);
  };

  // Create new supplier
  const handleCreateSupplier = async () => {
    if (!newSupplierData.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    setIsCreatingSupplier(true);
    try {
      // Generate supplier code
      const { data: lastSupplier } = await supabase
        .from("suppliers")
        .select("code")
        .like("code", "SP%-%-____")
        .order("code", { ascending: false })
        .limit(1)
        .single();

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      let nextNumber = 1;

      if (lastSupplier?.code) {
        const lastCode = lastSupplier.code;
        const lastYear = lastCode.substring(2, 6);
        const lastMonth = lastCode.substring(7, 9);
        const lastNum = parseInt(lastCode.substring(10, 14), 10);

        if (lastYear === String(year) && lastMonth === month) {
          nextNumber = lastNum + 1;
        }
      }

      const generatedCode = `SP${year}-${month}-${String(nextNumber).padStart(4, "0")}`;

      const { data, error } = await supabase
        .from("suppliers")
        .insert({
          code: generatedCode,
          name: newSupplierData.name.trim(),
          country: newSupplierData.country.trim(),
          address: newSupplierData.address.trim(),
          phone: newSupplierData.phone.trim(),
          email: newSupplierData.email.trim(),
          is_active: newSupplierData.is_active,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to suppliers list
      setSuppliers((prev) => [...prev, data]);

      // Update form data with new supplier information directly
      setFormData((prev) => ({
        ...prev,
        supplier_id: data.id,
        supplier_name: data.name,
        supplier_address: data.address,
        supplier_country: data.country,
      }));

      toast.success("New supplier created successfully");
      setShowCreateSupplierDialog(false);
      setSupplierComboboxOpen(false);
      setSupplierSearch("");
      setNewSupplierData({
        code: "",
        name: "",
        country: "",
        address: "",
        phone: "",
        email: "",
        is_active: true,
      });
    } catch (error: any) {
      console.error("Error creating supplier:", error);
      toast.error(error.message || "Failed to create supplier");
    } finally {
      setIsCreatingSupplier(false);
    }
  };

  const openCreateSupplierDialog = () => {
    setNewSupplierData({
      code: "",
      name: supplierSearch.trim(),
      country: "",
      address: "",
      phone: "",
      email: "",
      is_active: true,
    });
    setShowCreateSupplierDialog(true);
  };

  const handleChange = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-fill related fields
    if (field === "importer_id") {
      const company = companies.find((c) => c.id === value);
      if (company) {
        setFormData((prev) => ({
          ...prev,
          importer_id: company.id,
          importer_npwp: company.npwp,
          importer_name: company.name,
          importer_address: company.address,
          importer_api: company.importer_api,
        }));
      }
    }

    if (field === "supplier_id") {
      const supplier = suppliers.find((s) => s.id === value);
      if (supplier) {
        setFormData((prev) => ({
          ...prev,
          supplier_id: supplier.id,
          supplier_name: supplier.name,
          supplier_address: supplier.address,
          supplier_country: supplier.country,
        }));
      }
    }

    if (field === "ppjk_id") {
      const ppjk = ppjkList.find((p) => p.id === value);
      if (ppjk) {
        setFormData((prev) => ({
          ...prev,
          ppjk_id: ppjk.id,
          ppjk_npwp: ppjk.npwp,
          ppjk_name: ppjk.name,
        }));
      }
    }

    if (field === "loading_port_id") {
      const port = ports.find((p) => p.id === value);
      if (port) {
        setFormData((prev) => ({
          ...prev,
          loading_port_id: port.id,
          loading_port_code: port.code,
          loading_port_name: port.name,
          loading_country: port.country_code || "",
        }));
      }
    }

    // Pelabuhan Tujuan (Destination Port) - triggers customs office lookup
    if (field === "pelabuhan_tujuan_id") {
      const port = ports.find((p) => p.id === value);
      if (port) {
        setFormData((prev) => ({
          ...prev,
          pelabuhan_tujuan_id: port.id,
          pelabuhan_tujuan_code: port.code,
          pelabuhan_tujuan_name: port.name,
        }));

        // Auto-fetch customs office mapping
        fetchCustomsOfficeForPort(value as string);

        // Set discharge port to same value by default
        setFormData((prev) => ({
          ...prev,
          discharge_port_id: port.id,
          discharge_port_code: port.code,
          discharge_port_name: port.name,
        }));
      }
    }

    if (field === "discharge_port_id") {
      const port = ports.find((p) => p.id === value);
      if (port) {
        setFormData((prev) => ({
          ...prev,
          discharge_port_id: port.id,
          discharge_port_code: port.code,
          discharge_port_name: port.name,
        }));
      }
    }

    if (field === "incoterm_id") {
      const incoterm = incoterms.find((i) => i.id === value);
      if (incoterm) {
        setFormData((prev) => ({
          ...prev,
          incoterm_id: incoterm.id,
          incoterm_code: incoterm.code,
        }));
      }
    }

    if (field === "currency_id") {
      const currency = currencies.find((c) => c.id === value);
      if (currency) {
        setFormData((prev) => ({
          ...prev,
          currency_id: currency.id,
          currency_code: currency.code,
          exchange_rate: currency.exchange_rate,
        }));
      }
    }
  };

  // Fetch customs office mapping for a given port
  const fetchCustomsOfficeForPort = async (portId: string) => {
    try {
      setCustomsOfficeError("");
      const { data, error } = await supabase
        .from("customs_office_ports")
        .select(
          `
          customs_office_id,
          customs_offices (
            id,
            code,
            name
          )
        `,
        )
        .eq("port_id", portId)
        .single();

      if (error || !data) {
        setCustomsOfficeError(
          "Mapping Kantor Pabean untuk pelabuhan ini belum tersedia",
        );
        setFormData((prev) => ({
          ...prev,
          customs_office_id: "",
          customs_office_code: "",
          customs_office_name: "",
        }));
        return;
      }

      const customsOffice = data.customs_offices as any;
      setFormData((prev) => ({
        ...prev,
        customs_office_id: customsOffice.id,
        customs_office_code: customsOffice.code,
        customs_office_name: customsOffice.name,
      }));
      setCustomsOfficeError("");
    } catch (error) {
      console.error("Error fetching customs office:", error);
      setCustomsOfficeError("Gagal memuat data Kantor Pabean");
    }
  };

  const validateCurrentStep = (): boolean => {
    const errors: string[] = [];

    if (currentStep === 1) {
      if (!formData.importer_id) errors.push("Importer is required");
      if (!formData.supplier_id) errors.push("Supplier is required");
    }

    if (currentStep === 2) {
      if (!formData.pelabuhan_tujuan_id)
        errors.push("Pelabuhan Tujuan (destination port) is required");
      if (!formData.customs_office_id) {
        errors.push("Kantor Pabean mapping is required");
      }
      if (customsOfficeError) {
        errors.push(customsOfficeError);
      }
      if (!formData.loading_port_id) errors.push("Loading port is required");
      if (!formData.discharge_port_id)
        errors.push("Discharge port is required");
      if (!formData.incoterm_id) errors.push("Incoterm is required");
      if (!formData.currency_id) errors.push("Currency is required");
      if (!formData.transport_mode) errors.push("Transport mode is required");
      if (!formData.bl_awb_number) errors.push("B/L or AWB number is required");

      // CRITICAL: Validate incoterm-transport mode combination (CEISA/DJBC compliance)
      const selectedIncoterm = incoterms.find(
        (i) => i.id === formData.incoterm_id,
      );
      if (selectedIncoterm && formData.transport_mode) {
        if (
          !isValidIncotermForTransport(
            formData.transport_mode,
            selectedIncoterm.code,
          )
        ) {
          const errorMsg = getIncotermTransportError(
            formData.transport_mode,
            selectedIncoterm.code,
          );
          errors.push(
            errorMsg ||
              `Incoterm ${selectedIncoterm.code} tidak valid untuk transport mode ${formData.transport_mode}`,
          );
          // Log invalid attempt for audit
          console.warn(
            "[AUDIT] Invalid incoterm-transport combination attempted:",
            {
              transport_mode: formData.transport_mode,
              incoterm: selectedIncoterm.code,
            },
          );
        }
      }
    }

    if (currentStep === 3) {
      if (items.length === 0) errors.push("At least one item is required");
    }

    if (currentStep === 4) {
      // Validate required documents based on transport mode
      const uploadedTypes = new Set([
        ...attachments.map((att) => att.document_type),
      ]);

      // Always required
      if (!uploadedTypes.has("INVOICE")) {
        errors.push("Commercial Invoice is required");
      }
      if (!uploadedTypes.has("PACKING_LIST")) {
        errors.push("Packing List is required");
      }

      // Transport-specific required documents
      if (formData.transport_mode === "AIR") {
        if (!uploadedTypes.has("AWB")) {
          errors.push("Air Waybill is required for AIR transport");
        }
      } else if (formData.transport_mode === "SEA") {
        if (!uploadedTypes.has("BL")) {
          errors.push("Bill of Lading is required for SEA transport");
        }
      }

      if (errors.length > 0) {
        toast.error("Required supporting documents are incomplete");
      }
    }

    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return false;
    }
    return true;
  };

  const goToNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const goToPrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Check if Submit button should be enabled (comprehensive validation)
  const canSubmit = (): boolean => {
    // Importer required
    if (!formData.importer_id) return false;

    // Supplier required
    if (!formData.supplier_id && !formData.supplier_name) return false;

    // Customs office mapping required
    if (!formData.customs_office_id || customsOfficeError) return false;

    // Transport vs Incoterm validation
    if (formData.transport_mode && formData.incoterm_code) {
      if (
        formData.transport_mode === "AIR" &&
        ["FOB", "CFR", "CIF", "FAS"].includes(formData.incoterm_code)
      ) {
        return false;
      }
      if (
        !isValidIncotermForTransport(
          formData.transport_mode,
          formData.incoterm_code,
        )
      ) {
        return false;
      }
    }

    // Goods required
    if (items.length === 0) return false;

    // Validate goods items
    const hasInvalidItems = items.some((item) => {
      if (!item.hs_code) return true;
      if (!item.net_weight || item.net_weight <= 0) return true;
      if (
        item.gross_weight !== undefined &&
        item.net_weight !== undefined &&
        item.gross_weight < item.net_weight
      )
        return true;
      if (!item.quantity_unit) return true;
      return false;
    });
    if (hasInvalidItems) return false;

    // Documents validation
    const uploadedDocTypes = attachments.map((att) => att.document_type);
    if (!uploadedDocTypes.includes("INVOICE")) return false;
    if (!uploadedDocTypes.includes("PACKING_LIST")) return false;

    if (formData.transport_mode === "AIR" && !uploadedDocTypes.includes("AWB"))
      return false;
    if (formData.transport_mode === "SEA" && !uploadedDocTypes.includes("BL"))
      return false;

    // No validation errors
    if (validationErrors.length > 0) return false;

    return true;
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Anda harus login untuk menyimpan draft");
        return;
      }

      // Generate document number for new PIB
      let documentNumber = formData.document_number;
      if (!id && !documentNumber) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random
        documentNumber = `CST-PIB-${year}-${day}${month}-${random}`;
      }

      // Prepare PIB document data
      const pibData = {
        status: "DRAFT" as const,
        document_number: documentNumber || null,

        //Jenis dokumen
        jenis_dokumen: formData.jenis_dokumen || null,

        // Importer
        importer_id: formData.importer_id || null,
        importer_npwp: formData.importer_npwp || null,
        importer_name: formData.importer_name || null,
        importer_address: formData.importer_address || null,
        importer_api: formData.importer_api || null,

        // Supplier
        supplier_id: formData.supplier_id || null,
        supplier_name: formData.supplier_name || null,
        supplier_address: formData.supplier_address || null,
        supplier_country: formData.supplier_country || null,

        // PPJK
        ppjk_id: formData.ppjk_id || null,
        ppjk_npwp: formData.ppjk_npwp || null,
        ppjk_name: formData.ppjk_name || null,

        // Customs office
        customs_office_id: formData.customs_office_id || null,
        customs_office_code: formData.customs_office_code || null,
        customs_office_name: formData.customs_office_name || null,

        // Ports
        pelabuhan_tujuan_id: formData.pelabuhan_tujuan_id || null,
        loading_port_id: formData.loading_port_id || null,
        loading_port_code: formData.loading_port_code || null,
        loading_port_name: formData.loading_port_name || null,
        loading_country: formData.loading_country || null,
        discharge_port_id: formData.discharge_port_id || null,
        discharge_port_code: formData.discharge_port_code || null,
        discharge_port_name: formData.discharge_port_name || null,

        // Incoterm & Currency
        incoterm_id: formData.incoterm_id || null,
        incoterm_code: formData.incoterm_code || null,
        currency_id: formData.currency_id || null,
        currency_code: formData.currency_code || null,
        exchange_rate: formData.exchange_rate || null,

        // Transport
        transport_mode: formData.transport_mode || null,
        vessel_name: formData.vessel_name || null,
        voyage_number: formData.voyage_number || null,
        bl_awb_number: formData.bl_awb_number || null,
        bl_awb_date: formData.bl_awb_date || null,

        // Package & Weight
        total_packages: formData.total_packages || 0,
        package_unit: formData.package_unit || null,
        gross_weight: formData.gross_weight || 0,
        net_weight: formData.net_weight || 0,

        // Values
        fob_value: formData.fob_value || 0,
        freight_value: formData.freight_value || 0,
        insurance_value: formData.insurance_value || 0,
        total_cif_value: formData.total_cif_value || 0,
        total_cif_idr: formData.total_cif_idr || 0,

        // Tax
        total_bm: formData.total_bm || 0,
        total_ppn: formData.total_ppn || 0,
        total_pph: formData.total_pph || 0,
        total_tax: formData.total_tax || 0,

        // Notes
        notes: formData.notes || null,

        // Audit
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };

      // Build canonical metadata (even for draft)
      const pibMetadata = buildPIBMetadata({
        formData: {
          ...formData,
          jenis_dokumen: formData.jenis_dokumen || "PIB",
        },
        items: items,
        documentNumber: null,
      });

      // Add metadata to pibData
      const pibDataWithMetadata = {
        ...pibData,
        metadata: pibMetadata,
      };

      let savedPibId = id;

      if (id) {
        // Update existing draft with metadata
        const { error: updateError } = await supabase
          .from("pib_documents")
          .update(pibDataWithMetadata)
          .eq("id", id);

        if (updateError) throw updateError;
      } else {
        // Create new draft with metadata
        const { data: newPib, error: insertError } = await supabase
          .from("pib_documents")
          .insert({
            ...pibDataWithMetadata,
            created_by: user.id,
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (insertError) throw insertError;
        savedPibId = newPib.id;
      }

      // Save PIB items if any
      if (items.length > 0 && savedPibId) {
        // Delete existing items first
        await supabase.from("pib_items").delete().eq("pib_id", savedPibId);

        // Insert new items
        const itemsToInsert = items.map((item, index) => ({
          pib_id: savedPibId,
          item_number: index + 1,
          hs_code: item.hs_code,
          product_description: item.product_description,
          quantity: item.quantity,
          quantity_unit: item.quantity_unit,
          net_weight: item.net_weight || 0,
          gross_weight: item.gross_weight || 0,
          unit_price: item.unit_price || 0,
          total_price: item.total_price || 0,
          cif_value: item.cif_value,
          cif_idr: item.cif_idr,
          bm_rate: item.bm_rate,
          bm_amount: item.bm_amount,
          ppn_rate: item.ppn_rate,
          ppn_amount: item.ppn_amount,
          pph_rate: item.pph_rate,
          pph_amount: item.pph_amount,
          total_tax:
            (item.bm_amount || 0) +
            (item.ppn_amount || 0) +
            (item.pph_amount || 0),
          country_of_origin: item.country_of_origin,
          packaging_code: item.packaging_code || null,
          package_count: item.package_count || 0,
        }));

        const { error: itemsError } = await supabase
          .from("pib_items")
          .insert(itemsToInsert);

        if (itemsError) {
          console.error("Error saving items:", itemsError);
        }
      }

      // Save supporting documents (attachments)
      if (attachments.length > 0 && savedPibId) {
        // Separate existing attachments (from DB) and new ones (with file)
        const existingAttachments = attachments.filter(
          (att) => att.id && !att.file,
        );
        const newAttachments = attachments.filter((att) => att.file);

        // Only delete attachments that are not in the current list
        const existingIds = existingAttachments
          .map((att) => att.id)
          .filter(Boolean);

        if (existingIds.length > 0) {
          // Delete only attachments not in the current list
          await supabase
            .from("supporting_documents")
            .delete()
            .eq("ref_type", "PIB")
            .eq("ref_id", savedPibId)
            .not("id", "in", `(${existingIds.join(",")})`);
        } else {
          // No existing attachments to keep, delete all
          await supabase
            .from("supporting_documents")
            .delete()
            .eq("ref_type", "PIB")
            .eq("ref_id", savedPibId);
        }

        // Insert only new attachments (ones with file)
        if (newAttachments.length > 0) {
          const attachmentsToInsert = newAttachments.map((attachment) => ({
            ref_type: "PIB",
            ref_id: savedPibId,
            doc_type: attachment.document_type,
            file_name: attachment.file?.name || attachment.name || "unknown",
            file_url: attachment.preview || null,
            created_by: user.id,
          }));

          const { error: attachmentsError } = await supabase
            .from("supporting_documents")
            .insert(attachmentsToInsert);

          if (attachmentsError) {
            console.error("Error saving attachments:", attachmentsError);
          }
        }
      }

      toast.success("Draft berhasil disimpan");

      // Navigate to edit mode if new document
      if (!id && savedPibId) {
        navigate(`/pib/${savedPibId}/edit`, { replace: true });
      }
    } catch (error: any) {
      console.error("Error saving draft:", error);
      toast.error(error.message || "Gagal menyimpan draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    // === VALIDATION ENGINE: validateBeforeSubmit ===

    const clientErrors: string[] = [];

    // === DOCUMENT INFO VALIDATION ===
    if (!formData.importer_id) {
      clientErrors.push("Importer NPWP wajib diisi");
    }
    if (!formData.supplier_id && !formData.supplier_name) {
      clientErrors.push("Supplier wajib diisi");
    }

    // === TRANSPORT vs INCOTERM VALIDATION ===
    if (formData.transport_mode && formData.incoterm_code) {
      if (
        formData.transport_mode === "AIR" &&
        ["FOB", "CFR", "CIF", "FAS"].includes(formData.incoterm_code)
      ) {
        clientErrors.push(
          `Incoterm ${formData.incoterm_code} tidak valid untuk transport AIR`,
        );
      }
      if (
        !isValidIncotermForTransport(
          formData.transport_mode,
          formData.incoterm_code,
        )
      ) {
        const errorMsg = getIncotermTransportError(
          formData.transport_mode,
          formData.incoterm_code,
        );
        if (errorMsg) clientErrors.push(errorMsg);
      }
    }

    // === GOODS VALIDATION ===
    if (items.length === 0) {
      clientErrors.push("Minimal satu item barang wajib diisi");
    }

    // Validate each goods item
    items.forEach((item, index) => {
      const itemNum = index + 1;

      if (!item.hs_code) {
        clientErrors.push(`Item ${itemNum}: HS Code wajib diisi`);
      }
      if (!item.net_weight || item.net_weight <= 0) {
        clientErrors.push(`Item ${itemNum}: Net weight harus lebih dari 0`);
      }
      if (
        item.gross_weight !== undefined &&
        item.net_weight !== undefined &&
        item.gross_weight < item.net_weight
      ) {
        clientErrors.push(
          `Item ${itemNum}: Gross weight tidak boleh kurang dari Net weight`,
        );
      }
      if (!item.quantity_unit) {
        clientErrors.push(`Item ${itemNum}: Unit wajib diisi (dari HS Code)`);
      }
    });

    // === SUPPORTING DOCUMENTS VALIDATION ===
    const uploadedDocTypes = attachments.map((att) => att.document_type);

    if (!uploadedDocTypes.includes("INVOICE")) {
      clientErrors.push("Dokumen wajib belum lengkap: Commercial Invoice");
    }
    if (!uploadedDocTypes.includes("PACKING_LIST")) {
      clientErrors.push("Dokumen wajib belum lengkap: Packing List");
    }

    if (formData.transport_mode === "AIR") {
      if (!uploadedDocTypes.includes("AWB")) {
        clientErrors.push("Air Waybill wajib untuk transport AIR");
      }
    } else if (formData.transport_mode === "SEA") {
      if (!uploadedDocTypes.includes("BL")) {
        clientErrors.push("Bill of Lading wajib untuk transport SEA");
      }
    }

    // === CHECK VALIDATION RESULT ===
    if (clientErrors.length > 0) {
      setValidationErrors(clientErrors);
      clientErrors.forEach((err) => toast.error(err));
      return;
    }

    const doc: PIBDocument = {
      id: "",
      document_number: null,
      registration_number: null,
      registration_date: null,
      sppb_number: null,
      sppb_date: null,
      status: "DRAFT",
      lane: null,
      ...formData,
      xml_content: null,
      ceisa_response: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_by: null,
      updated_at: new Date().toISOString(),
      submitted_at: null,
      submitted_by: null,
      locked_at: null,
      locked_by: null,
      items: items as PIBItem[],
    };

    const validation = validatePIBDocument(doc);
    setValidationErrors(validation.errors);

    if (!validation.isValid) {
      toast.error("Please fix validation errors before submitting");
      return;
    }

    setIsSaving(true);
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Anda harus login untuk submit PIB");
        return;
      }

      // Generate document number
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
      const documentNumber = `PIB-${year}${month}${day}-${random}`;

      // Prepare PIB document data
      const pibData = {
        status: "SUBMITTED" as const,
        jenis_dokumen: formData.jenis_dokumen || null,

        // Importer
        importer_id: formData.importer_id || null,
        importer_npwp: formData.importer_npwp || null,
        importer_name: formData.importer_name || null,
        importer_address: formData.importer_address || null,
        importer_api: formData.importer_api || null,

        // Supplier
        supplier_id: formData.supplier_id || null,
        supplier_name: formData.supplier_name || null,
        supplier_address: formData.supplier_address || null,
        supplier_country: formData.supplier_country || null,

        // PPJK
        ppjk_id: formData.ppjk_id || null,
        ppjk_npwp: formData.ppjk_npwp || null,
        ppjk_name: formData.ppjk_name || null,

        // Customs office
        customs_office_id: formData.customs_office_id || null,
        customs_office_code: formData.customs_office_code || null,
        customs_office_name: formData.customs_office_name || null,

        // Ports
        pelabuhan_tujuan_id: formData.pelabuhan_tujuan_id || null,
        loading_port_id: formData.loading_port_id || null,
        loading_port_code: formData.loading_port_code || null,
        loading_port_name: formData.loading_port_name || null,
        loading_country: formData.loading_country || null,
        discharge_port_id: formData.discharge_port_id || null,
        discharge_port_code: formData.discharge_port_code || null,
        discharge_port_name: formData.discharge_port_name || null,

        // Incoterm & Currency
        incoterm_id: formData.incoterm_id || null,
        incoterm_code: formData.incoterm_code || null,
        currency_id: formData.currency_id || null,
        currency_code: formData.currency_code || null,
        exchange_rate: formData.exchange_rate || null,

        // Transport
        transport_mode: formData.transport_mode || null,
        vessel_name: formData.vessel_name || null,
        voyage_number: formData.voyage_number || null,
        bl_awb_number: formData.bl_awb_number || null,
        bl_awb_date: formData.bl_awb_date || null,

        // Package & Weight
        total_packages: formData.total_packages || 0,
        package_unit: formData.package_unit || null,
        gross_weight: formData.gross_weight || 0,
        net_weight: formData.net_weight || 0,

        // Values
        fob_value: formData.fob_value || 0,
        freight_value: formData.freight_value || 0,
        insurance_value: formData.insurance_value || 0,
        total_cif_value: formData.total_cif_value || 0,
        total_cif_idr: formData.total_cif_idr || 0,

        // Tax
        total_bm: formData.total_bm || 0,
        total_ppn: formData.total_ppn || 0,
        total_pph: formData.total_pph || 0,
        total_tax: formData.total_tax || 0,

        // Notes
        notes: formData.notes || null,

        // Submission tracking
        submitted_at: new Date().toISOString(),
        submitted_by: user.id,

        // Audit
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      };

      // Build canonical metadata for CEISA integration
      const pibMetadata = buildPIBMetadata({
        formData: {
          ...formData,
          jenis_dokumen: formData.jenis_dokumen || "PIB",
        },
        items: items,
        documentNumber: documentNumber,
      });

      // Validate metadata before submit
      const metadataValidation = validatePIBMetadata(pibMetadata);
      if (!metadataValidation.isValid) {
        metadataValidation.errors.forEach((err) => toast.error(err));
        setValidationErrors(metadataValidation.errors);
        setIsSaving(false);
        return;
      }

      // Add metadata to pibData
      const pibDataWithMetadata = {
        ...pibData,
        metadata: pibMetadata,
      };

      let savedPibId = id;

      if (id) {
        // Update existing document with metadata
        const { error: updateError } = await supabase
          .from("pib_documents")
          .update(pibDataWithMetadata)
          .eq("id", id);

        if (updateError) throw updateError;
      } else {
        // Create new document with metadata
        const { data: newPib, error: insertError } = await supabase
          .from("pib_documents")
          .insert({
            ...pibDataWithMetadata,
            created_by: user.id,
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (insertError) throw insertError;
        savedPibId = newPib.id;
      }

      // Save PIB items
      if (items.length > 0 && savedPibId) {
        // Delete existing items first
        await supabase.from("pib_items").delete().eq("pib_id", savedPibId);

        // Insert new items
        const itemsToInsert = items.map((item, index) => ({
          pib_id: savedPibId,
          item_number: index + 1,
          hs_code: item.hs_code,
          product_description: item.product_description,
          quantity: item.quantity,
          quantity_unit: item.quantity_unit,
          net_weight: item.net_weight || 0,
          gross_weight: item.gross_weight || 0,
          unit_price: item.unit_price || 0,
          total_price: item.total_price || 0,
          cif_value: item.cif_value,
          cif_idr: item.cif_idr,
          bm_rate: item.bm_rate,
          bm_amount: item.bm_amount,
          ppn_rate: item.ppn_rate,
          ppn_amount: item.ppn_amount,
          pph_rate: item.pph_rate,
          pph_amount: item.pph_amount,
          total_tax:
            (item.bm_amount || 0) +
            (item.ppn_amount || 0) +
            (item.pph_amount || 0),
          country_of_origin: item.country_of_origin,
          packaging_code: item.packaging_code || null,
          package_count: item.package_count || 0,
        }));

        const { error: itemsError } = await supabase
          .from("pib_items")
          .insert(itemsToInsert);

        if (itemsError) {
          console.error("Error saving items:", itemsError);
        }
      }

      // Save supporting documents (attachments)
      if (attachments.length > 0 && savedPibId) {
        // Separate existing attachments (from DB) and new ones (with file)
        const existingAttachments = attachments.filter(
          (att) => att.id && !att.file,
        );
        const newAttachments = attachments.filter((att) => att.file);

        // Only delete attachments that are not in the current list
        const existingIds = existingAttachments
          .map((att) => att.id)
          .filter(Boolean);

        if (existingIds.length > 0) {
          // Delete only attachments not in the current list
          await supabase
            .from("supporting_documents")
            .delete()
            .eq("ref_type", "PIB")
            .eq("ref_id", savedPibId)
            .not("id", "in", `(${existingIds.join(",")})`);
        } else {
          // No existing attachments to keep, delete all
          await supabase
            .from("supporting_documents")
            .delete()
            .eq("ref_type", "PIB")
            .eq("ref_id", savedPibId);
        }

        // Insert only new attachments (ones with file)
        if (newAttachments.length > 0) {
          const attachmentsToInsert = newAttachments.map((attachment) => ({
            ref_type: "PIB",
            ref_id: savedPibId,
            doc_type: attachment.document_type,
            file_name: attachment.file?.name || attachment.name || "unknown",
            file_url: attachment.preview || null,
            created_by: user.id,
          }));

          const { error: attachmentsError } = await supabase
            .from("supporting_documents")
            .insert(attachmentsToInsert);

          if (attachmentsError) {
            console.error("Error saving attachments:", attachmentsError);
          }
        }
      }

      // Log audit trail
      await supabase.from("audit_logs").insert({
        document_type: "PIB",
        document_number: documentNumber,
        action: id ? "SUBMIT" : "CREATE",
        user_id: user.id,
        user_email: user.email,
        after_data: pibDataWithMetadata,
        entity_type: "PIB",
        entity_id: savedPibId,
        entity_number: documentNumber,
        actor_id: user.id,
        notes: `PIB ${documentNumber} submitted`,
      });

      toast.success("PIB berhasil disubmit");
      navigate("/pib");
    } catch (error: any) {
      console.error("Error submitting PIB:", error);
      toast.error(error.message || "Gagal submit PIB");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewXML = () => {
    setXmlPreviewOpen(true);
  };

  const pibDocumentForXML: PIBDocument = {
    id: "",
    document_number: `PIB-${new Date().getFullYear()}-DRAFT`,
    document_type: null,
    registration_number: null,
    registration_date: null,
    sppb_number: null,
    sppb_date: null,
    status: "DRAFT",
    lane: null,
    ...formData,
    xml_content: null,
    ceisa_response: null,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_by: null,
    updated_at: new Date().toISOString(),
    submitted_at: null,
    submitted_by: null,
    locked_at: null,
    locked_by: null,
    items: items as PIBItem[],
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/pib")}
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">
                {isEditMode ? "Edit PIB" : "Create New PIB"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Import Declaration (Pemberitahuan Impor Barang)
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviewXML}
              className="gap-1.5"
            >
              <Code size={14} />
              Preview XML
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="gap-1.5"
            >
              <Save size={14} />
              Save Draft
            </Button>
          </div>
        </div>

        {/* Stepper */}
        <Card>
          <CardContent className="p-4">
            <PIBFormStepper
              steps={PIB_FORM_STEPS}
              currentStep={currentStep}
              onStepClick={(step) => {
                if (step <= currentStep) setCurrentStep(step);
              }}
            />
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-5 gap-3">
          {/* Form Content */}
          <div className="col-span-4">
            <Card>
              <CardContent className="p-6">
                {/* Step 1: Importer Info */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Jenis Dokumen</Label>
                      <Input
                        value={formData.jenis_dokumen}
                        disabled
                        className="h-8 text-sm bg-muted/30"
                      />
                    </div>

                    <h2 className="text-sm font-semibold border-b pb-2">
                      Importer Information
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Importer <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.importer_id}
                          onValueChange={(v) => handleChange("importer_id", v)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select importer" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.code} - {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">NPWP</Label>
                        <Input
                          value={formData.importer_npwp}
                          disabled
                          className="h-8 text-sm bg-muted/30"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          API (Angka Pengenal Importir)
                        </Label>
                        <Input
                          value={formData.importer_api}
                          disabled
                          className="h-8 text-sm bg-muted/30"
                          placeholder="No API"
                        />
                        {!formData.importer_api && formData.importer_id && (
                          <p className="text-xs text-amber-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            No API - PPh rate will be 7.5%
                          </p>
                        )}
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-xs">Address</Label>
                        <Textarea
                          value={formData.importer_address}
                          disabled
                          className="text-sm bg-muted/30 min-h-[60px]"
                        />
                      </div>
                    </div>

                    <h2 className="text-sm font-semibold border-b pb-2 pt-4">
                      Supplier Information
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Supplier <span className="text-red-500">*</span>
                        </Label>
                        <Popover
                          open={supplierComboboxOpen}
                          onOpenChange={setSupplierComboboxOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={supplierComboboxOpen}
                              className="h-8 w-full justify-between text-sm font-normal"
                            >
                              {formData.supplier_id
                                ? (() => {
                                    const s = suppliers.find(
                                      (sup) => sup.id === formData.supplier_id
                                    );
                                    return s ? `${s.code} - ${s.name}` : "Select supplier";
                                  })()
                                : "Select supplier"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0" align="start">
                            <Command>
                              <CommandInput
                                placeholder="Search supplier..."
                                value={supplierSearch}
                                onValueChange={setSupplierSearch}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  <div className="text-center py-2">
                                    <p className="text-sm text-muted-foreground mb-2">
                                      No supplier found
                                    </p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={openCreateSupplierDialog}
                                      className="gap-1"
                                    >
                                      <Plus className="h-3 w-3" />
                                      Create new supplier
                                    </Button>
                                  </div>
                                </CommandEmpty>
                                <CommandGroup>
                                  {suppliers
                                    .filter((s) =>
                                      `${s.code} ${s.name}`
                                        .toLowerCase()
                                        .includes(supplierSearch.toLowerCase())
                                    )
                                    .map((s) => (
                                      <CommandItem
                                        key={s.id}
                                        value={s.id}
                                        onSelect={() => {
                                          handleChange("supplier_id", s.id);
                                          setSupplierComboboxOpen(false);
                                          setSupplierSearch("");
                                        }}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            formData.supplier_id === s.id
                                              ? "opacity-100"
                                              : "opacity-0"
                                          }`}
                                        />
                                        <div className="flex flex-col">
                                          <span className="font-mono text-xs text-muted-foreground">
                                            {s.code}
                                          </span>
                                          <span className="text-sm">{s.name}</span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                                <CommandSeparator />
                                <CommandGroup>
                                  <CommandItem
                                    onSelect={openCreateSupplierDialog}
                                    className="justify-center text-sm text-primary"
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create new supplier
                                  </CommandItem>
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Country</Label>
                        <Input
                          value={formData.supplier_country}
                          disabled
                          className="h-8 text-sm bg-muted/30"
                        />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-xs">Address</Label>
                        <Textarea
                          value={formData.supplier_address}
                          disabled
                          className="text-sm bg-muted/30 min-h-[60px]"
                        />
                      </div>
                    </div>

                    <h2 className="text-sm font-semibold border-b pb-2 pt-4">
                      PPJK (Customs Broker)
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">PPJK</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setPpjkDialogOpen(true)}
                            className="w-full h-8 justify-between text-sm"
                          >
                            {formData.ppjk_name ? (
                              <span className="truncate">
                                {formData.ppjk_name}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                Select PPJK (optional)
                              </span>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">PPJK NPWP</Label>
                        <Input
                          value={formData.ppjk_npwp}
                          disabled
                          className="h-8 text-sm bg-muted/30"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Transport */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-sm font-semibold border-b pb-2">
                      Customs & Ports
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Pelabuhan Muat (Loading Port){" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Popover
                          open={loadingPortOpen}
                          onOpenChange={setLoadingPortOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={loadingPortOpen}
                              className="w-full h-8 justify-between text-sm font-normal"
                            >
                              {formData.loading_port_id
                                ? (() => {
                                    const selected = ports.find(
                                      (p) => p.id === formData.loading_port_id,
                                    );
                                    return selected
                                      ? `${selected.code} – ${selected.name}`
                                      : "Select loading port";
                                  })()
                                : "Select loading port"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[400px] p-0"
                            align="start"
                          >
                            <Command>
                              <CommandInput
                                placeholder="Search loading port..."
                                value={loadingPortSearch}
                                onValueChange={setLoadingPortSearch}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  <div className="py-6 text-center text-sm">
                                    <p className="text-muted-foreground mb-3">
                                      No port found.
                                    </p>
                                    {loadingPortSearch.trim() && (
                                      <Button
                                        size="sm"
                                        onClick={openCreatePortDialog}
                                        disabled={isCreatingPort}
                                        className="gap-2"
                                      >
                                        <Plus className="h-4 w-4" />
                                        Create "{loadingPortSearch}"
                                      </Button>
                                    )}
                                  </div>
                                </CommandEmpty>
                                <CommandGroup>
                                  {ports
                                    .filter((p) => p.country_code !== "ID")
                                    .map((port) => (
                                      <CommandItem
                                        key={port.id}
                                        value={`${port.code} ${port.name}`}
                                        onSelect={() => {
                                          handleChange(
                                            "loading_port_id",
                                            port.id,
                                          );
                                          setLoadingPortOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            formData.loading_port_id === port.id
                                              ? "opacity-100"
                                              : "opacity-0"
                                          }`}
                                        />
                                        {port.code} – {port.name}
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                                {loadingPortSearch.trim() && (
                                  <>
                                    <CommandSeparator />
                                    <CommandGroup>
                                      <CommandItem
                                        onSelect={openCreatePortDialog}
                                        className="justify-center text-primary"
                                      >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create new port "{loadingPortSearch}"
                                      </CommandItem>
                                    </CommandGroup>
                                  </>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Negara Muat</Label>
                        <Input
                          value={formData.loading_country}
                          disabled
                          className="h-8 text-sm bg-muted/30"
                          placeholder="Auto-filled from port"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Auto-filled (ISO2 format)
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Pelabuhan Tujuan (Destination Port){" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Popover
                          open={destinationPortOpen}
                          onOpenChange={setDestinationPortOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={destinationPortOpen}
                              className="w-full h-8 justify-between text-sm font-normal"
                            >
                              {formData.pelabuhan_tujuan_id
                                ? (() => {
                                    const selected = ports.find(
                                      (p) =>
                                        p.id === formData.pelabuhan_tujuan_id,
                                    );
                                    return selected
                                      ? `${selected.code} – ${selected.name}`
                                      : "Select destination port";
                                  })()
                                : "Select destination port"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[400px] p-0"
                            align="start"
                          >
                            <Command>
                              <CommandInput
                                placeholder="Search destination port..."
                                value={destinationPortSearch}
                                onValueChange={setDestinationPortSearch}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  <div className="py-6 text-center text-sm">
                                    <p className="text-muted-foreground">
                                      No destination port found.
                                    </p>
                                  </div>
                                </CommandEmpty>
                                <CommandGroup>
                                  {ports
                                    .filter(
                                      (p) =>
                                        p.country_code === "ID" &&
                                        (destinationPortSearch.trim() === "" ||
                                          p.code
                                            .toLowerCase()
                                            .includes(
                                              destinationPortSearch.toLowerCase(),
                                            ) ||
                                          p.name
                                            .toLowerCase()
                                            .includes(
                                              destinationPortSearch.toLowerCase(),
                                            )),
                                    )
                                    .map((port) => (
                                      <CommandItem
                                        key={port.id}
                                        value={`${port.code} ${port.name}`}
                                        onSelect={() => {
                                          handleChange(
                                            "pelabuhan_tujuan_id",
                                            port.id,
                                          );
                                          setDestinationPortOpen(false);
                                          setDestinationPortSearch("");
                                        }}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            formData.pelabuhan_tujuan_id ===
                                            port.id
                                              ? "opacity-100"
                                              : "opacity-0"
                                          }`}
                                        />
                                        {port.code} – {port.name}
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Kantor Pabean (Customs Office)
                        </Label>
                        <Input
                          value={
                            formData.customs_office_code &&
                            formData.customs_office_name
                              ? `${formData.customs_office_code} – ${formData.customs_office_name}`
                              : ""
                          }
                          disabled
                          className="h-8 text-sm bg-muted/30"
                          placeholder="Auto-filled from port"
                        />
                        {customsOfficeError && (
                          <p className="text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {customsOfficeError}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Pelabuhan Bongkar (Discharge Port)
                          <span className="text-red-500">*</span>
                        </Label>
                        <Popover
                          open={dischargePortOpen}
                          onOpenChange={setDischargePortOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={dischargePortOpen}
                              className="w-full h-8 justify-between text-sm font-normal"
                            >
                              {formData.discharge_port_id
                                ? (() => {
                                    const selected = ports.find(
                                      (p) =>
                                        p.id === formData.discharge_port_id,
                                    );
                                    return selected
                                      ? `${selected.code} – ${selected.name}`
                                      : "Select discharge port";
                                  })()
                                : "Select discharge port"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[400px] p-0"
                            align="start"
                          >
                            <Command>
                              <CommandInput
                                placeholder="Search discharge port..."
                                value={dischargePortSearch}
                                onValueChange={setDischargePortSearch}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  <div className="py-6 text-center text-sm">
                                    <p className="text-muted-foreground">
                                      No discharge port found.
                                    </p>
                                  </div>
                                </CommandEmpty>
                                <CommandGroup>
                                  {ports
                                    .filter(
                                      (p) =>
                                        p.country_code === "ID" &&
                                        (dischargePortSearch.trim() === "" ||
                                          p.code
                                            .toLowerCase()
                                            .includes(
                                              dischargePortSearch.toLowerCase(),
                                            ) ||
                                          p.name
                                            .toLowerCase()
                                            .includes(
                                              dischargePortSearch.toLowerCase(),
                                            )),
                                    )
                                    .map((port) => (
                                      <CommandItem
                                        key={port.id}
                                        value={`${port.code} ${port.name}`}
                                        onSelect={() => {
                                          handleChange(
                                            "discharge_port_id",
                                            port.id,
                                          );
                                          setDischargePortOpen(false);
                                          setDischargePortSearch("");
                                        }}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            formData.discharge_port_id ===
                                            port.id
                                              ? "opacity-100"
                                              : "opacity-0"
                                          }`}
                                        />
                                        {port.code} – {port.name}
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <p className="text-[10px] text-muted-foreground">
                          Defaults to destination port, can be changed
                        </p>
                      </div>
                    </div>

                    <h2 className="text-sm font-semibold border-b pb-2 pt-4">
                      Transport Details
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Transport Mode <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.transport_mode}
                          onValueChange={(v) => {
                            handleChange("transport_mode", v);
                            // Validate existing incoterm against new transport mode
                            const selectedIncoterm = incoterms.find(
                              (i) => i.id === formData.incoterm_id,
                            );
                            if (
                              selectedIncoterm &&
                              !isValidIncotermForTransport(
                                v,
                                selectedIncoterm.code,
                              )
                            ) {
                              handleChange("incoterm_id", "");
                              handleChange("incoterm_code", "");
                              const mode = transportModes.find(
                                (m) => m.code === v,
                              );
                              toast.warning(
                                `Incoterm ${selectedIncoterm.code} tidak valid untuk ${mode?.name || v}. Silakan pilih incoterm lain.`,
                              );
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select transport mode" />
                          </SelectTrigger>
                          <SelectContent>
                            {transportModes.map((m) => (
                              <SelectItem key={m.id} value={m.code}>
                                {m.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Vessel Name{" "}
                          {(formData.transport_mode === "SEA" ||
                            formData.transport_mode === "MULTI") && (
                            <span className="text-red-500">*</span>
                          )}
                        </Label>
                        <Input
                          value={formData.vessel_name}
                          onChange={(e) =>
                            handleChange("vessel_name", e.target.value)
                          }
                          disabled={
                            formData.transport_mode !== "SEA" &&
                            formData.transport_mode !== "MULTI"
                          }
                          className="h-8 text-sm"
                          placeholder="e.g. MV Pacific Star"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Voyage Number</Label>
                        <Input
                          value={formData.voyage_number}
                          onChange={(e) =>
                            handleChange("voyage_number", e.target.value)
                          }
                          className="h-8 text-sm"
                          placeholder="e.g. V123"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          B/L or AWB Number{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={formData.bl_awb_number}
                          onChange={(e) =>
                            handleChange("bl_awb_number", e.target.value)
                          }
                          className="h-8 text-sm"
                          placeholder="e.g. MSCUAB123456"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">B/L or AWB Date</Label>
                        <Input
                          type="date"
                          value={formData.bl_awb_date}
                          onChange={(e) =>
                            handleChange("bl_awb_date", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    <h2 className="text-sm font-semibold border-b pb-2 pt-4">
                      Trade Terms
                    </h2>
                    {(() => {
                      const selectedIncoterm = incoterms.find(
                        (i) => i.id === formData.incoterm_id,
                      );
                      const allowedIncotermCodes = getAllowedIncoterms(
                        formData.transport_mode || "",
                      );
                      const incotermError =
                        selectedIncoterm && formData.transport_mode
                          ? getIncotermTransportError(
                              formData.transport_mode,
                              selectedIncoterm.code,
                            )
                          : null;

                      return (
                        <>
                          {/* Incoterm-Transport validation error */}
                          {incotermError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                              <div className="text-xs text-red-700">
                                <p className="font-medium">
                                  Kombinasi Tidak Valid
                                </p>
                                <p>{incotermError}</p>
                              </div>
                            </div>
                          )}
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs">
                                Incoterm <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={formData.incoterm_id}
                                onValueChange={(v) => {
                                  const incoterm = incoterms.find(
                                    (i) => i.id === v,
                                  );
                                  if (incoterm && formData.transport_mode) {
                                    if (
                                      !isValidIncotermForTransport(
                                        formData.transport_mode,
                                        incoterm.code,
                                      )
                                    ) {
                                      toast.error(
                                        getIncotermTransportError(
                                          formData.transport_mode,
                                          incoterm.code,
                                        ),
                                      );
                                      return;
                                    }
                                  }
                                  handleChange("incoterm_id", v);
                                  if (incoterm) {
                                    handleChange(
                                      "incoterm_code",
                                      incoterm.code,
                                    );
                                  }
                                }}
                              >
                                <SelectTrigger
                                  className={`h-8 text-sm ${incotermError ? "border-red-500" : ""}`}
                                >
                                  <SelectValue placeholder="Select incoterm" />
                                </SelectTrigger>
                                <SelectContent>
                                  {incoterms.map((i) => {
                                    const isAllowed =
                                      !formData.transport_mode ||
                                      allowedIncotermCodes.includes(i.code);
                                    const isSeaOnly = isSeaOnlyIncoterm(i.code);
                                    return (
                                      <SelectItem
                                        key={i.id}
                                        value={i.id}
                                        disabled={!isAllowed}
                                        className={
                                          !isAllowed ? "opacity-50" : ""
                                        }
                                      >
                                        <div className="flex items-center gap-2">
                                          <span>
                                            {i.code} - {i.name}
                                          </span>
                                          {isSeaOnly && (
                                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">
                                              SEA ONLY
                                            </span>
                                          )}
                                          {!isAllowed && (
                                            <span className="text-[10px] text-red-500">
                                              (tidak valid)
                                            </span>
                                          )}
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                              {formData.transport_mode &&
                                formData.transport_mode !== "SEA" && (
                                  <p className="text-[10px] text-muted-foreground">
                                    FOB, CFR, CIF, FAS hanya untuk transport
                                    laut (SEA)
                                  </p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">
                                Currency <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={formData.currency_id}
                                onValueChange={(v) =>
                                  handleChange("currency_id", v)
                                }
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                  {currencies.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                      {c.code} - {c.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">
                                Exchange Rate (IDR)
                              </Label>
                              <Input
                                type="number"
                                value={formData.exchange_rate}
                                onChange={(e) =>
                                  handleChange(
                                    "exchange_rate",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    <h2 className="text-sm font-semibold border-b pb-2 pt-4">
                      Freight & Insurance
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Freight Value ({formData.currency_code || "USD"})
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.freight_value}
                          onChange={(e) =>
                            handleChange(
                              "freight_value",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Insurance Value ({formData.currency_code || "USD"})
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.insurance_value}
                          onChange={(e) =>
                            handleChange(
                              "insurance_value",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Goods */}
                {currentStep === 3 && (
                  <PIBItemsTable
                    items={items}
                    onItemsChange={setItems}
                    exchangeRate={formData.exchange_rate}
                    freightPercentage={freightPercentage}
                    insurancePercentage={insurancePercentage}
                    hasAPI={!!formData.importer_api}
                  />
                )}

                {/* Step 4: Documents */}
                {currentStep === 4 && (
                  <PIBAttachments
                    attachments={attachments}
                    onAttachmentsChange={setAttachments}
                    transportMode={formData.transport_mode}
                  />
                )}

                {/* Step 5: Review */}
                {currentStep === 5 && (
                  <PIBReviewSummary
                    formData={formData}
                    items={items}
                    attachments={attachments}
                    validationErrors={validationErrors}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tax Panel (Steps 3-5) */}
          {currentStep >= 3 && (
            <div className="col-span-1">
              <PIBTaxBreakdown
                items={items}
                currencyCode={formData.currency_code || "USD"}
                exchangeRate={formData.exchange_rate}
                fobValue={formData.fob_value}
                freightValue={formData.freight_value}
                insuranceValue={formData.insurance_value}
                hasAPI={!!formData.importer_api}
              />
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goToPrevStep}
            disabled={currentStep === 1}
            className="gap-1.5"
          >
            <ArrowLeft size={14} />
            Back
          </Button>
          <div className="flex gap-2">
            {currentStep < 5 ? (
              <Button onClick={goToNextStep} className="gap-1.5">
                Next
                <ArrowRight size={14} />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSaving || !canSubmit()}
                className="gap-1.5"
              >
                <Send size={14} />
                {isSaving ? "Submitting..." : "Submit PIB"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* XML Preview Modal */}
      <PIBXMLPreview
        pib={pibDocumentForXML}
        isOpen={xmlPreviewOpen}
        onClose={() => setXmlPreviewOpen(false)}
      />

      {/* Create Loading Port Dialog */}
      <Dialog
        open={showCreatePortDialog}
        onOpenChange={setShowCreatePortDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Loading Port</DialogTitle>
            <DialogDescription>
              Fill in the details for the new loading port
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Kode Pelabuhan <span className="text-red-500">*</span>
              </Label>
              <Input
                value={newPortData.code}
                onChange={(e) =>
                  setNewPortData({
                    ...newPortData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g., CNSHA"
                className="h-8 text-sm"
                maxLength={10}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={newPortData.name}
                onChange={(e) =>
                  setNewPortData({ ...newPortData, name: e.target.value })
                }
                placeholder="e.g., Shanghai Port"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                Kode Negara <span className="text-red-500">*</span>
              </Label>
              <Input
                value={newPortData.country_code}
                onChange={(e) =>
                  setNewPortData({
                    ...newPortData,
                    country_code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g., CN"
                className="h-8 text-sm"
                maxLength={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={newPortData.type}
                onValueChange={(value) =>
                  setNewPortData({ ...newPortData, type: value })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AIR">AIR</SelectItem>
                  <SelectItem value="SEA">SEA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreatePortDialog(false);
                setNewPortData({
                  code: "",
                  name: "",
                  country_code: "",
                  type: "",
                });
              }}
              disabled={isCreatingPort}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateLoadingPort} disabled={isCreatingPort}>
              {isCreatingPort ? "Creating..." : "Create Port"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Supplier Dialog */}
      <Dialog
        open={showCreateSupplierDialog}
        onOpenChange={setShowCreateSupplierDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Supplier</DialogTitle>
            <DialogDescription>
              Fill in the details for the new supplier
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Code
              </Label>
              <Input
                value="Auto-generated"
                disabled
                className="h-8 text-sm bg-muted/50 font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Code will be automatically generated (e.g., SP2026-01-0001)
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={newSupplierData.name}
                onChange={(e) =>
                  setNewSupplierData({ ...newSupplierData, name: e.target.value })
                }
                placeholder="e.g., Shanghai Trading Co."
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Country</Label>
              <Input
                value={newSupplierData.country}
                onChange={(e) =>
                  setNewSupplierData({ ...newSupplierData, country: e.target.value })
                }
                placeholder="e.g., China"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Address</Label>
              <Textarea
                value={newSupplierData.address}
                onChange={(e) =>
                  setNewSupplierData({ ...newSupplierData, address: e.target.value })
                }
                placeholder="Supplier address"
                className="text-sm min-h-[60px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input
                  value={newSupplierData.phone}
                  onChange={(e) =>
                    setNewSupplierData({ ...newSupplierData, phone: e.target.value })
                  }
                  placeholder="Phone number"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input
                  value={newSupplierData.email}
                  onChange={(e) =>
                    setNewSupplierData({ ...newSupplierData, email: e.target.value })
                  }
                  placeholder="Email address"
                  className="h-8 text-sm"
                  type="email"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="supplier-active"
                checked={newSupplierData.is_active}
                onChange={(e) =>
                  setNewSupplierData({ ...newSupplierData, is_active: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="supplier-active" className="text-xs cursor-pointer">
                Active
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateSupplierDialog(false);
                setNewSupplierData({
                  code: "",
                  name: "",
                  country: "",
                  address: "",
                  phone: "",
                  email: "",
                  is_active: true,
                });
              }}
              disabled={isCreatingSupplier}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateSupplier} disabled={isCreatingSupplier}>
              {isCreatingSupplier ? "Creating..." : "Create Supplier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PPJK Search Dialog */}
      <PPJKSearchDialog
        open={ppjkDialogOpen}
        onOpenChange={setPpjkDialogOpen}
        selectedId={formData.ppjk_id}
        onSelect={(ppjk) => {
          setFormData((prev) => ({
            ...prev,
            ppjk_id: ppjk.id,
            ppjk_npwp: ppjk.npwp || "",
            ppjk_name: ppjk.name,
          }));
        }}
      />
    </AppLayout>
  );
}
