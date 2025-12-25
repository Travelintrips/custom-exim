import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PIBItem } from '@/types/pib';
import { Calculator, Receipt, DollarSign, Percent } from 'lucide-react';

interface PIBTaxBreakdownProps {
  items: Partial<PIBItem>[];
  currencyCode: string;
  exchangeRate: number;
  fobValue: number;
  freightValue: number;
  insuranceValue: number;
  hasAPI?: boolean;
}

export function PIBTaxBreakdown({
  items,
  currencyCode,
  exchangeRate,
  fobValue,
  freightValue,
  insuranceValue,
  hasAPI = true,
}: PIBTaxBreakdownProps) {
  // Calculate totals
  const totalCIF = fobValue + freightValue + insuranceValue;
  const totalCIFIDR = totalCIF * exchangeRate;
  
  const totalBM = items.reduce((sum, item) => sum + (item.bm_amount || 0), 0);
  const totalPPN = items.reduce((sum, item) => sum + (item.ppn_amount || 0), 0);
  const totalPPh = items.reduce((sum, item) => sum + (item.pph_amount || 0), 0);
  const totalTax = totalBM + totalPPN + totalPPh;
  
  const importValue = totalCIFIDR + totalBM;
  const totalPayable = totalCIFIDR + totalTax;

  const formatCurrency = (value: number, currency = 'IDR', decimals = 0): string => {
    return value.toLocaleString(undefined, { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Tax Calculation Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-4">
        {/* CIF Calculation */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            CIF Value Calculation
          </h4>
          <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">FOB Value</span>
              <span className="font-mono">{currencyCode} {formatCurrency(fobValue, currencyCode, 2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Freight</span>
              <span className="font-mono">+ {currencyCode} {formatCurrency(freightValue, currencyCode, 2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Insurance</span>
              <span className="font-mono">+ {currencyCode} {formatCurrency(insuranceValue, currencyCode, 2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>CIF Value</span>
              <span className="font-mono">{currencyCode} {formatCurrency(totalCIF, currencyCode, 2)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>× Exchange Rate ({formatCurrency(exchangeRate)})</span>
              <span className="font-mono">= IDR {formatCurrency(totalCIFIDR)}</span>
            </div>
          </div>
        </div>

        {/* Tax Summary */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Import Duties & Taxes
          </h4>
          <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Bea Masuk (BM)</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Based on HS Code</span>
              </div>
              <span className="font-mono">IDR {formatCurrency(totalBM)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Nilai Impor (CIF + BM)</span>
              <span className="font-mono">IDR {formatCurrency(importValue)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">PPN</span>
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">11%</span>
              </div>
              <span className="font-mono">IDR {formatCurrency(totalPPN)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">PPh Pasal 22</span>
                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                  {hasAPI ? '2.5% (API)' : '7.5% (Non-API)'}
                </span>
              </div>
              <span className="font-mono">IDR {formatCurrency(totalPPh)}</span>
            </div>
          </div>
        </div>

        {/* Total Summary */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total BM</span>
            <span className="font-mono">IDR {formatCurrency(totalBM)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total PPN</span>
            <span className="font-mono">IDR {formatCurrency(totalPPN)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total PPh</span>
            <span className="font-mono">IDR {formatCurrency(totalPPh)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total Pungutan</span>
            <span className="font-mono text-primary">IDR {formatCurrency(totalTax)}</span>
          </div>
        </div>

        {/* Grand Total */}
        <div className="bg-slate-900 text-white rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Total Payable</p>
              <p className="text-xs text-slate-400">(CIF + All Taxes)</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-mono">
                IDR {formatCurrency(totalPayable)}
              </p>
              <p className="text-xs text-slate-400 font-mono">
                ≈ {currencyCode} {formatCurrency(totalPayable / exchangeRate, currencyCode, 2)}
              </p>
            </div>
          </div>
        </div>

        {/* Per-Item Breakdown */}
        {items.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Per-Item Tax Breakdown
            </h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/30 border-b">
                  <tr>
                    <th className="p-2 text-left font-medium text-muted-foreground">#</th>
                    <th className="p-2 text-left font-medium text-muted-foreground">HS Code</th>
                    <th className="p-2 text-right font-medium text-muted-foreground">CIF (IDR)</th>
                    <th className="p-2 text-right font-medium text-muted-foreground">BM</th>
                    <th className="p-2 text-right font-medium text-muted-foreground">PPN</th>
                    <th className="p-2 text-right font-medium text-muted-foreground">PPh</th>
                    <th className="p-2 text-right font-medium text-muted-foreground">Total Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="p-2">{item.item_number}</td>
                      <td className="p-2 font-mono">{item.hs_code}</td>
                      <td className="p-2 text-right font-mono">{formatCurrency(item.cif_idr || 0)}</td>
                      <td className="p-2 text-right font-mono">{formatCurrency(item.bm_amount || 0)}</td>
                      <td className="p-2 text-right font-mono">{formatCurrency(item.ppn_amount || 0)}</td>
                      <td className="p-2 text-right font-mono">{formatCurrency(item.pph_amount || 0)}</td>
                      <td className="p-2 text-right font-mono font-medium">{formatCurrency(item.total_tax || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* API Warning */}
        {!hasAPI && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            <p className="font-medium">⚠️ No API Number</p>
            <p className="mt-1">
              PPh Pasal 22 rate is 7.5% because importer does not have API. 
              With API (Angka Pengenal Importir), the rate would be 2.5%.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
