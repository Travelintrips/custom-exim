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
import { ArrowLeft, ArrowRight, Save, Send, Code, AlertCircle, Loader2 } from 'lucide-react';
import { PEBFormStepper, PEB_FORM_STEPS } from '@/components/peb/PEBFormStepper';
import { PEBItemsTable } from '@/components/peb/PEBItemsTable';
import { PEBAttachments } from '@/components/peb/PEBAttachments';
import { PEBReviewSummary } from '@/components/peb/PEBReviewSummary';
import { PEBXMLPreview } from '@/components/peb/PEBXMLPreview';
import { PEBItem, PEBDocument, validatePEBDocument } from '@/types/peb';
import { useRole } from '@/hooks/useRole';
import { 
  INCOTERM_TRANSPORT_RULES, 
  isValidIncotermForTransport, 
  getIncotermTransportError,
  isSeaOnlyIncoterm,
  getAllowedIncoterms 
} from '@/lib/validation/incoterm-transport-rules';
import { 
  create_export_peb, 
  submit_peb,
  validatePEBForSubmission,
  CreatePEBGoodsItem, 
  CreatePEBDocument 
} from '@/lib/peb/peb-service';
import { supabase } from '@/lib/supabase';

// Type definitions for database entities
interface Company {
  id: string;
  code: string;
  name: string;
  npwp: string | null;
  address: string | null;
  type: string;
  country_id: string | null;
  country?: { code: string; name: string; name_en: string | null } | null;
}

interface Buyer {
  id: string;
  code: string;
  name: string;
  address: string | null;
  country_id: string | null;
  country?: { code: string; name: string; name_en: string | null } | null;
}

interface PPJK {
  id: string;
  code: string;
  name: string;
  npwp: string | null;
}

