import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileText, Trash2, Download, Eye } from 'lucide-react';
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
}

export function PIBAttachments({ 
  attachments, 
  onAttachmentsChange, 
  existingAttachments = [],
  isReadOnly 
}: PIBAttachmentsProps) {
  const [selectedType, setSelectedType] = useState<string>('INVOICE');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
                {PIB_DOCUMENT_TYPES.map((type) => (
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
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          <p className="font-medium mb-1">Required Documents for PIB:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Commercial Invoice</li>
            <li>Packing List</li>
            <li>Bill of Lading / Air Waybill</li>
            <li>API Document (if applicable)</li>
          </ul>
        </div>
      )}
    </div>
  );
}
