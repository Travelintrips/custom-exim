import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, AlertCircle, Calculator } from 'lucide-react';
import { PIBItem, calculateItemTax } from '@/types/pib';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface PIBItemsTableProps {
  items: Partial<PIBItem>[];
  onItemsChange: (items: Partial<PIBItem>[]) => void;
  exchangeRate: number;
  freightPercentage: number;
  insurancePercentage: number;
  hasAPI: boolean;
  isReadOnly?: boolean;
}

interface HSCode {
  id: string;
  code: string;
  name: string | null;
  description: string;
  unit: string;
  bm_rate: number;
  ppn_rate: number;
  pph_rate: number;
}

const mockPackaging = [
  { code: 'CTN', name: 'Carton' },
  { code: 'PLT', name: 'Pallet' },
  { code: 'BOX', name: 'Box' },
  { code: 'BAG', name: 'Bag' },
];

const emptyItem: Partial<PIBItem> = {
  item_number: 1,
  hs_code_id: '',
  hs_code: '',
  product_description: '',
  quantity: 0,
  quantity_unit: 'UNIT',
  net_weight: 0,
  gross_weight: 0,
  unit_price: 0,
  total_price: 0,
  cif_value: 0,
  cif_idr: 0,
  bm_rate: 0,
  bm_amount: 0,
  ppn_rate: 11,
  ppn_amount: 0,
  pph_rate: 2.5,
  pph_amount: 0,
  total_tax: 0,
  country_of_origin: 'CN',
  packaging_code: 'CTN',
  package_count: 0,
  notes: '',
};