interface CustomsOffice {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface Port {
  id: string;
  code: string;
  name: string;
  type: string | null;
  country_code: string | null;
  customs_office_id: string | null;
  country?: { code: string; name: string } | null;
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
  exchange_rate: number | null;
}

interface AttachmentWithFile {
  document_type: string;
  file: File;
}

interface FormData {
  exporter_id: string;
  exporter_npwp: string;
  exporter_name: string;
  exporter_address: string;
  buyer_id: string;
  buyer_name: string;
  buyer_address: string;
  buyer_country: string;
  ppjk_id: string;
  ppjk_npwp: string;
  ppjk_name: string;
  customs_office_id: string;
  customs_office_code: string;
  customs_office_name: string;
  loading_port_id: string;
  loading_port_code: string;
  loading_port_name: string;
  destination_port_id: string;
  destination_port_code: string;
  destination_port_name: string;
  destination_country: string;
  incoterm_id: string;
  incoterm_code: string;
  currency_id: string;
  currency_code: string;
  exchange_rate: number;
  transport_mode: string;
  vessel_name: string;
  voyage_number: string;
  total_packages: number;
  package_unit: string;
  gross_weight: number;
  net_weight: number;
  total_fob_value: number;
  total_fob_idr: number;
  freight_value: number;
  insurance_value: number;
  notes: string;
}

const initialFormData: FormData = {
  exporter_id: '',
  exporter_npwp: '',
  exporter_name: '',
  exporter_address: '',
  buyer_id: '',
  buyer_name: '',
  buyer_address: '',
  buyer_country: '',
  ppjk_id: '',
  ppjk_npwp: '',
  ppjk_name: '',
  customs_office_id: '',
  customs_office_code: '',
  customs_office_name: '',
  loading_port_id: '',
  loading_port_code: '',
  loading_port_name: '',
  destination_port_id: '',
  destination_port_code: '',
  destination_port_name: '',
  destination_country: '',
  incoterm_id: '',
  incoterm_code: '',
  currency_id: '',
  currency_code: '',
  exchange_rate: 15750,
  transport_mode: 'SEA',
  vessel_name: '',
  voyage_number: '',
  total_packages: 0,
  package_unit: 'CTN',
  gross_weight: 0,
  net_weight: 0,
  total_fob_value: 0,
  total_fob_idr: 0,
  freight_value: 0,
  insurance_value: 0,
  notes: '',
};

export default function PEBFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { permissions } = useRole();
  const isEditMode = !!id;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [items, setItems] = useState<Partial<PEBItem>[]>([]);
  const [attachments, setAttachments] = useState<AttachmentWithFile[]>([]);
  const [xmlPreviewOpen, setXmlPreviewOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Database-sourced master data states
  const [companies, setCompanies] = useState<Company[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [ppjkList, setPpjkList] = useState<PPJK[]>([]);
  const [customsOffices, setCustomsOffices] = useState<CustomsOffice[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [transportModes, setTransportModes] = useState<TransportMode[]>([]);
  const [incoterms, setIncoterms] = useState<Incoterm[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loadingMasterData, setLoadingMasterData] = useState(true);

  // Fetch master data from Supabase
  const fetchMasterData = useCallback(async () => {
    setLoadingMasterData(true);
    try {
      // Fetch companies (exporters) - only active exporters or companies that do both
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, code, name, npwp, address, type, country_id, country:countries(code, name, name_en)')
        .in('type', ['exporter', 'both'])
        .eq('is_active', true)
        .order('name');

      if (companiesError) {
        console.error('Error fetching companies:', companiesError);
        toast.error('Failed to load exporters');
      } else {
        setCompanies((companiesData || []) as unknown as Company[]);
      }

      // Fetch buyers - only active buyers
      const { data: buyersData, error: buyersError } = await supabase
        .from('buyers')
        .select('id, code, name, address, country_id, country:countries(code, name, name_en)')
        .eq('is_active', true)
        .order('name');

      if (buyersError) {
        console.error('Error fetching buyers:', buyersError);
        toast.error('Failed to load buyers');
      } else {
        setBuyers((buyersData || []) as unknown as Buyer[]);
      }

      // Fetch PPJK - only active PPJK
      const { data: ppjkData, error: ppjkError } = await supabase
        .from('ppjk')
        .select('id, code, name, npwp')
        .eq('is_active', true)
        .order('name');

      if (ppjkError) {
        console.error('Error fetching PPJK:', ppjkError);
        toast.error('Failed to load PPJK');
      } else {
        setPpjkList((ppjkData || []) as PPJK[]);
      }

      // Fetch customs offices
      const { data: customsOfficesData, error: customsOfficesError } = await supabase
        .from('customs_offices')
        .select('id, code, name, type')
        .eq('is_active', true)
        .order('name');

      if (customsOfficesError) {
        console.error('Error fetching customs offices:', customsOfficesError);
        toast.error('Failed to load customs offices');
      } else {
        setCustomsOffices((customsOfficesData || []) as CustomsOffice[]);
      }

      // Fetch ports - only active ports
      const { data: portsData, error: portsError } = await supabase
        .from('ports')
        .select('id, code, name, type, country_code, customs_office_id, country:countries(code, name)')
        .eq('is_active', true)
        .order('name');

      if (portsError) {
        console.error('Error fetching ports:', portsError);
        toast.error('Failed to load ports');
      } else {
        setPorts((portsData || []) as unknown as Port[]);
      }

      // Fetch transport modes
      const { data: transportModesData, error: transportModesError } = await supabase
        .from('transport_modes')
        .select('id, code, name, requires_vessel, requires_voyage')
        .eq('is_active', true)
        .order('name');

      if (transportModesError) {
        console.error('Error fetching transport modes:', transportModesError);
        toast.error('Failed to load transport modes');
      } else {
        setTransportModes((transportModesData || []) as TransportMode[]);
      }

      // Fetch incoterms - only active incoterms
      const { data: incotermsData, error: incotermsError } = await supabase
        .from('incoterms')
        .select('id, code, name')
        .eq('is_active', true)
        .order('code');

      if (incotermsError) {
        console.error('Error fetching incoterms:', incotermsError);
        toast.error('Failed to load incoterms');
      } else {
        setIncoterms((incotermsData || []) as Incoterm[]);
      }

      // Fetch currencies - only active currencies
      const { data: currenciesData, error: currenciesError } = await supabase
        .from('currencies')
        .select('id, code, name, exchange_rate')
        .eq('is_active', true)
        .order('code');

      if (currenciesError) {
        console.error('Error fetching currencies:', currenciesError);
        toast.error('Failed to load currencies');
      } else {
        setCurrencies((currenciesData || []) as Currency[]);
      }
    } catch (error) {
      console.error('Error fetching master data:', error);
      toast.error('Failed to load master data');
    } finally {
      setLoadingMasterData(false);
    }
  }, []);

  // Load master data on component mount
  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  useEffect(() => {
    // Recalculate totals when items change
    const totalFOB = items.reduce((sum, item) => sum + (item.fob_value || 0), 0);
    const totalFOBIDR = items.reduce((sum, item) => sum + (item.fob_idr || 0), 0);
    const totalNetWeight = items.reduce((sum, item) => sum + (item.net_weight || 0), 0);
    const totalGrossWeight = items.reduce((sum, item) => sum + (item.gross_weight || 0), 0);
    const totalPackages = items.reduce((sum, item) => sum + (item.package_count || 0), 0);

    setFormData(prev => ({
      ...prev,
      total_fob_value: totalFOB,
      total_fob_idr: totalFOBIDR,
      net_weight: totalNetWeight,
      gross_weight: totalGrossWeight,
      total_packages: totalPackages,
    }));
  }, [items]);

  const handleChange = (field: keyof FormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-fill related fields from database-sourced data
    if (field === 'exporter_id') {
      const company = companies.find(c => c.id === value);
      if (company) {
        setFormData(prev => ({
          ...prev,
          exporter_id: company.id,
          exporter_npwp: company.npwp || '',
          exporter_name: company.name,
          exporter_address: company.address || '',
        }));
      }
    }

    if (field === 'buyer_id') {
      const buyer = buyers.find(b => b.id === value);
      if (buyer) {
        const countryName = buyer.country?.name_en || buyer.country?.name || '';
        setFormData(prev => ({
          ...prev,
          buyer_id: buyer.id,
          buyer_name: buyer.name,
          buyer_address: buyer.address || '',
          buyer_country: countryName,
        }));
      }
    }

    if (field === 'ppjk_id') {
      const ppjk = ppjkList.find(p => p.id === value);
      if (ppjk) {
        setFormData(prev => ({
          ...prev,
          ppjk_id: ppjk.id,
          ppjk_npwp: ppjk.npwp || '',
          ppjk_name: ppjk.name,
        }));
      }
    }

    if (field === 'loading_port_id' || field === 'customs_office_id') {
      const port = ports.find(p => p.id === value);
      if (port) {
        if (field === 'loading_port_id') {
          setFormData(prev => ({
            ...prev,
            loading_port_id: port.id,
            loading_port_code: port.code,
            loading_port_name: port.name,
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

    if (field === 'destination_port_id') {
      const port = ports.find(p => p.id === value);
      if (port) {
        setFormData(prev => ({
          ...prev,
          destination_port_id: port.id,
          destination_port_code: port.code,
          destination_port_name: port.name,
        }));
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
          exchange_rate: currency.exchange_rate || 0,
        }));
      }
    }
  };

  const validateCurrentStep = (): boolean => {
    const errors: string[] = [];

    if (currentStep === 1) {
      if (!formData.exporter_id) errors.push('Exporter is required');
      if (!formData.buyer_id) errors.push('Buyer is required');
    }

    if (currentStep === 2) {
      if (!formData.customs_office_id) errors.push('Customs office is required');
      if (!formData.loading_port_id) errors.push('Loading port is required');
      if (!formData.destination_port_id) errors.push('Destination port is required');
      if (!formData.incoterm_id) errors.push('Incoterm is required');
      if (!formData.currency_id) errors.push('Currency is required');
      if (!formData.transport_mode) errors.push('Transport mode is required');
      
      // Validate vessel/voyage for SEA/MULTI transport modes
      const selectedMode = transportModes.find(m => m.code === formData.transport_mode);
      if (selectedMode?.requires_vessel && !formData.vessel_name) {
        errors.push('Vessel name is required for ' + selectedMode.name);
      }
      if (selectedMode?.requires_voyage && !formData.voyage_number) {
        errors.push('Voyage number is required for ' + selectedMode.name);
      }
      
      // CRITICAL: Validate incoterm-transport mode combination (CEISA/DJBC compliance)
      const selectedIncoterm = incoterms.find(i => i.id === formData.incoterm_id);
      if (selectedIncoterm && formData.transport_mode) {
        if (!isValidIncotermForTransport(formData.transport_mode, selectedIncoterm.code)) {
          const errorMsg = getIncotermTransportError(formData.transport_mode, selectedIncoterm.code);
          errors.push(errorMsg || `Incoterm ${selectedIncoterm.code} tidak valid untuk transport mode ${formData.transport_mode}`);
          // Log invalid attempt for audit
          console.warn('[AUDIT] Invalid incoterm-transport combination attempted:', {
            transport_mode: formData.transport_mode,
            incoterm: selectedIncoterm.code,
          });
        }
      }
      
      // Validate freight/insurance for CIF/CIP incoterms
      if (selectedIncoterm?.code === 'CIF' || selectedIncoterm?.code === 'CIP') {
        if (!formData.freight_value || formData.freight_value <= 0) {
          errors.push('Freight value is required for ' + selectedIncoterm.code);
        }
        if (!formData.insurance_value || formData.insurance_value <= 0) {
          errors.push('Insurance value is required for ' + selectedIncoterm.code);
        }
      }
    }

    if (currentStep === 3) {
      if (items.length === 0) errors.push('At least one item is required');
    }

    if (currentStep === 4) {
      // Validate required documents based on transport mode
      const uploadedTypes = new Set([
        ...attachments.map(att => att.document_type),
      ]);

      // Always required
      if (!uploadedTypes.has('INVOICE')) {
        errors.push('Commercial Invoice is required');
      }
      if (!uploadedTypes.has('PACKING_LIST')) {
        errors.push('Packing List is required');
      }

      // Transport-specific required documents
      if (formData.transport_mode === 'AIR') {
        if (!uploadedTypes.has('AWB')) {
          errors.push('Air Waybill is required for AIR transport');
        }
      } else if (formData.transport_mode === 'SEA') {
        if (!uploadedTypes.has('BL')) {
          errors.push('Bill of Lading is required for SEA transport');
        }
      }

      if (errors.length > 0) {
        toast.error('Required supporting documents are incomplete');
      }
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

  // Check if Submit button should be enabled (comprehensive validation)
  const canSubmit = (): boolean => {
    // Exporter required
    if (!formData.exporter_id) return false;
    
    // Buyer required
    if (!formData.buyer_id && !formData.buyer_name) return false;
    
    // Transport vs Incoterm validation
    if (formData.transport_mode && formData.incoterm_code) {
      if (formData.transport_mode === 'AIR' && ['FOB', 'CFR', 'CIF', 'FAS'].includes(formData.incoterm_code)) {
        return false;
      }
      if (!isValidIncotermForTransport(formData.transport_mode, formData.incoterm_code)) {
        return false;
      }
    }
    
    // Goods required
    if (items.length === 0) return false;
    
    // Validate goods items
    const hasInvalidItems = items.some(item => {
      if (!item.hs_code) return true;
      if (!item.net_weight || item.net_weight <= 0) return true;
      if (item.gross_weight !== undefined && item.net_weight !== undefined && item.gross_weight < item.net_weight) return true;
      if (!item.quantity_unit) return true;
      return false;
    });
    if (hasInvalidItems) return false;
    
    // Documents validation
    const uploadedDocTypes = attachments.map(att => att.document_type);
    if (!uploadedDocTypes.includes('INVOICE')) return false;
    if (!uploadedDocTypes.includes('PACKING_LIST')) return false;
    
    if (formData.transport_mode === 'AIR' && !uploadedDocTypes.includes('AWB')) return false;
    if (formData.transport_mode === 'SEA' && !uploadedDocTypes.includes('BL')) return false;
    
    // No validation errors
    if (validationErrors.length > 0) return false;
    
    return true;
  };

  const handleSaveDraft = async () => {
    // Validate minimum required fields
    if (!formData.exporter_id) {
      toast.error('Please select an exporter first');
      return;
    }

    setIsSaving(true);
    try {
      // Convert items to CreatePEBGoodsItem format
      const goods: CreatePEBGoodsItem[] = items.map((item) => ({
        hs_code: item.hs_code || '',
        product_code: item.product_code || undefined,
        product_description: item.product_description || '',
        quantity: item.quantity || 0,
        quantity_unit: item.quantity_unit || 'PCS',
        net_weight: item.net_weight || 0,
        gross_weight: item.gross_weight || 0,
        unit_price: item.unit_price || 0,
        fob_value: item.fob_value || 0,
        country_of_origin: item.country_of_origin || undefined,
        packaging_code: item.packaging_code || undefined,
        package_count: item.package_count || 0,
        notes: item.notes || undefined,
      }));

      // Convert attachments to CreatePEBDocument format
      const documents: CreatePEBDocument[] = attachments.map((att) => ({
        doc_type: att.document_type,
        file_name: att.file.name,
        file_size: att.file.size,
        mime_type: att.file.type,
      }));

      // Call create_export_peb function
      const result = await create_export_peb({
        exporter_id: formData.exporter_id,
        goods: goods.length > 0 ? goods : [{ hs_code: '', product_description: '', quantity: 0, fob_value: 0 }],
        documents,
        buyer_id: formData.buyer_id || undefined,
        buyer_name: formData.buyer_name || undefined,
        buyer_address: formData.buyer_address || undefined,
        buyer_country: formData.buyer_country || undefined,
        ppjk_id: formData.ppjk_id || undefined,
        ppjk_npwp: formData.ppjk_npwp || undefined,
        ppjk_name: formData.ppjk_name || undefined,
        customs_office_id: formData.customs_office_id || undefined,
        customs_office_code: formData.customs_office_code || undefined,
        customs_office_name: formData.customs_office_name || undefined,
        loading_port_id: formData.loading_port_id || undefined,
        loading_port_code: formData.loading_port_code || undefined,
        loading_port_name: formData.loading_port_name || undefined,
        destination_port_id: formData.destination_port_id || undefined,
        destination_port_code: formData.destination_port_code || undefined,
        destination_port_name: formData.destination_port_name || undefined,
        destination_country: formData.destination_country || undefined,
        incoterm_id: formData.incoterm_id || undefined,
        incoterm_code: formData.incoterm_code || undefined,
        currency_id: formData.currency_id || undefined,
        currency_code: formData.currency_code || undefined,
        exchange_rate: formData.exchange_rate || undefined,
        transport_mode: formData.transport_mode || undefined,
        vessel_name: formData.vessel_name || undefined,
        voyage_number: formData.voyage_number || undefined,
        notes: formData.notes || undefined,
      });

      if (result.success) {
        toast.success(`Draft saved successfully! PEB ID: ${result.peb_id}`);
        if (result.peb_id) {
          navigate(`/peb/${result.peb_id}`);
        }
      } else {
        toast.error(result.errors.join(', ') || 'Failed to save draft');
      }
    } catch (error) {
      console.error('Save draft error:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    // === VALIDATION ENGINE: validateBeforeSubmit ===
    
    const clientErrors: string[] = [];
    
    // === DOCUMENT INFO VALIDATION ===
    if (!formData.exporter_id) {
      clientErrors.push('Exporter NPWP wajib diisi');
    }
    if (!formData.buyer_id && !formData.buyer_name) {
      clientErrors.push('Buyer wajib diisi');
    }

    // === TRANSPORT vs INCOTERM VALIDATION ===
    if (formData.transport_mode && formData.incoterm_code) {
      if (formData.transport_mode === 'AIR' && ['FOB', 'CFR', 'CIF', 'FAS'].includes(formData.incoterm_code)) {
        clientErrors.push(`Incoterm ${formData.incoterm_code} tidak valid untuk transport AIR`);
      }
      if (!isValidIncotermForTransport(formData.transport_mode, formData.incoterm_code)) {
        const errorMsg = getIncotermTransportError(formData.transport_mode, formData.incoterm_code);
        if (errorMsg) clientErrors.push(errorMsg);
      }
    }

    // === GOODS VALIDATION ===
    if (items.length === 0) {
      clientErrors.push('Minimal satu item barang wajib diisi');
    }

    const totalFOB = items.reduce((sum, item) => sum + (item.fob_value || 0), 0);
    if (totalFOB === 0) {
      clientErrors.push('Total FOB value tidak boleh 0');
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
      if (item.gross_weight !== undefined && item.net_weight !== undefined && item.gross_weight < item.net_weight) {
        clientErrors.push(`Item ${itemNum}: Gross weight tidak boleh kurang dari Net weight`);
      }
      if (!item.quantity_unit) {
        clientErrors.push(`Item ${itemNum}: Unit wajib diisi (dari HS Code)`);
      }
    });

    // === SUPPORTING DOCUMENTS VALIDATION ===
    const uploadedDocTypes = attachments.map(att => att.document_type);
    
    if (!uploadedDocTypes.includes('INVOICE')) {
      clientErrors.push('Dokumen wajib belum lengkap: Commercial Invoice');
    }
    if (!uploadedDocTypes.includes('PACKING_LIST')) {
      clientErrors.push('Dokumen wajib belum lengkap: Packing List');
    }
    
    if (formData.transport_mode === 'AIR') {
      if (!uploadedDocTypes.includes('AWB')) {
        clientErrors.push('Air Waybill wajib untuk transport AIR');
      }
    } else if (formData.transport_mode === 'SEA') {
      if (!uploadedDocTypes.includes('BL')) {
        clientErrors.push('Bill of Lading wajib untuk transport SEA');
      }
    }

    // === CHECK VALIDATION RESULT ===
    if (clientErrors.length > 0) {
      setValidationErrors(clientErrors);
      clientErrors.forEach(err => toast.error(err));
      return;
    }

    // Build document for additional validation
    const doc: PEBDocument = {
      id: '',
      document_number: null,
      registration_number: null,
      registration_date: null,
      npe_number: null,
      npe_date: null,
      status: 'DRAFT',
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
      items: items as PEBItem[],
    };

    const validation = validatePEBDocument(doc);
    setValidationErrors(validation.errors);

    if (!validation.isValid) {
      toast.error('Please fix validation errors before submitting');
      return;
    }

    setIsSaving(true);
    try {
      // First, save the PEB as draft to get peb_id
      const goods: CreatePEBGoodsItem[] = items.map((item) => ({
        hs_code: item.hs_code || '',
        product_code: item.product_code || undefined,
        product_description: item.product_description || '',
        quantity: item.quantity || 0,
        quantity_unit: item.quantity_unit || 'PCS',
        net_weight: item.net_weight || 0,
        gross_weight: item.gross_weight || 0,
        unit_price: item.unit_price || 0,
        fob_value: item.fob_value || 0,
        country_of_origin: item.country_of_origin || undefined,
        packaging_code: item.packaging_code || undefined,
        package_count: item.package_count || 0,
        notes: item.notes || undefined,
      }));

      const documents: CreatePEBDocument[] = attachments.map((att) => ({
        doc_type: att.document_type,
        file_name: att.file.name,
        file_size: att.file.size,
        mime_type: att.file.type,
      }));

      // Step 1: Create PEB document first
      const createResult = await create_export_peb({
        exporter_id: formData.exporter_id,
        goods,
        documents,
        buyer_id: formData.buyer_id || undefined,
        buyer_name: formData.buyer_name || undefined,
        buyer_address: formData.buyer_address || undefined,
        buyer_country: formData.buyer_country || undefined,
        ppjk_id: formData.ppjk_id || undefined,
        ppjk_npwp: formData.ppjk_npwp || undefined,
        ppjk_name: formData.ppjk_name || undefined,
        customs_office_id: formData.customs_office_id || undefined,
        customs_office_code: formData.customs_office_code || undefined,
        customs_office_name: formData.customs_office_name || undefined,
        loading_port_id: formData.loading_port_id || undefined,
        loading_port_code: formData.loading_port_code || undefined,
        loading_port_name: formData.loading_port_name || undefined,
        destination_port_id: formData.destination_port_id || undefined,
        destination_port_code: formData.destination_port_code || undefined,
        destination_port_name: formData.destination_port_name || undefined,
        destination_country: formData.destination_country || undefined,
        incoterm_id: formData.incoterm_id || undefined,
        incoterm_code: formData.incoterm_code || undefined,
        currency_id: formData.currency_id || undefined,
        currency_code: formData.currency_code || undefined,
        exchange_rate: formData.exchange_rate || undefined,
        transport_mode: formData.transport_mode || undefined,
        vessel_name: formData.vessel_name || undefined,
        voyage_number: formData.voyage_number || undefined,
        notes: formData.notes || undefined,
      });

      if (!createResult.success || !createResult.peb_id) {
        toast.error(createResult.errors.join(', ') || 'Failed to create PEB');
        setValidationErrors(createResult.errors);
        return;
      }

      // Step 2: Submit the PEB (generates XML, locks document, sets status)
      const submitResult = await submit_peb(createResult.peb_id);

      if (submitResult.success) {
        // Show detailed success message
        const submitTime = new Date().toLocaleString('id-ID', { 
          timeZone: 'Asia/Jakarta',
          dateStyle: 'long',
          timeStyle: 'medium'
        });
        
        toast.success(
          `PEB berhasil disubmit!
           
           📄 Status: ${submitResult.status}
           🔐 XML Hash: ${submitResult.xml_hash?.substring(0, 16)}...
           🕐 Submit Time: ${submitTime}
           🔒 Document locked & ready for CEISA`,
          { duration: 8000 }
        );
        navigate('/peb');
      } else {
        // Show detailed error message (CEISA raw error if available)
        const errorMessages = submitResult.errors || [];
        
        errorMessages.forEach((err, idx) => {
          toast.error(
            `[${idx + 1}/${errorMessages.length}] ${err}`,
            { duration: 10000 }
          );
        });
        
        if (errorMessages.length === 0) {
          toast.error('Failed to submit PEB - unknown error');
        }
        
        setValidationErrors(errorMessages);
        // Still navigate to the PEB detail page since draft was created
        navigate(`/peb/${createResult.peb_id}`);
      }
    } catch (error) {
      console.error('Submit PEB error:', error);
      toast.error('Failed to submit PEB');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewXML = () => {
    setXmlPreviewOpen(true);
  };

  const pebDocumentForXML: PEBDocument = {
    id: '',
    document_number: `PEB-${new Date().getFullYear()}-DRAFT`,
    registration_number: null,
    registration_date: null,
    npe_number: null,
    npe_date: null,
    status: 'DRAFT',
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
    items: items as PEBItem[],
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/peb')}>
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">
                {isEditMode ? 'Edit PEB' : 'Create New PEB'}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Export Declaration (Pemberitahuan Ekspor Barang)
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
            <PEBFormStepper
              steps={PEB_FORM_STEPS}
              currentStep={currentStep}
              onStepClick={(step) => {
                if (step <= currentStep) setCurrentStep(step);
              }}
            />
          </CardContent>
        </Card>

        {/* Form Content */}
        <Card>
          <CardContent className="p-6">
            {/* Step 1: Document Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {loadingMasterData && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading master data...</span>
                  </div>
                )}

                {!loadingMasterData && (
                  <>
                    <h2 className="text-sm font-semibold border-b pb-2">Exporter Information</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Exporter <span className="text-red-500">*</span></Label>
                        <Select value={formData.exporter_id} onValueChange={(v) => handleChange('exporter_id', v)}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select exporter" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.length === 0 && (
                              <SelectItem value="_empty" disabled>No exporters found</SelectItem>
                            )}
                            {companies.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">NPWP</Label>
                        <Input value={formData.exporter_npwp} disabled className="h-8 text-sm bg-muted/30" />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-xs">Address</Label>
                        <Textarea value={formData.exporter_address} disabled className="text-sm bg-muted/30 min-h-[60px]" />
                      </div>
                    </div>

                    <h2 className="text-sm font-semibold border-b pb-2 pt-4">Buyer Information</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Buyer <span className="text-red-500">*</span></Label>
                        <Select value={formData.buyer_id} onValueChange={(v) => handleChange('buyer_id', v)}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select buyer" />
                          </SelectTrigger>
                          <SelectContent>
                            {buyers.length === 0 && (
                              <SelectItem value="_empty" disabled>No buyers found</SelectItem>
                            )}
                            {buyers.map((b) => (
                              <SelectItem key={b.id} value={b.id}>{b.code} - {b.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Country</Label>
                        <Input value={formData.buyer_country} disabled className="h-8 text-sm bg-muted/30" />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-xs">Address</Label>
                        <Textarea value={formData.buyer_address} disabled className="text-sm bg-muted/30 min-h-[60px]" />
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
                            {ppjkList.length === 0 && (
                              <SelectItem value="_empty" disabled>No PPJK found</SelectItem>
                            )}
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
                  </>
                )}
              </div>
            )}

            {/* Step 2: Transport */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-sm font-semibold border-b pb-2">Customs & Ports</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Customs Office <span className="text-red-500">*</span></Label>
                    <Select value={formData.customs_office_id} onValueChange={(v) => {
                      const office = customsOffices.find(o => o.id === v);
                      handleChange('customs_office_id', v);
                      if (office) {
                        handleChange('customs_office_code', office.code);
                        handleChange('customs_office_name', office.name);
                      }
                    }}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select customs office" />
                      </SelectTrigger>
                      <SelectContent>
                        {customsOffices.map((office) => (
                          <SelectItem key={office.id} value={office.id}>
                            {office.code} - {office.name} ({office.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Transport Mode <span className="text-red-500">*</span></Label>
                    <Select value={formData.transport_mode} onValueChange={(v) => {
                      handleChange('transport_mode', v);
                      // Clear vessel/voyage if not required
                      const mode = transportModes.find(m => m.code === v);
                      if (mode && !mode.requires_vessel) {
                        handleChange('vessel_name', '');
                        handleChange('voyage_number', '');
                      }
                      // Validate existing incoterm selection against new transport mode
                      const selectedIncoterm = incoterms.find(i => i.id === formData.incoterm_id);
                      if (selectedIncoterm && !isValidIncotermForTransport(v, selectedIncoterm.code)) {
                        // Clear invalid incoterm
                        handleChange('incoterm_id', '');
                        handleChange('incoterm_code', '');
                        toast.warning(`Incoterm ${selectedIncoterm.code} tidak valid untuk ${mode?.name || v}. Silakan pilih incoterm lain.`);
                      }
                    }}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select transport mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {transportModes.map((m) => (
                          <SelectItem key={m.id} value={m.code}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Loading Port <span className="text-red-500">*</span></Label>
                    <Select value={formData.loading_port_id} onValueChange={(v) => {
                      const port = ports.find(p => p.id === v);
                      handleChange('loading_port_id', v);
                      if (port) {
                        handleChange('loading_port_code', port.code);
                        handleChange('loading_port_name', port.name);
                      }
                    }}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select loading port" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Filter Indonesian ports based on transport mode and customs office */}
                        {ports
                          .filter(p => {
                            // Only Indonesian ports for loading
                            if (!p.country_code?.startsWith('ID') && p.country_code !== 'ID') return false;
                            // Filter by transport mode
                            const selectedMode = formData.transport_mode;
                            if (selectedMode === 'SEA' && p.type !== 'SEA') return false;
                            if (selectedMode === 'AIR' && p.type !== 'AIR') return false;
                            return true;
                          })
                          .map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.code} - {p.name} ({p.type})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Destination Port <span className="text-red-500">*</span></Label>
                    <Select value={formData.destination_port_id} onValueChange={(v) => {
                      const port = ports.find(p => p.id === v);
                      handleChange('destination_port_id', v);
                      if (port) {
                        handleChange('destination_port_code', port.code);
                        handleChange('destination_port_name', port.name);
                        // Auto-set destination country
                        if (port.country) {
                          handleChange('destination_country', port.country.name);
                        }
                      }
                    }}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Filter foreign ports based on transport mode */}
                        {ports
                          .filter(p => {
                            // Only non-Indonesian ports for destination
                            if (p.country_code?.startsWith('ID') || p.country_code === 'ID') return false;
                            // Filter by transport mode
                            const selectedMode = formData.transport_mode;
                            if (selectedMode === 'SEA' && p.type !== 'SEA') return false;
                            if (selectedMode === 'AIR' && p.type !== 'AIR') return false;
                            return true;
                          })
                          .map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.code} - {p.name} ({p.country?.name || p.country_code})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Destination Country</Label>
                    <Input
                      value={formData.destination_country}
                      disabled
                      className="h-8 text-sm bg-muted/30"
                      placeholder="Auto-filled from destination port"
                    />
                  </div>
                </div>

                <h2 className="text-sm font-semibold border-b pb-2 pt-4">Transport Details</h2>
                <div className="grid grid-cols-3 gap-4">
                  {(() => {
                    const selectedMode = transportModes.find(m => m.code === formData.transport_mode);
                    const requiresVessel = selectedMode?.requires_vessel ?? (formData.transport_mode === 'SEA' || formData.transport_mode === 'MULTI');
                    const requiresVoyage = selectedMode?.requires_voyage ?? (formData.transport_mode === 'SEA' || formData.transport_mode === 'MULTI');
                    return (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs">
                            Vessel Name {requiresVessel && <span className="text-red-500">*</span>}
                          </Label>
                          <Input
                            value={formData.vessel_name}
                            onChange={(e) => handleChange('vessel_name', e.target.value)}
                            className="h-8 text-sm"
                            placeholder={requiresVessel ? "Required - e.g. MV Pacific Star" : "Not required"}
                            disabled={!requiresVessel}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">
                            Voyage Number {requiresVoyage && <span className="text-red-500">*</span>}
                          </Label>
                          <Input
                            value={formData.voyage_number}
                            onChange={(e) => handleChange('voyage_number', e.target.value)}
                            className="h-8 text-sm"
                            placeholder={requiresVoyage ? "Required - e.g. V123" : "Not required"}
                            disabled={!requiresVoyage}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Transport Mode Info</Label>
                          <div className="h-8 flex items-center text-xs text-muted-foreground">
                            {selectedMode ? (
                              <span className="bg-muted px-2 py-1 rounded">
                                {selectedMode.name} ({selectedMode.code})
                              </span>
                            ) : (
                              'Select transport mode above'
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <h2 className="text-sm font-semibold border-b pb-2 pt-4">Trade Terms</h2>
                {(() => {
                  const selectedIncoterm = incoterms.find(i => i.id === formData.incoterm_id);
                  const requiresFreightInsurance = selectedIncoterm?.code === 'CIF' || selectedIncoterm?.code === 'CIP';
                  const allowedIncotermCodes = getAllowedIncoterms(formData.transport_mode || '');
                  const incotermError = selectedIncoterm && formData.transport_mode 
                    ? getIncotermTransportError(formData.transport_mode, selectedIncoterm.code) 
                    : null;
                  
                  return (
                    <>
                      {/* Incoterm-Transport validation error */}
                      {incotermError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                          <div className="text-xs text-red-700">
                            <p className="font-medium">Kombinasi Tidak Valid</p>
                            <p>{incotermError}</p>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Incoterm <span className="text-red-500">*</span></Label>
                          <Select 
                            value={formData.incoterm_id} 
                            onValueChange={(v) => {
                              const incoterm = incoterms.find(i => i.id === v);
                              if (incoterm && formData.transport_mode) {
                                // Validate before setting
                                if (!isValidIncotermForTransport(formData.transport_mode, incoterm.code)) {
                                  toast.error(getIncotermTransportError(formData.transport_mode, incoterm.code));
                                  return;
                                }
                              }
                              handleChange('incoterm_id', v);
                              if (incoterm) {
                                handleChange('incoterm_code', incoterm.code);
                              }
                            }}
                          >
                            <SelectTrigger className={`h-8 text-sm ${incotermError ? 'border-red-500' : ''}`}>
                              <SelectValue placeholder="Select incoterm" />
                            </SelectTrigger>
                            <SelectContent>
                              {incoterms.map((i) => {
                                const isAllowed = !formData.transport_mode || allowedIncotermCodes.includes(i.code);
                                const isSeaOnly = isSeaOnlyIncoterm(i.code);
                                return (
                                  <SelectItem 
                                    key={i.id} 
                                    value={i.id}
                                    disabled={!isAllowed}
                                    className={!isAllowed ? 'opacity-50' : ''}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span>{i.code} - {i.name}</span>
                                      {isSeaOnly && (
                                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">SEA ONLY</span>
                                      )}
                                      {!isAllowed && (
                                        <span className="text-[10px] text-red-500">(tidak valid)</span>
                                      )}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          {formData.transport_mode && !formData.transport_mode.includes('SEA') && (
                            <p className="text-[10px] text-muted-foreground">
                              FOB, CFR, CIF, FAS hanya untuk transport laut (SEA)
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Currency <span className="text-red-500">*</span></Label>
                          <Select value={formData.currency_id} onValueChange={(v) => {
                            const currency = currencies.find(c => c.id === v);
                            handleChange('currency_id', v);
                            if (currency) {
                              handleChange('currency_code', currency.code);
                              if (currency.exchange_rate) {
                                handleChange('exchange_rate', currency.exchange_rate);
                              }
                            }
                          }}>
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                              {currencies.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.code} - {c.name} {c.exchange_rate ? `(Rp ${c.exchange_rate.toLocaleString()})` : ''}
                                </SelectItem>
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
                      {requiresFreightInsurance && (
                        <div className="grid grid-cols-2 gap-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
                          <div className="col-span-2">
                            <p className="text-xs text-amber-700 mb-2">
                              <AlertCircle className="inline h-3 w-3 mr-1" />
                              {selectedIncoterm?.code} incoterm requires Freight and Insurance values
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">
                              Freight Value <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              type="number"
                              value={formData.freight_value}
                              onChange={(e) => handleChange('freight_value', parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm"
                              placeholder="Required for CIF/CIP"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">
                              Insurance Value <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              type="number"
                              value={formData.insurance_value}
                              onChange={(e) => handleChange('insurance_value', parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm"
                              placeholder="Required for CIF/CIP"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Step 3: Goods */}
            {currentStep === 3 && (
              <PEBItemsTable
                items={items}
                onItemsChange={setItems}
                exchangeRate={formData.exchange_rate}
              />
            )}

            {/* Step 4: Documents */}
            {currentStep === 4 && (
              <PEBAttachments
                attachments={attachments}
                onAttachmentsChange={setAttachments}
                transportMode={formData.transport_mode}
              />
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <PEBReviewSummary
                formData={formData}
                items={items}
                attachments={attachments}
                validationErrors={validationErrors}
              />
            )}
          </CardContent>
        </Card>

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
                {isSaving ? 'Submitting...' : 'Submit PEB'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* XML Preview Modal */}
      <PEBXMLPreview
        peb={pebDocumentForXML}
        isOpen={xmlPreviewOpen}
        onClose={() => setXmlPreviewOpen(false)}
      />
    </AppLayout>
  );
}
