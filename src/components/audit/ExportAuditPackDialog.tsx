import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Download, FileText, Package, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AuditEntityType } from '@/types/audit';
import { PEBDocument } from '@/types/peb';
import { PIBDocument } from '@/types/pib';
import { createAuditPackFiles, AuditPackFile } from '@/lib/audit/report-generator';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface ExportAuditPackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entity_type: AuditEntityType;
  entity_id: string;
  document: PEBDocument | PIBDocument;
}

export function ExportAuditPackDialog({
  isOpen,
  onClose,
  entity_type,
  entity_id,
  document,
}: ExportAuditPackDialogProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Generate audit pack files
      const files = await createAuditPackFiles(entity_type, entity_id, document);
      
      // Create ZIP
      const zip = new JSZip();
      
      for (const file of files) {
        zip.file(file.filename, file.content);
      }
      
      // Generate ZIP blob
      const blob = await zip.generateAsync({ type: 'blob' });
      
      // Download
      const filename = `AuditPack_${entity_type}_${document.document_number || 'draft'}_${new Date().toISOString().substring(0, 10)}.zip`;
      saveAs(blob, filename);
      
      toast.success('Audit pack exported successfully');
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export audit pack');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Export Audit Pack
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium">Package Contents:</h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                <span>Complete document data (JSON)</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" />
                <span>Immutable audit trail logs</span>
              </li>
              <li className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                <span>Generation metadata & hashes</span>
              </li>
              <li className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                <span>Verification instructions</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <p className="font-medium mb-1">📦 Archive Format</p>
            <p>
              The audit pack will be exported as a ZIP file containing all document data,
              audit logs, and verification hashes for compliance purposes.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleExport} disabled={isExporting} className="gap-1.5">
            {isExporting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                Export ZIP
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
