import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  Clock,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { IncomingMessage, EDIStatus } from '@/lib/edi/types';
import { ErrorGroup, ParsedError } from '@/lib/edi/error-parser';
import { PIB_LANE_CONFIG } from '@/types/pib';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface EDIResponseViewerProps {
  message: IncomingMessage;
  onClose?: () => void;
}

const statusConfig: Record<EDIStatus, { 
  label: string; 
  color: string; 
  icon: React.ReactNode 
}> = {
  PENDING: { 
    label: 'Pending', 
    color: 'bg-slate-100 text-slate-700 border-slate-300', 
    icon: <Clock className="h-4 w-4" /> 
  },
  SENT: { 
    label: 'Sent', 
    color: 'bg-blue-100 text-blue-700 border-blue-300', 
    icon: <FileText className="h-4 w-4" /> 
  },
  RECEIVED: { 
    label: 'Received', 
    color: 'bg-purple-100 text-purple-700 border-purple-300', 
    icon: <CheckCircle className="h-4 w-4" /> 
  },
  ACCEPTED: { 
    label: 'Accepted', 
    color: 'bg-emerald-100 text-emerald-700 border-emerald-300', 
    icon: <CheckCircle className="h-4 w-4" /> 
  },
  REJECTED: { 
    label: 'Rejected', 
    color: 'bg-red-100 text-red-700 border-red-300', 
    icon: <XCircle className="h-4 w-4" /> 
  },
  ERROR: { 
    label: 'Error', 
    color: 'bg-amber-100 text-amber-700 border-amber-300', 
    icon: <AlertCircle className="h-4 w-4" /> 
  },
};

