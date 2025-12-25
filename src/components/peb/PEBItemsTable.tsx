import { useState } from 'react';
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
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { PEBItem, calculateFOB } from '@/types/peb';
import { cn } from '@/lib/utils';

interface PEBItemsTableProps {
  items: Partial<PEBItem>[];
  onItemsChange: (items: Partial<PEBItem>[]) => void;
  exchangeRate: number;
  isReadOnly?: boolean;
}

const mockHSCodes = [
  { id: '1', code: '8471300000', description: 'Laptop Computers', unit: 'UNIT' },
  { id: '2', code: '8517120000', description: 'Mobile Phones', unit: 'UNIT' },
  { id: '3', code: '6110110000', description: 'Wool Sweaters', unit: 'PCS' },
];

const mockPackaging = [
  { code: 'CTN', name: 'Carton' },
  { code: 'PLT', name: 'Pallet' },
  { code: 'BOX', name: 'Box' },
  { code: 'BAG', name: 'Bag' },
];

const emptyItem: Partial<PEBItem> = {
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
  fob_value: 0,
  fob_idr: 0,
  country_of_origin: 'ID',
  packaging_code: 'CTN',
  package_count: 0,
  notes: '',
};

export function PEBItemsTable({ items, onItemsChange, exchangeRate, isReadOnly }: PEBItemsTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentItem, setCurrentItem] = useState<Partial<PEBItem>>(emptyItem);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleChange = (field: keyof PEBItem, value: unknown) => {
    let updatedItem = { ...currentItem, [field]: value };
    
    // Auto-calculate values
    if (field === 'hs_code_id') {
      const hsCode = mockHSCodes.find(h => h.id === value);
      if (hsCode) {
        updatedItem.hs_code = hsCode.code;
        updatedItem.product_description = hsCode.description;
        updatedItem.quantity_unit = hsCode.unit;
      }
    }
    
    if (field === 'quantity' || field === 'unit_price') {
      const qty = field === 'quantity' ? Number(value) : (updatedItem.quantity || 0);
      const price = field === 'unit_price' ? Number(value) : (updatedItem.unit_price || 0);
      updatedItem.total_price = qty * price;
      updatedItem.fob_value = qty * price;
      updatedItem.fob_idr = qty * price * exchangeRate;
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
    if (!currentItem.quantity || currentItem.quantity <= 0) newErrors.quantity = 'Quantity must be > 0';
    if (!currentItem.unit_price || currentItem.unit_price <= 0) newErrors.unit_price = 'Unit price must be > 0';
    if (!currentItem.net_weight || currentItem.net_weight <= 0) newErrors.net_weight = 'Net weight is required';
    if (!currentItem.gross_weight || currentItem.gross_weight <= 0) newErrors.gross_weight = 'Gross weight is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveItem = () => {
    if (!validate()) return;
    
    if (editingIndex !== null) {
      const newItems = [...items];
      newItems[editingIndex] = currentItem;
      onItemsChange(newItems);
    } else {
      onItemsChange([...items, currentItem]);
    }
    setDialogOpen(false);
  };

  const totalFOB = items.reduce((sum, item) => sum + (item.fob_value || 0), 0);
  const totalFOBIDR = items.reduce((sum, item) => sum + (item.fob_idr || 0), 0);

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
                  <th className="p-2 font-medium text-muted-foreground text-xs text-right">Unit Price</th>
                  <th className="p-2 font-medium text-muted-foreground text-xs text-right">FOB Value</th>
                  <th className="p-2 font-medium text-muted-foreground text-xs text-right">Weight (Net/Gross)</th>
                  {!isReadOnly && <th className="p-2 px-3 font-medium text-muted-foreground text-xs text-center w-20">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="p-2 px-3 text-muted-foreground">{item.item_number}</td>
                    <td className="p-2 font-mono text-xs">{item.hs_code}</td>
                    <td className="p-2 max-w-[200px] truncate">{item.product_description}</td>
                    <td className="p-2 text-right font-mono">
                      {item.quantity?.toLocaleString()} {item.quantity_unit}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {item.unit_price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 text-right font-mono font-medium">
                      {item.fob_value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 text-right font-mono text-xs text-muted-foreground">
                      {item.net_weight?.toLocaleString()} / {item.gross_weight?.toLocaleString()} kg
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
                  <td colSpan={5} className="p-2 px-3 text-right font-medium text-sm">Total FOB Value:</td>
                  <td className="p-2 text-right font-mono font-bold">
                    {totalFOB.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={isReadOnly ? 1 : 2} className="p-2 text-right font-mono text-xs text-muted-foreground">
                    IDR {totalFOBIDR.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </td>
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
                    <SelectValue placeholder="Select HS Code" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockHSCodes.map((hs) => (
                      <SelectItem key={hs.id} value={hs.id}>
                        <span className="font-mono">{hs.code}</span> - {hs.description}
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
                  placeholder="e.g. ID"
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
                <Label className="text-xs">Unit</Label>
                <Input
                  value={currentItem.quantity_unit || ''}
                  onChange={(e) => handleChange('quantity_unit', e.target.value)}
                  className="h-8 text-sm"
                />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Packaging Type</Label>
                <Select value={currentItem.packaging_code || ''} onValueChange={(v) => handleChange('packaging_code', v)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select packaging" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockPackaging.map((pkg) => (
                      <SelectItem key={pkg.code} value={pkg.code}>{pkg.code} - {pkg.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Input
                  value={currentItem.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Calculated Values */}
            <div className="bg-muted/30 rounded-lg p-3 grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Total Price</span>
                <div className="font-mono font-medium">
                  {(currentItem.total_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">FOB Value</span>
                <div className="font-mono font-medium">
                  {(currentItem.fob_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">FOB Value (IDR)</span>
                <div className="font-mono font-medium">
                  {(currentItem.fob_idr || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
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
