import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, FileText, FileSpreadsheet, Download, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { 
  exportYearlyReport, 
  exportMonthlyReport, 
  exportCustomReport 
} from "@/services/reportService";
import { showError, showSuccess } from "@/utils/toast";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMonth: string;
  currentYear: number;
}

type ExportType = 'PDF' | 'EXCEL';
type ReportType = 'monthly' | 'yearly' | 'custom';

const ExportDialog = ({ open, onOpenChange, currentMonth, currentYear }: ExportDialogProps) => {
  const [exportType, setExportType] = useState<ExportType>('PDF');
  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [isExporting, setIsExporting] = useState(false);
  
  // Custom report date range
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  // Monthly report date
  const [monthlyDate, setMonthlyDate] = useState<string>(currentMonth.slice(0, 7));
  
  // Yearly report year
  const [yearlyYear, setYearlyYear] = useState<number>(currentYear);

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getFileName = () => {
    const extension = exportType === 'PDF' ? 'pdf' : 'xlsx';
    const timestamp = format(new Date(), 'yyyy-MM-dd');
    
    switch (reportType) {
      case 'monthly':
        const monthName = format(parseISO(monthlyDate + '-01'), 'yyyy-MM');
        return `monthly-report-${monthName}-${timestamp}.${extension}`;
      case 'yearly':
        return `yearly-report-${yearlyYear}-${timestamp}.${extension}`;
      case 'custom':
        return `custom-report-${startDate}-to-${endDate}-${timestamp}.${extension}`;
      default:
        return `report-${timestamp}.${extension}`;
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      let blob: Blob;
      
      switch (reportType) {
        case 'monthly':
          blob = await exportMonthlyReport(monthlyDate + '-01', exportType);
          break;
        case 'yearly':
          blob = await exportYearlyReport(yearlyYear, exportType);
          break;
        case 'custom':
          blob = await exportCustomReport(startDate, endDate, exportType);
          break;
        default:
          throw new Error('Invalid report type');
      }
      
      const filename = getFileName();
      downloadFile(blob, filename);
      
      showSuccess(`${exportType} report exported successfully!`);
      onOpenChange(false);
      
    } catch (error) {
      console.error('Export error:', error);
      showError('Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const isValidCustomDateRange = () => {
    return startDate && endDate && new Date(startDate) <= new Date(endDate);
  };

  const canExport = () => {
    if (reportType === 'custom') {
      return isValidCustomDateRange();
    }
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Reports
          </DialogTitle>
          <DialogDescription>
            Choose the report type and export format for your financial data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <RadioGroup value={exportType} onValueChange={(value) => setExportType(value as ExportType)}>
              <div className="grid grid-cols-2 gap-3">
                <Card className={`cursor-pointer transition-colors ${exportType === 'PDF' ? 'ring-2 ring-primary' : ''}`}>
                  <CardContent className="flex items-center space-x-3 p-4">
                    <RadioGroupItem value="PDF" id="pdf" />
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-red-600" />
                      <Label htmlFor="pdf" className="cursor-pointer">PDF</Label>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className={`cursor-pointer transition-colors ${exportType === 'EXCEL' ? 'ring-2 ring-primary' : ''}`}>
                  <CardContent className="flex items-center space-x-3 p-4">
                    <RadioGroupItem value="EXCEL" id="excel" />
                    <div className="flex items-center space-x-2">
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      <Label htmlFor="excel" className="cursor-pointer">Excel</Label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </RadioGroup>
          </div>

          {/* Report Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Report Type</Label>
            <Tabs value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
              <TabsList className="grid w-full grid-cols-3 bg-accent text-accent-foreground">
                <TabsTrigger value="monthly" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Monthly</TabsTrigger>
                <TabsTrigger value="yearly" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Yearly</TabsTrigger>
                <TabsTrigger value="custom" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Custom</TabsTrigger>
              </TabsList>
              
              <TabsContent value="monthly" className="space-y-3 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly-date">Select Month</Label>
                  <Input
                    id="monthly-date"
                    type="month"
                    value={monthlyDate}
                    onChange={(e) => setMonthlyDate(e.target.value)}
                    className="w-50 h-10 px-3 text-sm [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="yearly" className="space-y-3 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="yearly-year">Select Year</Label>
                  <Input
                    id="yearly-year"
                    type="number"
                    value={yearlyYear}
                    onChange={(e) => setYearlyYear(parseInt(e.target.value))}
                    min="2020"
                    max="2030"
                    className="w-full h-10 px-3 text-sm"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="custom" className="space-y-3 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-10 px-3 text-sm [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="w-full h-10 px-3 text-sm [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>
                </div>
                {!isValidCustomDateRange() && (
                  <p className="text-sm text-destructive">
                    Please select a valid date range (end date must be after start date).
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={!canExport() || isExporting}
            className="min-w-[100px]"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