export function EDIResponseViewer({ message, onClose }: EDIResponseViewerProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };
  
  const statusInfo = statusConfig[message.status];
  const { response, errorGroups } = message;
  
  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className={cn(
        'rounded-lg p-4 flex items-center justify-between',
        message.status === 'ACCEPTED' ? 'bg-emerald-50 border border-emerald-200' :
        message.status === 'REJECTED' ? 'bg-red-50 border border-red-200' :
        'bg-slate-50 border border-slate-200'
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-full',
            message.status === 'ACCEPTED' ? 'bg-emerald-100' :
            message.status === 'REJECTED' ? 'bg-red-100' :
            'bg-slate-100'
          )}>
            {statusInfo.icon}
          </div>
          <div>
            <h3 className="font-medium">{statusInfo.label}</h3>
            <p className="text-sm text-muted-foreground">{response.response_message}</p>
          </div>
        </div>
        <Badge variant="outline" className={cn('text-sm border', statusInfo.color)}>
          Code: {response.response_code}
        </Badge>
      </div>
      
      {/* Integrity Check */}
      <div className={cn(
        'flex items-center gap-2 p-3 rounded-lg border text-sm',
        message.integrityVerified 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
          : 'bg-amber-50 border-amber-200 text-amber-700'
      )}>
        {message.integrityVerified ? (
          <>
            <ShieldCheck className="h-4 w-4" />
            <span>XML integrity verified</span>
          </>
        ) : (
          <>
            <ShieldAlert className="h-4 w-4" />
            <span>XML integrity could not be verified</span>
          </>
        )}
      </div>
      
      {/* Registration Data */}
      {response.success && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Registration Data</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {response.reference_number && (
                <div>
                  <span className="text-muted-foreground text-xs">Reference Number</span>
                  <p className="font-mono">{response.reference_number}</p>
                </div>
              )}
              {response.registration_number && (
                <div>
                  <span className="text-muted-foreground text-xs">Registration Number</span>
                  <p className="font-mono">{response.registration_number}</p>
                </div>
              )}
              {response.registration_date && (
                <div>
                  <span className="text-muted-foreground text-xs">Registration Date</span>
                  <p className="font-mono">{response.registration_date}</p>
                </div>
              )}
              
              {/* PEB specific */}
              {response.npe_number && (
                <div>
                  <span className="text-muted-foreground text-xs">NPE Number</span>
                  <p className="font-mono">{response.npe_number}</p>
                </div>
              )}
              {response.npe_date && (
                <div>
                  <span className="text-muted-foreground text-xs">NPE Date</span>
                  <p className="font-mono">{response.npe_date}</p>
                </div>
              )}
              
              {/* PIB specific */}
              {response.sppb_number && (
                <div>
                  <span className="text-muted-foreground text-xs">SPPB Number</span>
                  <p className="font-mono">{response.sppb_number}</p>
                </div>
              )}
              {response.sppb_date && (
                <div>
                  <span className="text-muted-foreground text-xs">SPPB Date</span>
                  <p className="font-mono">{response.sppb_date}</p>
                </div>
              )}
              
              {/* Lane for PIB */}
              {response.lane && (
                <div className="col-span-2">
                  <span className="text-muted-foreground text-xs">Assigned Lane</span>
                  <div className="mt-1">
                    <Badge className={cn(
                      'text-sm',
                      PIB_LANE_CONFIG[response.lane].color
                    )}>
                      {PIB_LANE_CONFIG[response.lane].label}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {PIB_LANE_CONFIG[response.lane].description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Errors */}
      {errorGroups.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Validation Errors ({response.errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="space-y-2">
              {errorGroups.map((group) => (
                <ErrorGroupCard 
                  key={group.section}
                  group={group}
                  expanded={expandedSections.includes(group.section)}
                  onToggle={() => toggleSection(group.section)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Metadata */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm">Message Details</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Message ID</span>
              <p className="font-mono text-xs">{message.id}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Document Number</span>
              <p className="font-mono">{message.documentNumber}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Document Type</span>
              <p>{message.documentType}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">CEISA Reference</span>
              <p className="font-mono">{message.ceisaReference || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Received At</span>
              <p className="font-mono text-xs">{new Date(message.receivedAt).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Processed At</span>
              <p className="font-mono text-xs">{message.processedAt ? new Date(message.processedAt).toLocaleString() : 'Not processed'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {onClose && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
}

interface ErrorGroupCardProps {
  group: ErrorGroup;
  expanded: boolean;
  onToggle: () => void;
}

function ErrorGroupCard({ group, expanded, onToggle }: ErrorGroupCardProps) {
  const errorCount = group.errors.filter(e => e.severity === 'error').length;
  const warningCount = group.errors.filter(e => e.severity === 'warning').length;
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full p-3 flex items-center justify-between hover:bg-muted/30 text-left"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="font-medium text-sm">{group.section}</span>
        </div>
        <div className="flex items-center gap-2">
          {errorCount > 0 && (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
              {errorCount} error{errorCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
              {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </button>
      
      {expanded && (
        <div className="border-t p-3 space-y-2 bg-muted/10">
          {group.errors.map((error, index) => (
            <ErrorItem key={index} error={error} />
          ))}
        </div>
      )}
    </div>
  );
}

function ErrorItem({ error }: { error: ParsedError }) {
  return (
    <div className={cn(
      'p-2 rounded border text-sm',
      error.severity === 'error' ? 'bg-red-50 border-red-200' :
      error.severity === 'warning' ? 'bg-amber-50 border-amber-200' :
      'bg-blue-50 border-blue-200'
    )}>
      <div className="flex items-center gap-2 mb-1">
        <Badge variant="outline" className="text-xs font-mono">{error.code}</Badge>
        <span className="font-medium">{error.fieldLabel}</span>
      </div>
      <p className={cn(
        'text-sm',
        error.severity === 'error' ? 'text-red-700' :
        error.severity === 'warning' ? 'text-amber-700' :
        'text-blue-700'
      )}>
        {error.message}
      </p>
      {error.value && (
        <p className="text-xs text-muted-foreground mt-1">
          Value: <span className="font-mono">{error.value}</span>
        </p>
      )}
      {error.suggestion && (
        <p className="text-xs mt-1 bg-white/50 p-1.5 rounded">
          💡 {error.suggestion}
        </p>
      )}
    </div>
  );
}
