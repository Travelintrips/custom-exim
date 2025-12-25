import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PIBDocument, PIBItem, PIB_DOCUMENT_TYPES, TRANSPORT_MODES } from '@/types/pib';
import { PIBStatusBadge, PIBLaneBadge } from './PIBStatusBadge';
import { PIBTaxBreakdown } from './PIBTaxBreakdown';
import { FileText, AlertCircle, CheckCircle } from 'lucide-react';

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

export function PIBReviewSummary({ formData, items, attachments, validationErrors = [] }: PIBReviewSummaryProps) {
  const getTransportModeName = (code: string): string => {
    return TRANSPORT_MODES.find(t => t.value === code)?.label || code;
  };

  const getDocTypeName = (code: string): string => {
    return PIB_DOCUMENT_TYPES.find(t => t.value === code)?.label || code;
  };

  const hasAPI = !!formData.importer_api;

  return (
    <div className="space-y-4">
      {/* Validation Status */}
      {validationErrors.length > 0 ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium text-sm">Validation Errors ({validationErrors.length})</span>
          </div>
          <ul className="text-xs text-red-600 space-y-1 ml-6 list-disc">
            {validationErrors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium text-sm">Document is valid and ready for submission</span>
          </div>
        </div>
      )}

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
