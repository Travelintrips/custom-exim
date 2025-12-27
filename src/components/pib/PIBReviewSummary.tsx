import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PIBDocument, PIBItem, PIB_DOCUMENT_TYPES } from '@/types/pib';
import { PIBStatusBadge, PIBLaneBadge } from './PIBStatusBadge';
import { PIBTaxBreakdown } from './PIBTaxBreakdown';
import { FileText, AlertCircle, CheckCircle, ShieldCheck, XCircle, AlertTriangle } from 'lucide-react';
import { isValidIncotermForTransport } from '@/lib/validation/incoterm-transport-rules';

interface AttachmentWithFile {
  document_type: string;
  file: File;
}

interface PIBReviewSummaryProps {
  formData: {
    importer_name: string;
    importer_npwp: string;
    importer_address: string;
    importer_api: string;
    supplier_name: string;
    supplier_address: string;
    supplier_country: string;
    ppjk_name: string;
    ppjk_npwp: string;
    customs_office_name: string;
    customs_office_code: string;
    loading_port_name: string;
    loading_port_code: string;
    loading_country: string;
    discharge_port_name: string;
    discharge_port_code: string;
    incoterm_code: string;
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
  };
  items: Partial<PIBItem>[];
  attachments: AttachmentWithFile[];
  validationErrors?: string[];
}

// Transport mode labels mapping (codes from database)
const TRANSPORT_MODE_LABELS: Record<string, string> = {
  'SEA': 'Sea Freight',
  'AIR': 'Air Freight',
  'LAND': 'Land Transport',
  'RAIL': 'Rail Freight',
  'MULTI': 'Multimodal Transport',
};

