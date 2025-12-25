import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Copy, Check, Download, Code } from 'lucide-react';
import { PIBDocument, generatePIBXML } from '@/types/pib';

interface PIBXMLPreviewProps {
  pib: PIBDocument;
  isOpen: boolean;
  onClose: () => void;
}

export function PIBXMLPreview({ pib, isOpen, onClose }: PIBXMLPreviewProps) {
  const [copied, setCopied] = useState(false);
  const xml = generatePIBXML(pib);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(xml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PIB_${pib.document_number || 'draft'}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Code className="h-4 w-4" />
            PIB XML Preview
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="relative h-full">
            <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-auto h-[50vh] text-xs font-mono whitespace-pre">
              {xml}
            </pre>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy XML'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
            <Download size={14} />
            Download XML
          </Button>
          <Button size="sm" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
