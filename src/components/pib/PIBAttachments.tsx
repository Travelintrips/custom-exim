import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileText, Trash2, Download, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';
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

      {/* Upload Area */}
      {!isReadOnly && (
        <div className="flex gap-3 items-end">
          <div className="flex-1 max-w-xs">
            <label className="text-xs text-muted-foreground mb-1.5 block">Document Type</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {relevantDocTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5"
            >
              <Upload size={14} />
              Upload Files
            </Button>
          </div>
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
                    <p className="text-sm font-medium">{att.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getDocTypeName(att.document_type)} · {formatFileSize(att.file.size)}
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

      {/* Required Documents Note */}
      {!isReadOnly && (
        <div className={cn(
          "border rounded-lg p-3 text-xs",
          missingRequiredDocs.length > 0
            ? "bg-red-50 border-red-200 text-red-800"
            : "bg-emerald-50 border-emerald-200 text-emerald-800"
        )}>
          <p className="font-medium mb-2 flex items-center gap-2">
            {missingRequiredDocs.length > 0 ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {transportMode 
              ? `Required Documents for PIB (${transportMode}):` 
              : 'Required Documents for PIB:'}
          </p>
          <ul className="space-y-1">
            {requiredDocuments.map((doc) => {
              const isUploaded = attachments.some(att => att.document_type === doc.code) ||
                                existingAttachments.some(att => att.document_type === doc.code);
              return (
                <li key={doc.code} className="flex items-center gap-2">
                  {isUploaded ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-current shrink-0" />
                  )}
                  <span className={isUploaded ? "line-through opacity-70" : ""}>{doc.label}</span>
                  {doc.required && (
                    <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                      REQUIRED
                    </Badge>
                  )}
                  {!doc.required && (
                    <span className="text-[10px] text-muted-foreground">(optional)</span>
                  )}
                </li>
              );
            })}
          </ul>
          {missingRequiredDocs.length > 0 && (
            <div className="mt-3 pt-3 border-t border-red-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Missing Required Documents:</p>
                <p className="text-[11px] mt-0.5">
                  {missingRequiredDocs.map(d => d.label).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
