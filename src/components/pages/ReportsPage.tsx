import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  BarChart3, 
  TrendingUp, 
  FileSpreadsheet,
  Calendar,
  Filter,
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

type ReportType = 'peb_summary' | 'pib_summary' | 'transaction_volume' | 'status_report' | 'audit_summary' | 'master_data';

interface ReportConfig {
  id: ReportType;
  title: string;
  description: string;
  icon: React.ReactNode;
  formats: string[];
}

const reportConfigs: ReportConfig[] = [
  {
    id: 'peb_summary',
    title: 'PEB Summary Report',
    description: 'Export declarations summary by period, status, and customs office',
    icon: <FileText className="w-5 h-5 text-blue-600" />,
    formats: ['PDF', 'Excel', 'CSV'],
  },
  {
    id: 'pib_summary',
    title: 'PIB Summary Report',
    description: 'Import declarations summary by period, status, and customs office',
    icon: <FileText className="w-5 h-5 text-purple-600" />,
    formats: ['PDF', 'Excel', 'CSV'],
  },
  {
    id: 'transaction_volume',
    title: 'Transaction Volume Report',
    description: 'Transaction counts and values by period with trend analysis',
    icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
    formats: ['PDF', 'Excel'],
  },
  {
    id: 'status_report',
    title: 'Document Status Report',
    description: 'Document status breakdown by type (Draft, Submitted, Approved, Rejected)',
    icon: <BarChart3 className="w-5 h-5 text-amber-600" />,
    formats: ['PDF', 'Excel'],
  },
  {
    id: 'audit_summary',
    title: 'Audit Trail Summary',
    description: 'User activity and audit log summary report',
    icon: <Calendar className="w-5 h-5 text-slate-600" />,
    formats: ['PDF', 'Excel', 'CSV'],
  },
  {
    id: 'master_data',
    title: 'Master Data Export',
    description: 'Export master data (Companies, HS Codes, Ports, etc.)',
    icon: <FileSpreadsheet className="w-5 h-5 text-indigo-600" />,
    formats: ['Excel', 'CSV'],
  },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async (format: string) => {
    if (!selectedReport) return;
    
    setIsGenerating(true);
    try {
      // TODO: Implement report generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Generating report:', selectedReport, format, dateRange, statusFilter);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedConfig = reportConfigs.find(r => r.id === selectedReport);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#1F2937]">Reports</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Generate and export various reports for compliance and analysis
            </p>
          </div>
        </div>

        {/* Report Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportConfigs.map((report) => (
            <Card
              key={report.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedReport === report.id
                  ? 'ring-2 ring-[#1E3A5F] border-[#1E3A5F]'
                  : 'border-[#E2E8F0]'
              }`}
              onClick={() => setSelectedReport(report.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-[#F5F7FA] rounded-lg">
                    {report.icon}
                  </div>
                  {selectedReport === report.id && (
                    <Badge className="bg-[#1E3A5F] text-white text-xs">Selected</Badge>
                  )}
                </div>
                <CardTitle className="text-base font-medium mt-3">{report.title}</CardTitle>
                <CardDescription className="text-xs">{report.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-1 flex-wrap">
                  {report.formats.map((format) => (
                    <Badge key={format} variant="outline" className="text-xs">
                      {format}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Report Configuration */}
        {selectedReport && (
          <Card className="border-[#E2E8F0]">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Report Parameters
              </CardTitle>
              <CardDescription>
                Configure filters and parameters for {selectedConfig?.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1F2937]">Date Range</label>
                  <DatePickerWithRange
                    date={dateRange}
                    onDateChange={setDateRange}
                  />
                </div>

                {/* Status Filter */}
                {(selectedReport === 'peb_summary' || selectedReport === 'pib_summary' || selectedReport === 'status_report') && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#1F2937]">Status Filter</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="SUBMITTED">Submitted</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Generate Buttons */}
              <div className="flex gap-2 pt-4 border-t border-[#E2E8F0]">
                {selectedConfig?.formats.map((format) => (
                  <Button
                    key={format}
                    variant={format === 'PDF' ? 'default' : 'outline'}
                    className={format === 'PDF' ? 'bg-[#1E3A5F] hover:bg-[#2d4a6f]' : ''}
                    onClick={() => handleGenerateReport(format)}
                    disabled={isGenerating}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isGenerating ? 'Generating...' : `Export ${format}`}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!selectedReport && (
          <Card className="border-[#E2E8F0] border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="w-12 h-12 text-[#6B7280] mb-4" />
              <h3 className="text-base font-medium text-[#1F2937] mb-1">Select a Report Type</h3>
              <p className="text-sm text-[#6B7280] text-center max-w-md">
                Choose one of the report types above to configure parameters and generate your report
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
