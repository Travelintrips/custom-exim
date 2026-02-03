import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Copy, Check, Download, Code, AlertTriangle } from 'lucide-react';
import { PIBDocument, generatePIBXML } from '@/types/pib';
import { PIBMetadata, validatePIBMetadata } from '@/lib/pib/pib-metadata';
import { mapPIBMetadataToXML } from '@/lib/edi/xml-mapper';

interface PIBXMLPreviewProps {
  pib: PIBDocument & { metadata?: PIBMetadata };
  isOpen: boolean;
  onClose: () => void;
}

export function PIBXMLPreview({ pib, isOpen, onClose }: PIBXMLPreviewProps) {
  const [copied, setCopied] = useState(false);
  
  // Prefer metadata-based XML generation (source of truth)
  // Fall back to legacy generation if metadata is not available
  const { xml, error, useMetadata } = useMemo(() => {
    // Check if metadata exists and is valid
    const metadata = (pib as any).metadata as PIBMetadata | undefined;
    
    if (metadata && Object.keys(metadata).length > 0) {
      const validation = validatePIBMetadata(metadata);
      
      if (validation.isValid) {
        try {
          const metadataXml = mapPIBMetadataToXML(metadata);
          return { xml: metadataXml, error: null, useMetadata: true };
        } catch (e: any) {
          return { 
            xml: '', 
            error: `Metadata XML generation failed: ${e.message}`, 
            useMetadata: true 
          };
        }
      } else {
        // Metadata exists but invalid - show errors but try legacy
        console.warn('PIB Metadata validation failed:', validation.errors);
        return { 
          xml: generatePIBXML(pib), 
          error: `Metadata invalid: ${validation.errors.join(', ')}. Using legacy XML.`, 
          useMetadata: false 
        };
      }
    }
    
    // No metadata - use legacy generation
    return { 
      xml: generatePIBXML(pib), 
      error: 'No metadata found. Using legacy XML generation. Save the PIB to generate metadata.', 
      useMetadata: false 
    };
  }, [pib]);

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
            {useMetadata && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-normal">
                FROM METADATA
              </span>
            )}
            {!useMetadata && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-normal">
                LEGACY
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Warning</p>
              <p>{error}</p>
            </div>
          </div>
        )}

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
