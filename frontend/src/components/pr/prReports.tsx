import { BookOpen, Download, Trash2, ChevronDown, GitCommit, Sparkles, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { Button } from "../ui/button";
import { Report } from "@/types";
import React, { useState } from "react";

interface SavedReports {
  totalReports: number;
  reports: Report[];
}

interface PrReportProps {
  savedReports: SavedReports;
  setSelectedReportForExport: React.Dispatch<React.SetStateAction<Report | null>>;
  setShowExportModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleDeleteSavedReport: (id: string) => void;
}

function PrReport({
  savedReports,
  setSelectedReportForExport,
  setShowExportModal,
  handleDeleteSavedReport
}: PrReportProps) {
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  return (
    <div className="h-full overflow-y-auto pr-2 space-y-4">
      {savedReports.reports.map((report, index) => {
        const isExpanded = expandedReport === report._id;

        return (
          <Card key={report._id} className="bg-gray-800/60 border-gray-700 mx-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg text-white">
                  {report.reportTitle || `Report #${index + 1}`}
                </CardTitle>
                <p className="text-xs text-gray-400">
                  Created:{" "}
                  {new Date(report.createdAt || report.updatedAt || "").toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2">

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => {
                        setSelectedReportForExport(report as Report);
                        setShowExportModal(true);
                      }}
                      variant="secondary"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 flex items-center"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export Report</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => handleDeleteSavedReport(report._id)}
                      variant="secondary"
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete Report</p>
                  </TooltipContent>
                </Tooltip>


              </div>
            </CardHeader>

            <CardContent>
              {report.playgroundConfig && (
                <div className="mt-2">
                  <button
                    onClick={() => setExpandedReport(isExpanded ? null : report._id)}
                    className="flex items-center justify-between w-full text-sm text-gray-300 hover:text-white font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-400" />
                      Playground Configuration
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="mt-3 p-3 bg-gray-900/60 rounded-lg border border-gray-700 space-y-3 text-sm">
                      <div className="flex gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                          <BookOpen className="w-3 h-3" /> {report.playgroundConfig.provider}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-1 rounded">
                          <Sparkles className="w-3 h-3" /> {report.playgroundConfig.model}
                        </span>
                      </div>

                      {report.playgroundConfig.systemPrompt && (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-400 mt-1" />
                          <div className="flex-1">
                            <span className="text-gray-400 text-xs">System Prompt:</span>
                            <p className="mt-1 text-white text-xs bg-gray-800 p-2 rounded max-h-24 overflow-y-auto">
                              {report.playgroundConfig.systemPrompt}
                            </p>
                          </div>
                        </div>
                      )}

                      {report.playgroundConfig.userPrompt && (
                        <div className="flex items-start gap-2">
                          <GitCommit className="w-4 h-4 text-blue-400 mt-1" />
                          <div className="flex-1">
                            <span className="text-gray-400 text-xs">User Prompt:</span>
                            <p className="mt-1 text-white text-xs bg-gray-800 p-2 rounded max-h-24 overflow-y-auto">
                              {report.playgroundConfig.userPrompt.length > 350
                                ? report.playgroundConfig.userPrompt.slice(0, 350) + "..."
                                : report.playgroundConfig.userPrompt}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default PrReport;
