import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Trash2, Download, Eye, AlertCircle, CheckCircle2, Plus } from 'lucide-react';
import { PIBAttachment, PIB_DOCUMENT_TYPES } from '@/types/pib';
import { cn } from '@/lib/utils';

interface AttachmentWithFile {
  document_type: string;
  file: File;
  preview?: string;
}

interface PIBAttachmentsProps {
  attachments: AttachmentWithFile[];
  onAttachmentsChange: (attachments: AttachmentWithFile[]) => void;
  existingAttachments?: PIBAttachment[];
  isReadOnly?: boolean;
  transportMode?: string;
}

export function PIBAttachments({ 
  attachments, 
  onAttachmentsChange, 
  existingAttachments = [],
  isReadOnly,
  transportMode 
}: PIBAttachmentsProps) {
  const [selectedType, setSelectedType] = useState<string>('INVOICE');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get required documents based on transport mode
  const getRequiredDocuments = () => {
    const baseRequired = [
      { code: 'INVOICE', label: 'Commercial Invoice', required: true },
      { code: 'PACKING_LIST', label: 'Packing List', required: true },
    ];

    if (transportMode === 'AIR') {
      return [...baseRequired, { code: 'AWB', label: 'Air Waybill', required: true }];
    } else if (transportMode === 'SEA') {
      return [...baseRequired, { code: 'BL', label: 'Bill of Lading', required: true }];
    }

    // Default: show both options if transport mode not set
    return [
      ...baseRequired,
      { code: 'BL', label: 'Bill of Lading', required: false },
      { code: 'AWB', label: 'Air Waybill', required: false },
    ];
  };

  const requiredDocuments = getRequiredDocuments();

  // Get relevant document types for dropdown based on transport mode
  const getRelevantDocTypes = () => {
    if (!transportMode) return PIB_DOCUMENT_TYPES;

    // Filter out irrelevant document types
    if (transportMode === 'AIR') {
      return PIB_DOCUMENT_TYPES.filter(type => type.value !== 'BL');
    } else if (transportMode === 'SEA') {
      return PIB_DOCUMENT_TYPES.filter(type => type.value !== 'AWB');
    }

    return PIB_DOCUMENT_TYPES;
  };

  const relevantDocTypes = getRelevantDocTypes();

  // Check if all required documents are uploaded
  const getMissingRequiredDocs = () => {
    const uploadedTypes = new Set([
      ...attachments.map(att => att.document_type),
      ...existingAttachments.map(att => att.document_type)
    ]);

    return requiredDocuments
      .filter(doc => doc.required)
      .filter(doc => !uploadedTypes.has(doc.code));
  };

  const missingRequiredDocs = getMissingRequiredDocs();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: AttachmentWithFile[] = Array.from(files).map(file => ({
      document_type: selectedType,
      file,
    }));

    onAttachmentsChange([...attachments, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    onAttachmentsChange(attachments.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getDocTypeName = (code: string): string => {
    return PIB_DOCUMENT_TYPES.find(t => t.value === code)?.label || code;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Supporting Documents</h3>
      </div>

      {/* Upload Area - Document Type Buttons */}
      {!isReadOnly && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {relevantDocTypes.map((type) => {
              const isUploaded = attachments.some(att => att.document_type === type.value) ||
                               existingAttachments.some(att => att.document_type === type.value);
              const isRequired = requiredDocuments.some(rd => rd.code === type.value && rd.required);
              
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setSelectedType(type.value);
                    fileInputRef.current?.click();
                  }}
                  className={cn(
                    "relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all text-center min-h-[80px]",
                    "hover:border-blue-500 hover:bg-blue-50",
                    isUploaded 
                      ? "border-emerald-500 bg-emerald-50" 
                      : isRequired 
                        ? "border-amber-300 bg-amber-50/50" 
                        : "border-slate-200 bg-white"
                  )}
                >
                  {isUploaded ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 mb-1" />
                  ) : (
                    <Plus className="h-5 w-5 text-slate-400 mb-1" />
                  )}
                  <span className={cn(
                    "text-xs font-medium leading-tight",
                    isUploaded ? "text-emerald-700" : "text-slate-700"
                  )}>
                    {type.label}
                  </span>
                  {isRequired && !isUploaded && (
                    <Badge variant="destructive" className="text-[9px] h-4 px-1 mt-1">
                      WAJIB
                    </Badge>
                  )}
                  {isUploaded && (
                    <span className="text-[10px] text-emerald-600 mt-0.5">Uploaded</span>
                  )}
                </button>
              );
            })}
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Klik tipe dokumen untuk upload file
          </p>
        </div>
      )}

      {/* New Attachments */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">New Files to Upload</h4>
          <div className="border rounded-lg divide-y">
            {attachments.map((att, index) => (
              <div key={index} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{att.file?.name || att.name || "Document"}</p>
                    <p className="text-xs text-muted-foreground">
                      {getDocTypeName(att.document_type)} · {att.file ? formatFileSize(att.file.size) : ""}
                    </p>
                  </div>
                </div>
                {!isReadOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeAttachment(index)}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Attachments */}
      {existingAttachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Uploaded Documents</h4>
          <div className="border rounded-lg divide-y">
            {existingAttachments.map((att) => (
              <div key={att.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{att.document_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getDocTypeName(att.document_type)} · {att.file_size ? formatFileSize(att.file_size) : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {attachments.length === 0 && existingAttachments.length === 0 && (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No documents attached</p>
          {!isReadOnly && (
            <p className="text-xs mt-1">Upload supporting documents like invoices, B/L, etc.</p>
          )}
        </div>
      )}

      {/* Missing Required Documents Warning */}
      {!isReadOnly && missingRequiredDocs.length > 0 && (
        <div className="border rounded-lg p-3 text-xs bg-red-50 border-red-200 text-red-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Dokumen Wajib Belum Lengkap:</p>
              <p className="text-[11px] mt-0.5">
                {missingRequiredDocs.map(d => d.label).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* All Required Documents Uploaded */}
      {!isReadOnly && missingRequiredDocs.length === 0 && attachments.length + existingAttachments.length > 0 && (
        <div className="border rounded-lg p-3 text-xs bg-emerald-50 border-emerald-200 text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <p className="font-medium">Semua dokumen wajib sudah di-upload</p>
          </div>
        </div>
      )}
    </div>
  );
}
