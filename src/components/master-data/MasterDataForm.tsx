import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { MasterDataType, masterDataConfig, validateHSCode, Country } from '@/types/master-data';
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface MasterDataFormProps {
  dataType: MasterDataType;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  initialData?: Record<string, unknown> | null;
  mode: 'create' | 'edit' | 'view';
}

const selectOptions: Record<string, { value: string; label: string }[]> = {
  'companies.type': [
    { value: 'exporter', label: 'Exporter' },
    { value: 'importer', label: 'Importer' },
    { value: 'both', label: 'Both' },
  ],
  'warehouses.type': [
    { value: 'TPS', label: 'TPS (Tempat Penimbunan Sementara)' },
    { value: 'PLB', label: 'PLB (Pusat Logistik Berikat)' },
    { value: 'KB', label: 'KB (Kawasan Berikat)' },
    { value: 'OTHER', label: 'Other' },
  ],
  'ports.type': [
    { value: 'SEA', label: 'Sea Port' },
    { value: 'AIR', label: 'Airport' },
    { value: 'LAND', label: 'Land Border' },
  ],
};

export function MasterDataForm({
  dataType,
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: MasterDataFormProps) {
  const config = masterDataConfig[dataType];
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countries, setCountries] = useState<Country[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);

  // Fetch countries for country_select fields
  useEffect(() => {
    const hasCountryField = config.fields.some(f => f.type === 'country_select');
    if (hasCountryField && isOpen) {
      setLoadingCountries(true);
      supabase
        .from('countries')
        .select('id, code, name, name_en, is_active')
        .eq('is_active', true)
        .order('name_en')
        .then(({ data, error }) => {
          if (!error && data) {
            setCountries(data as Country[]);
          }
          setLoadingCountries(false);
        });
    }
  }, [config.fields, isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        const defaultData: Record<string, unknown> = {};
        config.fields.forEach((field) => {
          if (field.type === 'checkbox') {
            defaultData[field.key] = false;
          } else if (field.type === 'number') {
            defaultData[field.key] = 0;
          } else {
            defaultData[field.key] = '';
          }
        });
        defaultData.is_active = true;
        setFormData(defaultData);
      }
      setErrors({});
    }
  }, [isOpen, initialData, config]);

  const handleChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    config.fields.forEach((field) => {
      if (field.required && !formData[field.key]) {
        newErrors[field.key] = `${field.label} is required`;
      }
    });

    // Special validation for HS Code
    if (dataType === 'hs_codes' && formData.code) {
      if (!validateHSCode(formData.code as string)) {
        newErrors.code = 'HS Code must be 6-10 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (mode === 'view') {
      onClose();
      return;
    }
    if (validate()) {
      onSubmit(formData);
    }
  };

  const isReadOnly = mode === 'view';
  const title = mode === 'create' 
    ? `Add ${config.singularLabel}` 
    : mode === 'edit' 
    ? `Edit ${config.singularLabel}` 
    : `View ${config.singularLabel}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {config.fields.map((field) => {
            const selectKey = `${dataType}.${field.key}`;
            const options = selectOptions[selectKey];

            return (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-xs font-medium">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </Label>

                {field.type === 'country_select' ? (
                  <Select
                    value={formData[field.key] as string || ''}
                    onValueChange={(value) => handleChange(field.key, value)}
                    disabled={isReadOnly || loadingCountries}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={loadingCountries ? 'Loading...' : 'Select country'} />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.code} - {country.name_en || country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === 'select' && options ? (
                  <Select
                    value={formData[field.key] as string || ''}
                    onValueChange={(value) => handleChange(field.key, value)}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === 'textarea' ? (
                  <Textarea
                    value={formData[field.key] as string || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="text-sm min-h-[60px]"
                    disabled={isReadOnly}
                  />
                ) : field.type === 'checkbox' ? (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData[field.key] as boolean || false}
                      onCheckedChange={(checked) => handleChange(field.key, checked)}
                      disabled={isReadOnly}
                    />
                    <span className="text-sm text-muted-foreground">Yes</span>
                  </div>
                ) : field.type === 'number' ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={formData[field.key] as number || 0}
                    onChange={(e) => handleChange(field.key, parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm"
                    disabled={isReadOnly}
                  />
                ) : field.type === 'date' ? (
                  <Input
                    type="date"
                    value={formData[field.key] as string || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="h-8 text-sm"
                    disabled={isReadOnly}
                  />
                ) : (
                  <Input
                    type={field.type}
                    value={formData[field.key] as string || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="h-8 text-sm"
                    disabled={isReadOnly}
                  />
                )}

                {errors[field.key] && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors[field.key]}
                  </p>
                )}
              </div>
            );
          })}

          {/* Is Active Field */}
          <div className="space-y-1.5 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.is_active as boolean}
                onCheckedChange={(checked) => handleChange('is_active', checked)}
                disabled={isReadOnly}
              />
              <Label className="text-sm">Active</Label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {isReadOnly ? 'Close' : 'Cancel'}
          </Button>
          {!isReadOnly && (
            <Button size="sm" onClick={handleSubmit}>
              {mode === 'create' ? 'Create' : 'Save Changes'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