export function PIBItemsTable({ 
  items, 
  onItemsChange, 
  exchangeRate, 
  freightPercentage,
  insurancePercentage,
  hasAPI,
  isReadOnly 
}: PIBItemsTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentItem, setCurrentItem] = useState<Partial<PIBItem>>(emptyItem);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hsCodes, setHsCodes] = useState<HSCode[]>([]);
  const [loadingHSCodes, setLoadingHSCodes] = useState(false);

  // Fetch HS Codes from database
  useEffect(() => {
    fetchHSCodes();
  }, []);

  const fetchHSCodes = async () => {
    try {
      setLoadingHSCodes(true);
      const { data, error } = await supabase
        .from('hs_codes')
        .select('id, code, name, description, unit, bm_rate, ppn_rate, pph_rate')
        .eq('is_active', true)
        .order('code');

      if (error) throw error;
      setHsCodes((data || []) as HSCode[]);
    } catch (error) {
      console.error('Error fetching HS codes:', error);
      toast.error('Failed to load HS codes');
    } finally {
      setLoadingHSCodes(false);
    }
  };

  const openAddDialog = () => {
    setEditingIndex(null);
    setCurrentItem({ ...emptyItem, item_number: items.length + 1 });
    setErrors({});
    setDialogOpen(true);
  };

  const openEditDialog = (index: number) => {
    setEditingIndex(index);
    setCurrentItem({ ...items[index] });
    setErrors({});
    setDialogOpen(true);
  };

  const deleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index).map((item, i) => ({
      ...item,
      item_number: i + 1,
    }));
    onItemsChange(newItems);
  };

  const recalculateTax = (item: Partial<PIBItem>): Partial<PIBItem> => {
    const totalPrice = (item.quantity || 0) * (item.unit_price || 0);
    // CIF = FOB + Freight + Insurance (proportional based on item value)
    const freight = totalPrice * (freightPercentage / 100);
    const insurance = totalPrice * (insurancePercentage / 100);
    const cifValue = totalPrice + freight + insurance;
    const cifIDR = cifValue * exchangeRate;
    
    const tax = calculateItemTax(
      cifIDR,
      item.bm_rate || 0,
      item.ppn_rate || 11,
      item.pph_rate || 2.5,
      hasAPI
    );
    
    return {
      ...item,
      total_price: totalPrice,
      cif_value: cifValue,
      cif_idr: cifIDR,
      bm_amount: tax.bmAmount,
      ppn_amount: tax.ppnAmount,
      pph_amount: tax.pphAmount,
      total_tax: tax.totalTax,
    };
  };

  const handleChange = (field: keyof PIBItem, value: unknown) => {
    let updatedItem = { ...currentItem, [field]: value };
    
    // Auto-fill from HS Code database
    if (field === 'hs_code_id') {
      const hsCode = hsCodes.find(h => h.id === value);
      if (hsCode) {
        updatedItem.hs_code = hsCode.code;
        updatedItem.product_description = hsCode.name || hsCode.description;
        updatedItem.quantity_unit = hsCode.unit;
        updatedItem.bm_rate = hsCode.bm_rate;
        updatedItem.ppn_rate = hsCode.ppn_rate;
        updatedItem.pph_rate = hsCode.pph_rate;
      }
    }
    
    // Recalculate when relevant fields change
    if (['quantity', 'unit_price', 'bm_rate', 'ppn_rate', 'pph_rate'].includes(field)) {
      updatedItem = recalculateTax(updatedItem);
    }
    
    setCurrentItem(updatedItem);
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!currentItem.hs_code) newErrors.hs_code = 'HS Code is required';
    if (!currentItem.product_description) newErrors.product_description = 'Description is required';
    if (!currentItem.quantity || currentItem.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';
    if (!currentItem.quantity_unit) {
      newErrors.quantity_unit = 'Unit is required. HS Code must have a valid unit.';
    }
    if (!currentItem.unit_price || currentItem.unit_price <= 0) newErrors.unit_price = 'Unit price must be greater than 0';
    
    // Weight validation
    if (!currentItem.net_weight || currentItem.net_weight <= 0) {
      newErrors.net_weight = 'Net weight harus lebih dari 0';
    }
    if (!currentItem.gross_weight || currentItem.gross_weight <= 0) {
      newErrors.gross_weight = 'Gross weight harus lebih dari 0';
    }
    // Gross weight must be >= Net weight
    if (currentItem.gross_weight && currentItem.net_weight && currentItem.gross_weight < currentItem.net_weight) {
      newErrors.gross_weight = `Gross weight (${currentItem.gross_weight}) tidak boleh kurang dari Net weight (${currentItem.net_weight})`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveItem = () => {
    if (!validate()) return;
    
    const finalItem = recalculateTax(currentItem);
    
    if (editingIndex !== null) {
      const newItems = [...items];
      newItems[editingIndex] = finalItem;
      onItemsChange(newItems);
    } else {
      onItemsChange([...items, finalItem]);
    }
    setDialogOpen(false);
  };

  const totalCIF = items.reduce((sum, item) => sum + (item.cif_value || 0), 0);
  const totalCIFIDR = items.reduce((sum, item) => sum + (item.cif_idr || 0), 0);
  const totalTax = items.reduce((sum, item) => sum + (item.total_tax || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Goods Declaration</h3>
        {!isReadOnly && (
          <Button size="sm" onClick={openAddDialog} className="gap-1.5">
            <Plus size={14} />
            Add Item
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <p className="text-sm">No items added yet</p>
          {!isReadOnly && (
            <Button variant="link" onClick={openAddDialog} className="mt-2">
              Add your first item
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b">
                <tr className="text-left">
                  <th className="p-2 px-3 font-medium text-muted-foreground text-xs w-12">#</th>
                  <th className="p-2 font-medium text-muted-foreground text-xs">HS Code</th>
                  <th className="p-2 font-medium text-muted-foreground text-xs">Description</th>
                  <th className="p-2 font-medium text-muted-foreground text-xs text-right">Qty</th>
                  <th className="p-2 font-medium text-muted-foreground text-xs text-right">CIF Value</th>
                  <th className="p-2 font-medium text-muted-foreground text-xs text-right">BM</th>
                  <th className="p-2 font-medium text-muted-foreground text-xs text-right">PPN</th>
                  <th className="p-2 font-medium text-muted-foreground text-xs text-right">PPh</th>
                  <th className="p-2 font-medium text-muted-foreground text-xs text-right">Total Tax</th>
                  {!isReadOnly && <th className="p-2 px-3 font-medium text-muted-foreground text-xs text-center w-20">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="p-2 px-3 text-muted-foreground">{item.item_number}</td>
                    <td className="p-2 font-mono text-xs">{item.hs_code}</td>
                    <td className="p-2 max-w-[150px] truncate">{item.product_description}</td>
                    <td className="p-2 text-right font-mono">
                      {item.quantity?.toLocaleString()} {item.quantity_unit}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {item.cif_value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 text-right font-mono text-xs">
                      <div>{item.bm_amount?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                      <div className="text-muted-foreground">({item.bm_rate}%)</div>
                    </td>
                    <td className="p-2 text-right font-mono text-xs">
                      <div>{item.ppn_amount?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                      <div className="text-muted-foreground">({item.ppn_rate}%)</div>
                    </td>
                    <td className="p-2 text-right font-mono text-xs">
                      <div>{item.pph_amount?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                      <div className="text-muted-foreground">({item.pph_rate}%)</div>
                    </td>
                    <td className="p-2 text-right font-mono font-medium">
                      {item.total_tax?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    {!isReadOnly && (
                      <td className="p-2 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(index)}>
                            <Pencil size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteItem(index)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/20 border-t">
                <tr>
                  <td colSpan={4} className="p-2 px-3 text-right font-medium text-sm">Totals:</td>
                  <td className="p-2 text-right font-mono font-bold">
                    {totalCIF.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={3} className="p-2 text-right font-mono text-xs text-muted-foreground">
                    IDR {totalCIFIDR.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-primary">
                    {totalTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  {!isReadOnly && <td></td>}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Item Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingIndex !== null ? 'Edit Item' : 'Add Item'} #{currentItem.item_number}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">HS Code <span className="text-red-500">*</span></Label>
                <Select value={currentItem.hs_code_id || ''} onValueChange={(v) => handleChange('hs_code_id', v)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder={loadingHSCodes ? "Loading..." : "Select HS Code"} />
                  </SelectTrigger>
                  <SelectContent>
                    {hsCodes.map((hs) => (
                      <SelectItem key={hs.id} value={hs.id}>
                        <span className="font-mono">{hs.code}</span> - {hs.name || hs.description}
                        <span className="ml-2 text-xs text-muted-foreground">(BM: {hs.bm_rate}%)</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.hs_code && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.hs_code}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Country of Origin</Label>
                <Input
                  value={currentItem.country_of_origin || ''}
                  onChange={(e) => handleChange('country_of_origin', e.target.value)}
                  className="h-8 text-sm"
                  placeholder="e.g. CN"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Product Description <span className="text-red-500">*</span></Label>
              <Textarea
                value={currentItem.product_description || ''}
                onChange={(e) => handleChange('product_description', e.target.value)}
                className="text-sm min-h-[60px]"
              />
              {errors.product_description && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.product_description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Quantity <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  step="0.01"
                  value={currentItem.quantity || ''}
                  onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm"
                />
                {errors.quantity && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.quantity}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Unit <span className="text-red-500">*</span></Label>
                <Input
                  value={currentItem.quantity_unit || ''}
                  disabled
                  className="h-8 text-sm bg-muted/30"
                  placeholder="Auto-filled from HS Code"
                />
                {!currentItem.quantity_unit && currentItem.hs_code_id && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Warning: No unit in HS Code
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Unit Price (FOB) <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  step="0.01"
                  value={currentItem.unit_price || ''}
                  onChange={(e) => handleChange('unit_price', parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm"
                />
                {errors.unit_price && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.unit_price}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Net Weight (kg) <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  step="0.01"
                  value={currentItem.net_weight || ''}
                  onChange={(e) => handleChange('net_weight', parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm"
                />
                {errors.net_weight && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.net_weight}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Gross Weight (kg) <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  step="0.01"
                  value={currentItem.gross_weight || ''}
                  onChange={(e) => handleChange('gross_weight', parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm"
                />
                {errors.gross_weight && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.gross_weight}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Package Count</Label>
                <Input
                  type="number"
                  value={currentItem.package_count || ''}
                  onChange={(e) => handleChange('package_count', parseInt(e.target.value) || 0)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Tax Rates */}
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium">Tax Rates (from HS Code)</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="space-y-1.5">
                  <Label className="text-xs">BM Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={currentItem.bm_rate || ''}
                    onChange={(e) => handleChange('bm_rate', parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">PPN Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={currentItem.ppn_rate || ''}
                    onChange={(e) => handleChange('ppn_rate', parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">PPh Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={currentItem.pph_rate || ''}
                    onChange={(e) => handleChange('pph_rate', parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Calculated Values */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">CIF Value</span>
                  <div className="font-mono font-medium">
                    {(currentItem.cif_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">BM Amount</span>
                  <div className="font-mono font-medium">
                    IDR {(currentItem.bm_amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">PPN + PPh</span>
                  <div className="font-mono font-medium">
                    IDR {((currentItem.ppn_amount || 0) + (currentItem.pph_amount || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Total Tax</span>
                  <div className="font-mono font-bold text-primary">
                    IDR {(currentItem.total_tax || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveItem}>
              {editingIndex !== null ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
