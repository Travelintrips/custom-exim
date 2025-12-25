import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PEBDocument, PEBItem, PEB_DOCUMENT_TYPES, TRANSPORT_MODES } from '@/types/peb';
import { PEBStatusBadge } from './PEBStatusBadge';
import { FileText, AlertCircle, CheckCircle } from 'lucide-react';

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

export function PEBReviewSummary({ formData, items, attachments, validationErrors = [] }: PEBReviewSummaryProps) {
  const getTransportModeName = (code: string): string => {
    return TRANSPORT_MODES.find(t => t.value === code)?.label || code;
  };

  const getDocTypeName = (code: string): string => {
    return PEB_DOCUMENT_TYPES.find(t => t.value === code)?.label || code;
  };

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
