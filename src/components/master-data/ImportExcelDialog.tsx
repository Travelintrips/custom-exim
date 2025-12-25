import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import { MasterDataType, masterDataConfig, validateHSCode } from '@/types/master-data';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

interface ImportExcelDialogProps {
  dataType: MasterDataType;
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: Record<string, unknown>[]) => void;
}

type ImportStatus = 'idle' | 'uploading' | 'validating' | 'success' | 'error';

export function ImportExcelDialog({
  dataType,
  isOpen,
  onClose,
  onImport,
}: ImportExcelDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [errors, setErrors] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = masterDataConfig[dataType];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('validating');
      setErrors([]);
      
      try {
        // Parse Excel file
        const data = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
        
        if (jsonData.length === 0) {
          setErrors(['File is empty or has no valid data']);
          setStatus('error');
          return;
        }
        
        // Validate required fields
        const validationErrors: string[] = [];
        const requiredFields = config.fields.filter(f => f.required).map(f => f.key);
        
        jsonData.forEach((row, index) => {
          requiredFields.forEach(field => {
            if (!row[field]) {
              validationErrors.push(`Row ${index + 2}: Missing required field '${field}'`);
            }
          });
          
          // Special validation for HS Codes
          if (dataType === 'hs_codes' && row.code) {
            if (!validateHSCode(row.code as string)) {
              validationErrors.push(`Row ${index + 2}: Invalid HS Code format '${row.code}'`);
            }
          }
        });
        
        // Check for duplicates within the file
        const codes = jsonData.map(row => row.code as string).filter(Boolean);
        const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
        if (duplicates.length > 0) {
          validationErrors.push(`Duplicate codes found in file: ${[...new Set(duplicates)].join(', ')}`);
        }
        
        // Check for existing records in database
        if (codes.length > 0) {
          const { data: existingRecords } = await supabase
            .from(dataType)
            .select('code')
            .in('code', codes);
          
          if (existingRecords && existingRecords.length > 0) {
            const existingCodes = existingRecords.map(r => r.code);
            validationErrors.push(`Codes already exist in database: ${existingCodes.join(', ')}`);
          }
        }
        
        if (validationErrors.length > 0) {
          setErrors(validationErrors.slice(0, 10)); // Show max 10 errors
          setStatus('error');
          return;
        }
        
        setPreviewData(jsonData);
        setStatus('idle');
      } catch (error) {
        console.error('Error parsing file:', error);
        setErrors(['Failed to parse Excel file. Please check the format.']);
        setStatus('error');
      }
    }
  };

  const handleImport = () => {
    if (previewData.length === 0) return;
    
    setStatus('uploading');
    // Simulate import
    setTimeout(() => {
      onImport(previewData);
      setStatus('success');
      setTimeout(() => {
        handleClose();
      }, 1500);
    }, 1000);
  };

  const handleClose = () => {
    setFile(null);
    setStatus('idle');
    setErrors([]);
    setPreviewData([]);
    onClose();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
      setStatus('validating');
      // Process file...
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Import {config.label}</DialogTitle>
          <DialogDescription className="text-xs">
            Upload an Excel file to import {config.label.toLowerCase()} data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Area */}
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer',
              'hover:border-primary/50 hover:bg-muted/20',
              file && 'border-primary bg-primary/5'
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setPreviewData([]);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Excel files (.xlsx, .xls)
                </p>
              </>
            )}
          </div>

          {/* Status Messages */}
          {status === 'validating' && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <div className="animate-spin h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full" />
              Validating file...
            </div>
          )}

          {status === 'uploading' && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
              Importing data...
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle className="h-4 w-4" />
              Import successful!
            </div>
          )}

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <div className="flex items-center gap-2 text-sm text-red-600 mb-2">
                <AlertCircle className="h-4 w-4" />
                Validation Errors
              </div>
              <ul className="text-xs text-red-600 space-y-1 ml-6 list-disc">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview */}
          {previewData.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Preview ({previewData.length} records)
              </p>
              <div className="border rounded overflow-hidden max-h-40 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 border-b">
                    <tr>
                      <th className="p-2 text-left font-medium">Code</th>
                      <th className="p-2 text-left font-medium">Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="p-2 font-mono">{row.code as string}</td>
                        <td className="p-2">{row.name as string}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 5 && (
                  <div className="p-2 text-center text-xs text-muted-foreground bg-muted/20">
                    ... and {previewData.length - 5} more records
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Template Download */}
          <div className="text-xs text-muted-foreground">
            <a href="#" className="text-primary hover:underline">
              Download template
            </a>{' '}
            for {config.label.toLowerCase()} import
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleImport}
            disabled={previewData.length === 0 || status === 'uploading' || status === 'validating'}
          >
            Import {previewData.length > 0 && `(${previewData.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
