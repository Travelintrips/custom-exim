import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Archive, 
  Search, 
  Download, 
  Eye,
  ArrowUp,
  ArrowDown,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EDIArchiveEntry, EDIDocumentType, EDIDirection } from '@/lib/edi/types';
import { verifyArchiveIntegrity, exportArchiveEntry } from '@/lib/edi/archive';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EDIArchiveListProps {
  entries: EDIArchiveEntry[];
  onRefresh?: () => void;
}

export function EDIArchiveList({ entries, onRefresh }: EDIArchiveListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<EDIDocumentType | 'all'>('all');
  const [directionFilter, setDirectionFilter] = useState<EDIDirection | 'all'>('all');
  const [selectedEntry, setSelectedEntry] = useState<EDIArchiveEntry | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  
  // Filter entries
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = searchTerm === '' || 
      entry.document_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.message_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || entry.document_type === typeFilter;
    const matchesDirection = directionFilter === 'all' || entry.direction === directionFilter;
    return matchesSearch && matchesType && matchesDirection;
  });
  
  const handleVerify = async (entryId: string) => {
    setVerifying(entryId);
    try {
      const result = await verifyArchiveIntegrity(entryId);
      if (result.isValid) {
        toast.success('XML integrity verified successfully');
      } else {
        toast.error('XML integrity verification failed - file may have been tampered');
      }
    } catch (error) {
      toast.error('Failed to verify integrity');
    } finally {
      setVerifying(null);
    }
  };
  
  const handleDownload = (entryId: string) => {
    const exported = exportArchiveEntry(entryId);
    if (!exported) {
      toast.error('Entry not found');
      return;
    }
    
    const blob = new Blob([exported.content], { type: exported.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exported.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Download started');
  };
  
  return (
    <>
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Archive className="h-4 w-4" />
            EDI Archive
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by document number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as EDIDocumentType | 'all')}>
              <SelectTrigger className="w-28 h-8 text-sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PEB">PEB</SelectItem>
                <SelectItem value="PIB">PIB</SelectItem>
              </SelectContent>
            </Select>
            <Select value={directionFilter} onValueChange={(v) => setDirectionFilter(v as EDIDirection | 'all')}>
              <SelectTrigger className="w-32 h-8 text-sm">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="OUTGOING">Outgoing</SelectItem>
                <SelectItem value="INCOMING">Incoming</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Archive List */}
          {filteredEntries.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Archive className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No archived messages</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b">
                  <tr className="text-left">
                    <th className="p-2 px-3 font-medium text-muted-foreground text-xs">Direction</th>
                    <th className="p-2 font-medium text-muted-foreground text-xs">Type</th>
                    <th className="p-2 font-medium text-muted-foreground text-xs">Document Number</th>
                    <th className="p-2 font-medium text-muted-foreground text-xs">Archived</th>
                    <th className="p-2 px-3 font-medium text-muted-foreground text-xs text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.slice(0, 50).map((entry) => (
                    <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="p-2 px-3">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'text-xs gap-1',
                            entry.direction === 'OUTGOING' 
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          )}
                        >
                          {entry.direction === 'OUTGOING' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )}
                          {entry.direction}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-xs">
                          {entry.document_type}
                        </Badge>
                      </td>
                      <td className="p-2 font-mono text-xs">{entry.document_number}</td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {new Date(entry.archived_at).toLocaleString()}
                      </td>
                      <td className="p-2 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setSelectedEntry(entry)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleVerify(entry.id)}
                            disabled={verifying === entry.id}
                          >
                            <ShieldCheck className={cn(
                              "h-3.5 w-3.5",
                              verifying === entry.id && "animate-pulse"
                            )} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDownload(entry.id)}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredEntries.length > 50 && (
                <div className="p-2 text-center text-xs text-muted-foreground bg-muted/20 border-t">
                  Showing 50 of {filteredEntries.length} entries
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* XML Preview Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Archived XML - {selectedEntry?.document_number}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="flex-1 overflow-hidden space-y-4">
              {/* Metadata */}
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Message ID</span>
                  <p className="font-mono text-xs">{selectedEntry.message_id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Direction</span>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      'text-xs gap-1',
                      selectedEntry.direction === 'OUTGOING' 
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    )}
                  >
                    {selectedEntry.direction}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Archived At</span>
                  <p className="font-mono text-xs">{new Date(selectedEntry.archived_at).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Archive Path</span>
                  <p className="font-mono text-xs truncate">{selectedEntry.archive_path}</p>
                </div>
              </div>
              
              {/* Hash */}
              <div>
                <span className="text-muted-foreground text-xs">XML Hash (SHA-256)</span>
                <p className="font-mono text-xs break-all bg-muted/30 p-2 rounded">{selectedEntry.xml_hash}</p>
              </div>
              
              {/* XML Content */}
              <div className="flex-1 overflow-hidden">
                <span className="text-muted-foreground text-xs">XML Content</span>
                <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-auto h-[40vh] text-xs font-mono whitespace-pre">
                  {selectedEntry.xml_content}
                </pre>
              </div>
              
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleVerify(selectedEntry.id)}
                  className="gap-1.5"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verify Integrity
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(selectedEntry.id)}
                  className="gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download XML
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
