import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PEBDocument, PEBItem, PEB_DOCUMENT_TYPES } from '@/types/peb';
import { PEBStatusBadge } from './PEBStatusBadge';
import { FileText, AlertCircle, CheckCircle, ShieldCheck, XCircle, AlertTriangle } from 'lucide-react';
import { isValidIncotermForTransport } from '@/lib/validation/incoterm-transport-rules';

interface AttachmentWithFile {
  document_type: string;
  file: File;
}

interface PEBReviewSummaryProps {
  formData: {
    exporter_name: string;
    exporter_npwp: string;
    exporter_address: string;
    buyer_name: string;
    buyer_address: string;
    buyer_country: string;
    ppjk_name: string;
    ppjk_npwp: string;
    customs_office_name: string;
    customs_office_code: string;
    loading_port_name: string;
    loading_port_code: string;
    destination_port_name: string;
    destination_port_code: string;
    destination_country: string;
    incoterm_code: string;
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
  };
  items: Partial<PEBItem>[];
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

export function PEBReviewSummary({ formData, items, attachments, validationErrors = [] }: PEBReviewSummaryProps) {
  const getTransportModeName = (code: string): string => {
    return TRANSPORT_MODE_LABELS[code] || code;
  };

  const getDocTypeName = (code: string): string => {
    return PEB_DOCUMENT_TYPES.find(t => t.value === code)?.label || code;
  };

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
    exporter: !!formData.exporter_name || !!formData.exporter_npwp,
    buyer: !!formData.buyer_name,
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
              {validationChecks.exporter ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-600" />
              )}
              <span className={validationChecks.exporter ? 'text-emerald-700' : 'text-red-700'}>
                Exporter NPWP
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {validationChecks.buyer ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-600" />
              )}
              <span className={validationChecks.buyer ? 'text-emerald-700' : 'text-red-700'}>
                Buyer
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
        {/* Exporter Info */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Exporter</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 text-sm space-y-2">
            <div>
              <span className="text-muted-foreground text-xs">Name</span>
              <p className="font-medium">{formData.exporter_name || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">NPWP</span>
              <p className="font-mono">{formData.exporter_npwp || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Address</span>
              <p>{formData.exporter_address || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Buyer Info */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Buyer</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 text-sm space-y-2">
            <div>
              <span className="text-muted-foreground text-xs">Name</span>
              <p className="font-medium">{formData.buyer_name || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Country</span>
              <p>{formData.buyer_country || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Address</span>
              <p>{formData.buyer_address || '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transport Info */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm">Transport & Destination</CardTitle>
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
              <p className="text-xs text-muted-foreground font-mono">{formData.loading_port_code}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Destination</span>
              <p className="font-medium">{formData.destination_port_name || '-'}</p>
              <p className="text-xs text-muted-foreground">{formData.destination_country}</p>
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
              <span className="text-muted-foreground text-xs">Incoterm</span>
              <p className="font-medium">{formData.incoterm_code || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Currency</span>
              <p className="font-medium">{formData.currency_code || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Exchange Rate</span>
              <p className="font-mono">{formData.exchange_rate?.toLocaleString() || '-'}</p>
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
                  <th className="p-2 text-right font-medium text-muted-foreground">FOB Value</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="p-2">{item.item_number}</td>
                    <td className="p-2 font-mono">{item.hs_code}</td>
                    <td className="p-2 max-w-[200px] truncate">{item.product_description}</td>
                    <td className="p-2 text-right font-mono">{item.quantity} {item.quantity_unit}</td>
                    <td className="p-2 text-right font-mono">{item.fob_value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm">Summary Totals</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Total Packages</span>
              <p className="font-mono font-medium">{formData.total_packages || 0} {formData.package_unit}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Gross Weight</span>
              <p className="font-mono font-medium">{formData.gross_weight?.toLocaleString() || 0} kg</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Net Weight</span>
              <p className="font-mono font-medium">{formData.net_weight?.toLocaleString() || 0} kg</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Total FOB</span>
              <p className="font-mono font-bold text-primary">
                {formData.currency_code} {formData.total_fob_value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                IDR {formData.total_fob_idr?.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            Supporting Documents ({attachments.length})
            {missingDocs.length > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                {missingDocs.length} Missing
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {missingDocs.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <div className="flex items-start gap-2 text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium mb-1">Missing Required Documents:</p>
                  <ul className="list-disc list-inside">
                    {missingDocs.map((doc, i) => (
                      <li key={i}>{doc}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
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