export function PIBReviewSummary({ formData, items, attachments, validationErrors = [] }: PIBReviewSummaryProps) {
  const getTransportModeName = (code: string): string => {
    return TRANSPORT_MODE_LABELS[code] || code;
  };

  const getDocTypeName = (code: string): string => {
    return PIB_DOCUMENT_TYPES.find(t => t.value === code)?.label || code;
  };

  const hasAPI = !!formData.importer_api;

  // Check if required documents are uploaded
  const checkRequiredDocuments = () => {
    const uploadedTypes = new Set(attachments.map(att => att.document_type));
    const missingDocs: string[] = [];

    // Always required
    if (!uploadedTypes.has('INVOICE')) missingDocs.push('Commercial Invoice');
    if (!uploadedTypes.has('PACKING_LIST')) missingDocs.push('Packing List');

    // Transport-specific required
    if (formData.transport_mode === 'AIR' && !uploadedTypes.has('AWB')) {
      missingDocs.push('Air Waybill');
    } else if (formData.transport_mode === 'SEA' && !uploadedTypes.has('BL')) {
      missingDocs.push('Bill of Lading');
    }

    return missingDocs;
  };

  const missingDocs = checkRequiredDocuments();

  // Comprehensive validation checks
  const validationChecks = {
    importer: !!formData.importer_name || !!formData.importer_npwp,
    supplier: !!formData.supplier_name,
    incotermTransport: !formData.transport_mode || !formData.incoterm_code || 
      isValidIncotermForTransport(formData.transport_mode, formData.incoterm_code),
    hasGoods: items.length > 0,
    hasDocuments: missingDocs.length === 0,
    hasWeight: items.every(item => (item.net_weight || 0) > 0),
    validWeights: items.every(item => (item.gross_weight || 0) >= (item.net_weight || 0)),
  };

  const allValid = validationErrors.length === 0 && 
    Object.values(validationChecks).every(v => v) && 
    missingDocs.length === 0;

  return (
    <div className="space-y-4">
      {/* Comprehensive Validation Status */}
      <Card className={allValid ? 'border-emerald-300 bg-emerald-50/50' : 'border-red-300 bg-red-50/50'}>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            {allValid ? (
              <>
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <span className="text-emerald-700">Pre-Submit Validation: PASSED</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-700">Pre-Submit Validation: FAILED</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Validation Rules Checklist */}
            <div className="flex items-center gap-2">
              {validationChecks.importer ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-600" />
              )}
              <span className={validationChecks.importer ? 'text-emerald-700' : 'text-red-700'}>
                Importer NPWP
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {validationChecks.supplier ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-600" />
              )}
              <span className={validationChecks.supplier ? 'text-emerald-700' : 'text-red-700'}>
                Supplier
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {validationChecks.incotermTransport ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-600" />
              )}
              <span className={validationChecks.incotermTransport ? 'text-emerald-700' : 'text-red-700'}>
                Incoterm ↔ Transport
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {validationChecks.hasGoods ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-600" />
              )}
              <span className={validationChecks.hasGoods ? 'text-emerald-700' : 'text-red-700'}>
                Goods Items ({items.length})
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {validationChecks.hasDocuments ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-600" />
              )}
              <span className={validationChecks.hasDocuments ? 'text-emerald-700' : 'text-red-700'}>
                Supporting Documents
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {validationChecks.validWeights ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-600" />
              )}
              <span className={validationChecks.validWeights ? 'text-emerald-700' : 'text-red-700'}>
                Weight Validation (Gross ≥ Net)
              </span>
            </div>
          </div>
          
          {/* Error Details */}
          {validationErrors.length > 0 && (
            <div className="mt-3 pt-3 border-t border-red-200">
              <p className="text-xs font-medium text-red-700 mb-1.5 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                Validation Errors ({validationErrors.length}):
              </p>
              <ul className="text-xs text-red-600 space-y-0.5 ml-5 list-disc">
                {validationErrors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Missing Documents */}
          {missingDocs.length > 0 && (
            <div className="mt-3 pt-3 border-t border-red-200">
              <p className="text-xs font-medium text-red-700 mb-1.5 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Missing Required Documents:
              </p>
              <ul className="text-xs text-red-600 space-y-0.5 ml-5 list-disc">
                {missingDocs.map((doc, i) => (
                  <li key={i}>{doc}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Ready message */}
          {allValid && (
            <div className="mt-3 pt-3 border-t border-emerald-200">
              <p className="text-xs text-emerald-700 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span className="font-medium">Ready for CEISA submission. XML yang dikirim akan sesuai dengan data yang direview.</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {/* Importer Info */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Importer</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 text-sm space-y-2">
            <div>
              <span className="text-muted-foreground text-xs">Name</span>
              <p className="font-medium">{formData.importer_name || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">NPWP</span>
              <p className="font-mono">{formData.importer_npwp || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">API</span>
              <p className="font-mono">{formData.importer_api || <span className="text-amber-600">Not Available</span>}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Address</span>
              <p>{formData.importer_address || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Supplier Info */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Supplier</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 text-sm space-y-2">
            <div>
              <span className="text-muted-foreground text-xs">Name</span>
              <p className="font-medium">{formData.supplier_name || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Country</span>
              <p>{formData.supplier_country || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Address</span>
              <p>{formData.supplier_address || '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transport Info */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm">Transport & Shipping</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Customs Office</span>
              <p className="font-medium">{formData.customs_office_name || '-'}</p>
              <p className="text-xs text-muted-foreground font-mono">{formData.customs_office_code}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Loading Port</span>
              <p className="font-medium">{formData.loading_port_name || '-'}</p>
              <p className="text-xs text-muted-foreground">{formData.loading_country}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Discharge Port</span>
              <p className="font-medium">{formData.discharge_port_name || '-'}</p>
              <p className="text-xs text-muted-foreground font-mono">{formData.discharge_port_code}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Transport</span>
              <p className="font-medium">{getTransportModeName(formData.transport_mode)}</p>
              <p className="text-xs text-muted-foreground">{formData.vessel_name} / {formData.voyage_number}</p>
            </div>
          </div>
          <Separator className="my-3" />
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">B/L / AWB Number</span>
              <p className="font-mono">{formData.bl_awb_number || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">B/L / AWB Date</span>
              <p className="font-mono">{formData.bl_awb_date || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Incoterm</span>
              <p className="font-medium">{formData.incoterm_code || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">PPJK</span>
              <p className="font-medium">{formData.ppjk_name || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Summary */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm">Goods Declaration ({items.length} items)</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <div className="border rounded overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="p-2 text-left font-medium text-muted-foreground">#</th>
                  <th className="p-2 text-left font-medium text-muted-foreground">HS Code</th>
                  <th className="p-2 text-left font-medium text-muted-foreground">Description</th>
                  <th className="p-2 text-right font-medium text-muted-foreground">Qty</th>
                  <th className="p-2 text-right font-medium text-muted-foreground">CIF (IDR)</th>
                  <th className="p-2 text-right font-medium text-muted-foreground">Total Tax</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="p-2">{item.item_number}</td>
                    <td className="p-2 font-mono">{item.hs_code}</td>
                    <td className="p-2 max-w-[200px] truncate">{item.product_description}</td>
                    <td className="p-2 text-right font-mono">{item.quantity} {item.quantity_unit}</td>
                    <td className="p-2 text-right font-mono">{item.cif_idr?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="p-2 text-right font-mono font-medium">{item.total_tax?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tax Breakdown */}
      <PIBTaxBreakdown
        items={items}
        currencyCode={formData.currency_code}
        exchangeRate={formData.exchange_rate}
        fobValue={formData.fob_value}
        freightValue={formData.freight_value}
        insuranceValue={formData.insurance_value}
        hasAPI={hasAPI}
      />

      {/* Attachments */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm">Attachments ({attachments.length})</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents attached</p>
          ) : (
            <div className="space-y-2">
              {attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{att.file.name}</span>
                  <Badge variant="outline" className="text-xs">{getDocTypeName(att.document_type)}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {formData.notes && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Notes</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <p className="text-sm text-muted-foreground">{formData.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
