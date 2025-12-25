import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Save, Send, Code, AlertCircle } from 'lucide-react';
import { PIBFormStepper, PIB_FORM_STEPS } from '@/components/pib/PIBFormStepper';
import { PIBItemsTable } from '@/components/pib/PIBItemsTable';
import { PIBAttachments } from '@/components/pib/PIBAttachments';
import { PIBReviewSummary } from '@/components/pib/PIBReviewSummary';
import { PIBXMLPreview } from '@/components/pib/PIBXMLPreview';
import { PIBTaxBreakdown } from '@/components/pib/PIBTaxBreakdown';
import { PIBItem, PIBDocument, TRANSPORT_MODES, validatePIBDocument, calculateTotalPIBTax } from '@/types/pib';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/lib/supabase';

// Types for master data
interface Company {
  id: string;
  code: string;
  name: string;
  npwp: string;
  address: string;
  api?: string;
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
  document_type: string;
  file: File;
}

interface FormData {
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
  importer_id: '',
  importer_npwp: '',
  importer_name: '',
  importer_address: '',
  importer_api: '',
  supplier_id: '',
  supplier_name: '',
  supplier_address: '',
  supplier_country: '',
  ppjk_id: '',
  ppjk_npwp: '',
  ppjk_name: '',
  customs_office_id: '',
  customs_office_code: '',
  customs_office_name: '',
  loading_port_id: '',
  loading_port_code: '',
  loading_port_name: '',
  loading_country: '',
  discharge_port_id: '',
  discharge_port_code: '',
  discharge_port_name: '',
  incoterm_id: '',
  incoterm_code: '',
  currency_id: '',
  currency_code: '',
  exchange_rate: 15750,
  transport_mode: 'SEA',
  vessel_name: '',
  voyage_number: '',
  bl_awb_number: '',
  bl_awb_date: '',
  total_packages: 0,
  package_unit: 'CTN',
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
  notes: '',
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

