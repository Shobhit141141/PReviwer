import { Download, Loader } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { Button } from "../ui/button";
import { useState } from "react";
import { prReportApi } from "@/lib/api";
import { marked } from "marked";
import { jsPDF } from "jspdf";
import { useParams } from "next/navigation";
import { Report } from "@/types";

interface PrExportProps {
  showExportModal: boolean;
  setShowExportModal: (open: boolean) => void;
  selectedReportForExport: Report | null;
  setSelectedReportForExport: (report: Report | null) => void;
  templateReport?: string | null;
}

function PrExport({
  showExportModal,
  setShowExportModal,
  selectedReportForExport,
  setSelectedReportForExport,
  templateReport
}: PrExportProps) {
  const params = useParams<{ params?: string[] }>().params;
  const [exportFormat, setExportFormat] = useState<string>('json');
  const [exportingReport, setExportingReport] = useState<boolean>(false);
  const exportData = async (analysisText: string, format: string) => {
    let blob: Blob;
    const [owner, repo, prId] = params || [];
    let filename = `pull-request-analysis-${prId}-${owner}-${repo}`;

    switch (format) {
      case "json":
        blob = new Blob([JSON.stringify({ analysis: analysisText }, null, 2)], {
          type: "application/json",
        });
        filename += ".json";
        break;

      case "markdown":
        blob = new Blob([analysisText], { type: "text/markdown" });
        filename += ".md";
        break;

      case "text":
        blob = new Blob([analysisText], { type: "text/plain" });
        filename += ".txt";
        break;

      case "csv":
        const csvText = analysisText
          .replace(/^#+\s/gm, "") // Remove markdown headings
          .replace(/\*\*/g, "") // Remove bold
          .replace(/\n\n/g, "\n") // Remove double newlines
          .replace(/\n/g, ",\n"); // Convert newlines to commas (basic conversion)
        blob = new Blob([csvText], { type: "text/csv" });
        filename += ".csv";
        break;

      case "pdf":
        const doc = new jsPDF();
        const lines = doc.splitTextToSize(analysisText, 180);
        doc.text(lines, 10, 10);
        doc.save(filename + ".pdf");
        return; // No need for downloadFile here

      case "html":
        const htmlContent = await marked(analysisText);
        blob = new Blob([htmlContent], { type: "text/html" });
        filename += ".html";
        break;

      default:
        console.warn("Unsupported export format");
        return;
    }

    downloadFile(blob, filename);
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Dialog
      open={showExportModal}
      onOpenChange={(open) => {
        setShowExportModal(open);
        if (!open) setSelectedReportForExport(null);
      }}
    >
      <DialogContent className="bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-400" />
            Export {selectedReportForExport ? 'Saved Report' : 'Current Report'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 block">
              Export Format
            </label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-full bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="json">JSON Format</SelectItem>
                <SelectItem value="markdown">Markdown (.md)</SelectItem>
                <SelectItem value="text">Plain Text (.txt)</SelectItem>
                <SelectItem value="csv">CSV Format</SelectItem>
                <SelectItem value="pdf">PDF Format</SelectItem>
                <SelectItem value="html">HTML Format</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowExportModal(false);
                setSelectedReportForExport(null);
              }}
              className="border-gray-700 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setExportingReport(true);
                try {
                  if (selectedReportForExport) {
                    // Export saved report using backend API
                    const response = await prReportApi.exportPRReport(selectedReportForExport._id, exportFormat);
                    const blob = await response.blob();
                    const contentDisposition = response.headers.get('Content-Disposition');
                    const filename = contentDisposition
                      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
                      : `pr-report-${selectedReportForExport._id}.${exportFormat}`;
                    downloadFile(blob, filename);
                  } else {
                    // Export current report using local function
                    const analysisText = templateReport || "No report data available.";
                    await exportData(analysisText, exportFormat);
                  }
                } catch (error) {
                  console.error('Export failed:', error);
                  alert('Export failed. Please try again.');
                } finally {
                  setExportingReport(false);
                  setShowExportModal(false);
                  setSelectedReportForExport(null);
                }
              }}
              disabled={exportingReport}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {exportingReport ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PrExport;