  // Master data from Supabase
  const [companies, setCompanies] = useState<Company[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ppjkList, setPpjkList] = useState<PPJK[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [incoterms, setIncoterms] = useState<Incoterm[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  // Fetch master data from Supabase
  const fetchMasterData = useCallback(async () => {
    try {
      const [companiesRes, suppliersRes, ppjkRes, portsRes, incotermsRes, currenciesRes] = await Promise.all([
        supabase.from('companies').select('id, code, name, npwp, address').eq('is_active', true).order('name'),
        supabase.from('suppliers').select('id, code, name, country, address').eq('is_active', true).order('name'),
        supabase.from('ppjk').select('id, code, name, npwp').eq('is_active', true).order('name'),
        supabase.from('ports').select('id, code, name, type').eq('is_active', true).order('name'),
        supabase.from('incoterms').select('id, code, name').eq('is_active', true).order('code'),
        supabase.from('currencies').select('id, code, name, exchange_rate').eq('is_active', true).order('code'),
      ]);

      if (companiesRes.data) setCompanies(companiesRes.data);
      if (suppliersRes.data) setSuppliers(suppliersRes.data);
      if (ppjkRes.data) setPpjkList(ppjkRes.data);
      if (portsRes.data) setPorts(portsRes.data);
      if (incotermsRes.data) setIncoterms(incotermsRes.data);
      if (currenciesRes.data) setCurrencies(currenciesRes.data);
    } catch (error) {
      console.error('Error fetching master data:', error);
    }
  }, []);

  // Fetch master data on mount
  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  // Calculate freight and insurance percentages for proportional distribution
  const freightPercentage = formData.fob_value > 0 ? (formData.freight_value / formData.fob_value) * 100 : 5;
  const insurancePercentage = formData.fob_value > 0 ? (formData.insurance_value / formData.fob_value) * 100 : 0.5;

  useEffect(() => {
    // Recalculate totals when items change
    const totals = calculateTotalPIBTax(items as PIBItem[]);
    const totalNetWeight = items.reduce((sum, item) => sum + (item.net_weight || 0), 0);
    const totalGrossWeight = items.reduce((sum, item) => sum + (item.gross_weight || 0), 0);
    const totalPackages = items.reduce((sum, item) => sum + (item.package_count || 0), 0);
    const totalFOB = items.reduce((sum, item) => sum + (item.total_price || 0), 0);

    setFormData(prev => ({
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
    }));
  }, [items]);

  const handleChange = (field: keyof FormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-fill related fields
    if (field === 'importer_id') {
      const company = companies.find(c => c.id === value);
      if (company) {
        setFormData(prev => ({
          ...prev,
          importer_id: company.id,
          importer_npwp: company.npwp,
          importer_name: company.name,
          importer_address: company.address,
          importer_api: company.api,
        }));
      }
    }

    if (field === 'supplier_id') {
      const supplier = suppliers.find(s => s.id === value);
      if (supplier) {
        setFormData(prev => ({
          ...prev,
          supplier_id: supplier.id,
          supplier_name: supplier.name,
          supplier_address: supplier.address,
          supplier_country: supplier.country,
        }));
      }
    }

    if (field === 'ppjk_id') {
      const ppjk = ppjkList.find(p => p.id === value);
      if (ppjk) {
        setFormData(prev => ({
          ...prev,
          ppjk_id: ppjk.id,
          ppjk_npwp: ppjk.npwp,
          ppjk_name: ppjk.name,
        }));
      }
    }

    if (field === 'loading_port_id') {
      const port = ports.find(p => p.id === value);
      if (port) {
        setFormData(prev => ({
          ...prev,
          loading_port_id: port.id,
          loading_port_code: port.code,
          loading_port_name: port.name,
        }));
      }
    }

    if (field === 'discharge_port_id' || field === 'customs_office_id') {
      const port = ports.find(p => p.id === value);
      if (port) {
        if (field === 'discharge_port_id') {
          setFormData(prev => ({
            ...prev,
            discharge_port_id: port.id,
            discharge_port_code: port.code,
            discharge_port_name: port.name,
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            customs_office_id: port.id,
            customs_office_code: port.code,
            customs_office_name: port.name,
          }));
        }
      }
    }

    if (field === 'incoterm_id') {
      const incoterm = incoterms.find(i => i.id === value);
      if (incoterm) {
        setFormData(prev => ({
          ...prev,
          incoterm_id: incoterm.id,
          incoterm_code: incoterm.code,
        }));
      }
    }

    if (field === 'currency_id') {
      const currency = currencies.find(c => c.id === value);
      if (currency) {
        setFormData(prev => ({
          ...prev,
          currency_id: currency.id,
          currency_code: currency.code,
          exchange_rate: currency.exchange_rate,
        }));
      }
    }
  };

  const validateCurrentStep = (): boolean => {
    const errors: string[] = [];

    if (currentStep === 1) {
      if (!formData.importer_id) errors.push('Importer is required');
      if (!formData.supplier_id) errors.push('Supplier is required');
    }

    if (currentStep === 2) {
      if (!formData.customs_office_id) errors.push('Customs office is required');
      if (!formData.loading_port_id) errors.push('Loading port is required');
      if (!formData.discharge_port_id) errors.push('Discharge port is required');
      if (!formData.incoterm_id) errors.push('Incoterm is required');
      if (!formData.currency_id) errors.push('Currency is required');
      if (!formData.transport_mode) errors.push('Transport mode is required');
      if (!formData.bl_awb_number) errors.push('B/L or AWB number is required');
    }

    if (currentStep === 3) {
      if (items.length === 0) errors.push('At least one item is required');
    }

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return false;
    }
    return true;
  };

  const goToNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const goToPrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Draft saved successfully');
    } catch (error) {
      toast.error('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    const doc: PIBDocument = {
      id: '',
      document_number: null,
      registration_number: null,
      registration_date: null,
      sppb_number: null,
      sppb_date: null,
      status: 'DRAFT',
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
      toast.error('Please fix validation errors before submitting');
      return;
    }

    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('PIB submitted successfully');
      navigate('/pib');
    } catch (error) {
      toast.error('Failed to submit PIB');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewXML = () => {
    setXmlPreviewOpen(true);
  };

  const pibDocumentForXML: PIBDocument = {
    id: '',
    document_number: `PIB-${new Date().getFullYear()}-DRAFT`,
    registration_number: null,
    registration_date: null,
    sppb_number: null,
    sppb_date: null,
    status: 'DRAFT',
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
            <Button variant="ghost" size="icon" onClick={() => navigate('/pib')}>
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">
                {isEditMode ? 'Edit PIB' : 'Create New PIB'}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Import Declaration (Pemberitahuan Impor Barang)
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePreviewXML} className="gap-1.5">
              <Code size={14} />
              Preview XML
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={isSaving} className="gap-1.5">
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
        <div className="grid grid-cols-3 gap-4">
          {/* Form Content */}
          <div className="col-span-2">
            <Card>
              <CardContent className="p-6">
                {/* Step 1: Importer Info */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-sm font-semibold border-b pb-2">Importer Information</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Importer <span className="text-red-500">*</span></Label>
                        <Select value={formData.importer_id} onValueChange={(v) => handleChange('importer_id', v)}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select importer" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">NPWP</Label>
                        <Input value={formData.importer_npwp} disabled className="h-8 text-sm bg-muted/30" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">API (Angka Pengenal Importir)</Label>
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
                        <Textarea value={formData.importer_address} disabled className="text-sm bg-muted/30 min-h-[60px]" />
                      </div>
                    </div>

                    <h2 className="text-sm font-semibold border-b pb-2 pt-4">Supplier Information</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Supplier <span className="text-red-500">*</span></Label>
                        <Select value={formData.supplier_id} onValueChange={(v) => handleChange('supplier_id', v)}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.code} - {s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Country</Label>
                        <Input value={formData.supplier_country} disabled className="h-8 text-sm bg-muted/30" />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-xs">Address</Label>
                        <Textarea value={formData.supplier_address} disabled className="text-sm bg-muted/30 min-h-[60px]" />
                      </div>
                    </div>

                    <h2 className="text-sm font-semibold border-b pb-2 pt-4">PPJK (Customs Broker)</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">PPJK</Label>
                        <Select value={formData.ppjk_id} onValueChange={(v) => handleChange('ppjk_id', v)}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select PPJK (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {ppjkList.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">PPJK NPWP</Label>
                        <Input value={formData.ppjk_npwp} disabled className="h-8 text-sm bg-muted/30" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Transport */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-sm font-semibold border-b pb-2">Customs & Ports</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Customs Office <span className="text-red-500">*</span></Label>
                        <Select value={formData.customs_office_id} onValueChange={(v) => handleChange('customs_office_id', v)}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select customs office" />
                          </SelectTrigger>
                          <SelectContent>
                            {ports.filter(p => p.code.startsWith('ID')).map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Loading Port <span className="text-red-500">*</span></Label>
                        <Select value={formData.loading_port_id} onValueChange={(v) => handleChange('loading_port_id', v)}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select loading port" />
                          </SelectTrigger>
                          <SelectContent>
                            {ports.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Loading Country</Label>
                        <Input
                          value={formData.loading_country}
                          onChange={(e) => handleChange('loading_country', e.target.value)}
                          className="h-8 text-sm"
                          placeholder="e.g. China"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Discharge Port <span className="text-red-500">*</span></Label>
                        <Select value={formData.discharge_port_id} onValueChange={(v) => handleChange('discharge_port_id', v)}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select discharge port" />
                          </SelectTrigger>
                          <SelectContent>
                            {ports.filter(p => p.code.startsWith('ID')).map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <h2 className="text-sm font-semibold border-b pb-2 pt-4">Transport Details</h2>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Transport Mode <span className="text-red-500">*</span></Label>
                        <Select value={formData.transport_mode} onValueChange={(v) => handleChange('transport_mode', v)}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TRANSPORT_MODES.map((m) => (
                              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Vessel Name</Label>
                        <Input
                          value={formData.vessel_name}
                          onChange={(e) => handleChange('vessel_name', e.target.value)}
                          className="h-8 text-sm"
                          placeholder="e.g. MV Pacific Star"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Voyage Number</Label>
                        <Input
                          value={formData.voyage_number}
                          onChange={(e) => handleChange('voyage_number', e.target.value)}
                          className="h-8 text-sm"
                          placeholder="e.g. V123"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">B/L or AWB Number <span className="text-red-500">*</span></Label>
                        <Input
                          value={formData.bl_awb_number}
                          onChange={(e) => handleChange('bl_awb_number', e.target.value)}
                          className="h-8 text-sm"
                          placeholder="e.g. MSCUAB123456"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">B/L or AWB Date</Label>
                        <Input
                          type="date"
                          value={formData.bl_awb_date}
                          onChange={(e) => handleChange('bl_awb_date', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    <h2 className="text-sm font-semibold border-b pb-2 pt-4">Trade Terms</h2>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Incoterm <span className="text-red-500">*</span></Label>
                        <Select value={formData.incoterm_id} onValueChange={(v) => handleChange('incoterm_id', v)}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select incoterm" />
                          </SelectTrigger>
                          <SelectContent>
                            {incoterms.map((i) => (
                              <SelectItem key={i.id} value={i.id}>{i.code} - {i.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Currency <span className="text-red-500">*</span></Label>
                        <Select value={formData.currency_id} onValueChange={(v) => handleChange('currency_id', v)}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {currencies.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Exchange Rate (IDR)</Label>
                        <Input
                          type="number"
                          value={formData.exchange_rate}
                          onChange={(e) => handleChange('exchange_rate', parseFloat(e.target.value) || 0)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    <h2 className="text-sm font-semibold border-b pb-2 pt-4">Freight & Insurance</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Freight Value ({formData.currency_code || 'USD'})</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.freight_value}
                          onChange={(e) => handleChange('freight_value', parseFloat(e.target.value) || 0)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Insurance Value ({formData.currency_code || 'USD'})</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.insurance_value}
                          onChange={(e) => handleChange('insurance_value', parseFloat(e.target.value) || 0)}
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
                currencyCode={formData.currency_code || 'USD'}
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
                disabled={isSaving || validationErrors.length > 0}
                className="gap-1.5"
              >
                <Send size={14} />
                {isSaving ? 'Submitting...' : 'Submit PIB'}
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
    </AppLayout>
  );
}
