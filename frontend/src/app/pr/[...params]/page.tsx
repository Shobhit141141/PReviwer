"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  GitPullRequest,
  GitCommit,
  Calendar,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Minus,
  GitBranch,
  Tag,
  AlertCircle,
  Sparkles,
  GitMerge,
  Loader,
  CircleX,
  Save,
  Download,
  Trash2,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/utils/formatDate';
import { githubApi, playgroundApi, prReportApi } from '@/lib/api';
import { PRDetailsType, Report } from '@/types';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import { marked } from "marked"
import { toast } from 'react-hot-toast';
import { ClearSpecificPRButton } from '@/components/RefreshButton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';



export default function PRDetailsPage() {
  const params = useParams<{ params?: string[] }>().params;
  const router = useRouter();

  // State variables
  const [prData, setPrData] = useState<PRDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [templateReport, setTemplateReport] = useState<string | null>(null);
  const [savedReports, setSavedReports] = useState<{ totalReports: number; reports: Report[] }>({ totalReports: 0, reports: [] });
  const [savingReport, setSavingReport] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [exportingReport, setExportingReport] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedReportForExport, setSelectedReportForExport] = useState<Report | null>(null);
  const [reportTitle, setReportTitle] = useState('');
  const [showSavedReports, setShowSavedReports] = useState(false);
  const [playgroundConfig, setPlaygroundConfig] = useState<{
    provider: string;
    model: string;
    systemPrompt: string;
    userPrompt: string;
    maxTokens?: number;
    temperature?: number;
  } | null>(null);

  // Get PR identifier
  const prIdentifier = params ? `${params[0]}:${params[1]}:${params[2]}` : '';

  // Fetch PR details function
  const fetchPRDetails = React.useCallback(async () => {
    try {
      const [owner, repo, prId] = params || [];
      if (!owner || !repo || !prId) {
        setError("Invalid PR URL");
        router.push('/');
        return;
      }

      const data = await githubApi.getPRDetails(owner, repo, prId);
      setPrData(data);

      // Check if saved reports exist and load them
      try {
        const reports = await prReportApi.getPRReports(prIdentifier);
        setSavedReports({ totalReports: reports.totalReports, reports: reports.reports });
        console.log('Saved reports:', reports);
      } catch (error) {
        console.log('No saved reports found', error);
        setSavedReports({ totalReports: 0, reports: [] });
      }
    } catch (err: unknown) {
      console.error('Error fetching PR details:', err);
      setError((err as { message?: string }).message || 'Failed to fetch PR details');
    } finally {
      setLoading(false);
    }
  }, [params, prIdentifier, router]);

  // Fetch PR details
  useEffect(() => {
    if (params) {
      fetchPRDetails();
    }
  }, [params, prIdentifier, router, fetchPRDetails]);

  const handlePRCacheRefresh = async () => {
    if (params && params.length >= 3) {
      setLoading(true);
      await fetchPRDetails();
    }
  };

  // Helper functions
  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'open':
        return <GitPullRequest className="w-5 h-5 text-green-500" />;
      case 'closed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'merged':
        return <CheckCircle className="w-5 h-5 text-purple-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'open':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'closed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'merged':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const getMergeStatus = () => {
    if (!prData || !prData.can_merge) {
      return {
        icon: <XCircle className="w-5 h-5 text-red-500" />,
        text: "Cannot merge",
        color: "bg-red-500/20 text-red-400 border-red-500/30",
        description: "This PR has conflicts that need to be resolved"
      };
    }

    if (prData.merge_conflict) {
      return {
        icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
        text: "Has conflicts",
        color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        description: "Merge conflicts detected, manual resolution required"
      };
    }

    return {
      icon: <GitMerge className="w-5 h-5 text-green-500" />,
      text: "Ready to merge",
      color: "bg-green-500/20 text-green-400 border-green-500/30",
      description: "No conflicts detected, safe to merge"
    };
  };

  // const getScoreColor = (score: number) => {
  //   if (score >= 9) return "text-green-400";
  //   if (score >= 7) return "text-yellow-400";
  //   return "text-red-400";
  // };

  // const getRiskColor = (risk: string) => {
  //   switch (risk.toLowerCase()) {
  //     case 'low': return "text-green-400";
  //     case 'medium': return "text-yellow-400";
  //     case 'high': return "text-red-400";
  //     default: return "text-gray-400";
  //   }
  // };

  // Action handlers
  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      const res = await playgroundApi.generateTemplatedAnalysis({
        prData: {
          title: prData?.title || '',
          description: prData?.description || '',
          author: prData?.author.login || '',
          state: prData?.state || '',
          files_changed: prData?.files || [],
          additions: prData?.stats.additions || 0,
          deletions: prData?.stats.deletions || 0,
          commits: prData?.commits || [],
          labels: prData?.labels || [],
          merge_status: prData?.can_merge || false,
        },
        validateOnly: false
      });
      setTemplateReport(res.analysis);
      setPlaygroundConfig({
        provider: res.metadata.provider,
        model: res.metadata.model,
        systemPrompt: res.metadata.systemPrompt,
        userPrompt: res.metadata.userPrompt,
        temperature: res.metadata.temperature,
        maxTokens: res.metadata.maxTokens,
      });
      setShowReport(true);
    } catch (error) {
      console.error("Error generating report:", error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleSaveReport = async () => {
    if (!prData || !templateReport) {
      alert('No report data to save');
      return;
    }

    try {
      setSavingReport(true);
      const savedReport = await prReportApi.savePRReport({
        prIdentifier,
        analysisReport: templateReport,
        prMetadata: {
          title: prData.title,
          number: prData.number,
          owner: params?.[0] || '',
          repo: params?.[1] || '',
          author: prData.author.login,
          state: prData.state,
          created_at: prData.created_at,
          url: `https://github.com/${params?.[0]}/${params?.[1]}/pull/${params?.[2]}`
        },
        reportTitle: reportTitle || `PR Analysis - ${new Date().toLocaleDateString()}`,
        playgroundConfig: playgroundConfig || undefined,
      });

      // update the client state after saving 
      setSavedReports(prev => ({
        totalReports: prev.totalReports + 1,
        reports: [savedReport, ...prev.reports]
      }));

      setReportTitle(''); // Clear title after saving
      toast.success('Report saved successfully!');
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Failed to save report. Please try again.');
    } finally {
      setSavingReport(false);
    }
  };


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


  const handleDeleteSavedReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this saved report?')) {
      return;
    }

    try {
      await prReportApi.deletePRReport(reportId);
      // Refresh saved reports list
      const reports = await prReportApi.getPRReports(prIdentifier);
      if (Array.isArray(reports)) {
        setSavedReports({ totalReports: reports.length, reports });
      } else {
        setSavedReports({ totalReports: 0, reports: [] });
      }
      alert('Report deleted successfully!');
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report. Please try again.');
    }
  };

  const mergeStatus = getMergeStatus();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white pt-20">
        {/* Background Effects */}
        <div className="fixed pointer-events-none top-[10%] left-[5%] w-[400px] h-[400px] bg-purple-500 rounded-full blur-[160px] opacity-50"></div>
        <div className="fixed pointer-events-none top-[20%] right-[5%] w-[300px] h-[300px] bg-pink-500 rounded-full blur-[140px] opacity-35"></div>
        <div className="fixed pointer-events-none bottom-[15%] left-[20%] w-[350px] h-[350px] bg-blue-500 rounded-full blur-[150px] opacity-30"></div>

        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-gray-700 hover:bg-gray-800"
            >
              ← Back
            </Button>
            <Loader className="w-5 h-5 animate-spin" />
            <span>Loading PR details...</span>
          </div>

          <div className="space-y-6">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-6">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !prData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white pt-20">
        {/* Background Effects */}
        <div className="fixed pointer-events-none top-[10%] left-[5%] w-[400px] h-[400px] bg-purple-500 rounded-full blur-[160px] opacity-50"></div>
        <div className="fixed pointer-events-none top-[20%] right-[5%] w-[300px] h-[300px] bg-pink-500 rounded-full blur-[140px] opacity-35"></div>
        <div className="fixed pointer-events-none bottom-[15%] left-[20%] w-[350px] h-[350px] bg-blue-500 rounded-full blur-[150px] opacity-30"></div>

        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-gray-700 hover:bg-gray-800"
            >
              ← Back
            </Button>
          </div>

          <div className="flex items-center justify-center min-h-[50vh]">
            <Card className="border-gray-800 bg-gray-900/50 max-w-md w-full" id="glassmorphism">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Failed to Load PR</h2>
                <p className="text-gray-400 mb-4">
                  {error || 'Could not fetch PR details. Please try again.'}
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-20">
      {/* Background Effects */}
      <div className="fixed pointer-events-none top-[10%] left-[5%] w-[400px] h-[400px] bg-purple-500 rounded-full blur-[160px] opacity-50"></div>
      <div className="fixed pointer-events-none top-[20%] right-[5%] w-[300px] h-[300px] bg-pink-500 rounded-full blur-[140px] opacity-35"></div>
      <div className="fixed pointer-events-none bottom-[15%] left-[20%] w-[350px] h-[350px] bg-blue-500 rounded-full blur-[150px] opacity-30"></div>

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="border-gray-700 hover:bg-gray-800"
              >
                ← Back
              </Button>
              <div className="flex items-center gap-2">
                {getStatusIcon(prData.state)}
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(prData.state)}`}>
                  {prData.state.charAt(0).toUpperCase() + prData.state.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {mergeStatus.icon}
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${mergeStatus.color}`}>
                  {mergeStatus.text}
                </span>
              </div>
            </div>
            {params && params.length >= 3 && (
              <Tooltip >
                <TooltipTrigger>

                  <ClearSpecificPRButton
                    owner={params[0]}
                    repo={params[1]}
                    prNumber={params[2]}
                    onClearComplete={handlePRCacheRefresh}
                    className="h-8 px-3 text-xs"
                  />
                </TooltipTrigger>
                <TooltipContent side='bottom'>
                  Clear PR Cache
                </TooltipContent>
              </Tooltip>

            )}
          </div>

          <h1 className="text-3xl font-bold mb-2">
            {prData.title} <span className="text-gray-400">#{prData.number}</span>
          </h1>

          <div className="flex items-center gap-4 text-gray-400">
            <div className="flex items-center gap-2">
              <img
                src={prData.author.avatar_url}
                alt={prData.author.name}
                className="w-6 h-6 rounded-full"
              />
              <span>{prData.author.name || prData.author.login}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Created {formatDate(prData.created_at)}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <GitBranch className="w-4 h-4" />
              <span>{prData.head.ref} → {prData.base.ref}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content */}
          {!showReport ? (
            <div className="xl:col-span-2 space-y-6">
              {/* Description */}
              <Card className="border-gray-800 bg-gray-900/50" id="glassmorphism">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">
                    {prData.description || "No description provided."}
                  </p>
                </CardContent>
              </Card>

              {/* Merge Status Details */}
              <Card className="border-gray-800 bg-gray-900/50" id="glassmorphism">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitMerge className="w-5 h-5" />
                    Merge Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 p-4 bg-black/17 rounded-lg">
                    {mergeStatus.icon}
                    <div>
                      <p className="font-medium">{mergeStatus.text}</p>
                      <p className="text-sm text-gray-400">{mergeStatus.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Files Changed */}
              <Card className="border-gray-800 bg-gray-900/50" id="glassmorphism">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Files Changed ({prData.stats.changed_files})
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-green-400">
                        <Plus className="w-4 h-4" />
                        {prData.stats.additions}
                      </span>
                      <span className="flex items-center gap-1 text-red-400">
                        <Minus className="w-4 h-4" />
                        {prData.stats.deletions}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {prData.files.slice(0, 5).map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-black/17 rounded-lg">
                        <span className="text-sm font-mono">{file.filename}</span>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-green-400">+{file.additions}</span>
                          <span className="text-red-400">-{file.deletions}</span>
                        </div>
                      </div>
                    ))}
                    {prData.files.length > 5 && (
                      <div className="text-center py-2">
                        <span className="text-gray-400 text-sm">
                          And {prData.files.length - 5} more files...
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Commits */}
              <Card className="border-gray-800 bg-gray-900/50" id="glassmorphism">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitCommit className="w-5 h-5" />
                    Commits ({prData.stats.commits})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {prData.commits.slice(0, 5).map((commit) => (
                      <div key={commit.sha} className="flex items-start gap-3 p-3 bg-black/17 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{commit.message.split('\n')[0]}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <img
                              src={commit.author.avatar_url || '/default-avatar.png'}
                              alt={commit.author.name}
                              className="w-4 h-4 rounded-full"
                            />
                            <p className="text-xs text-gray-400">
                              {formatDate(commit.date)} by {commit.author.name || commit.author.login}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {prData.commits.length > 5 && (
                      <div className="text-center py-2">
                        <span className="text-gray-400 text-sm">
                          And {prData.commits.length - 5} more commits...
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="xl:col-span-2 space-y-6">
              <div className='flex items-center justify-between mb-4'>
                <Button onClick={() => {
                  setShowReport(false);
                  setTemplateReport(null);
                  setReportTitle('');
                  setShowExportModal(false);
                  setShowSavedReports(false);
                  setGeneratingReport(false);
                  setSavingReport(false);
                }} variant="outline">
                  <CircleX className="w-4 h-4 mr-2" /> Close Report
                </Button>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold">AI Analysis Report</span>
                </div>
              </div>

              {/* Enhanced Report Display */}
              <Card className="border-gray-800 bg-gray-900/50" id="glassmorphism">
                <CardContent className="p-6">
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown>
                      {templateReport || "No report data available."}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enhanced AI Analysis Card */}
            <Card className="border-gray-800 bg-gray-900/50" id="glassmorphism">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleGenerateReport}
                  disabled={generatingReport}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  {generatingReport ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>

                {templateReport && (
                  <>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Report title (optional)"
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                      />

                      <Button
                        onClick={handleSaveReport}
                        disabled={savingReport}
                        variant="outline"
                        className="w-full border-green-500 text-green-400 hover:bg-green-500/10"
                      >
                        {savingReport ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Report
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={() => setShowExportModal(true)}
                        variant="outline"
                        className="w-full border-blue-500 text-blue-400 hover:bg-blue-500/10"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Current Report
                      </Button>


                    </div>
                  </>
                )}
                {savedReports.totalReports > 0 && (
                  <Button
                    onClick={() => setShowSavedReports(!showSavedReports)}
                    variant="outline"
                    className="w-full border-purple-500 text-purple-400 hover:bg-purple-500/10"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    View Saved Reports ({savedReports.totalReports})
                  </Button>
                )}
                <p className="text-xs text-gray-400 text-center">
                  Get AI-powered analysis and suggestions for this PR
                </p>
              </CardContent>
            </Card>

            {/* PR Stats */}
            <Card className="border-gray-800 bg-gray-900/50" id="glassmorphism">
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Commits</span>
                  <span className="font-semibold">{prData.stats.commits}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Files changed</span>
                  <span className="font-semibold">{prData.stats.changed_files}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Comments</span>
                  <span className="font-semibold">{prData.stats.comments}</span>
                </div>
                <Separator className="bg-gray-700" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-400">Additions</span>
                  <span className="font-semibold text-green-400">+{prData.stats.additions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-400">Deletions</span>
                  <span className="font-semibold text-red-400">-{prData.stats.deletions}</span>
                </div>
              </CardContent>
            </Card>

            {/* Labels */}
            {prData.labels.length > 0 && (
              <Card className="border-gray-800 bg-gray-900/50" id="glassmorphism">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Labels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {prData.labels.map((label) => (
                      <Badge
                        key={label.name}
                        className="px-3 py-1"
                        style={{
                          backgroundColor: `#${label.color}30`,
                          color: `#${label.color}`,
                          borderColor: `#${label.color}50`
                        }}
                      >
                        {label.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviewers & Assignees */}
            <Card className="border-gray-800 bg-gray-900/50" id="glassmorphism">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  People
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {prData.assignees.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Assignees</h4>
                    <div className="flex flex-wrap gap-2">
                      {prData.assignees.map((assignee) => (
                        <div key={assignee.login} className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg">
                          <img
                            src={assignee.avatar_url}
                            alt={assignee.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm">{assignee.login}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {prData.reviewers.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Reviewers</h4>
                    <div className="flex flex-wrap gap-2">
                      {prData.reviewers.map((reviewer) => (
                        <div key={reviewer.login} className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg">
                          <img
                            src={reviewer.avatar_url}
                            alt={reviewer.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm">{reviewer.login}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Saved Reports Section */}
      {showSavedReports && savedReports.totalReports > 0 && (
        <div className="container mx-auto px-6 py-8">
          <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                Saved Reports ({savedReports.totalReports})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {savedReports.reports.map((report, index) => (
                  <div key={report._id} className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {report.reportTitle || `Report #${index + 1}`}
                        </h3>
                        <p className="text-sm text-gray-400">
                          Created: {new Date(report.createdAt || report.updatedAt).toLocaleString()}
                        </p>
                        {report.playgroundConfig && (
                          <div className="mt-2 text-xs text-gray-500">
                            <span className="inline-block bg-blue-500/20 text-blue-400 px-2 py-1 rounded mr-2">
                              {report.playgroundConfig.provider}
                            </span>
                            <span className="inline-block bg-green-500/20 text-green-400 px-2 py-1 rounded">
                              {report.playgroundConfig.model}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            
                            setSelectedReportForExport(report as Report);
                            setShowExportModal(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Export
                        </Button>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={() => handleDeleteSavedReport(report._id)}
                              variant="outline"
                              size="sm"
                              className="border-red-500 text-red-400 hover:bg-red-500/10"
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
                    </div>

                    {report.playgroundConfig && (
                      <div className="mt-3 p-3 bg-gray-900/50 rounded border border-gray-600">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Playground Configuration</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400">Provider:</span>
                            <span className="ml-2 text-white">{report.playgroundConfig.provider}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Model:</span>
                            <span className="ml-2 text-white">{report.playgroundConfig.model}</span>
                          </div>
                          {report.playgroundConfig.systemPrompt && (
                            <div className="col-span-2">
                              <span className="text-gray-400">System Prompt:</span>
                              <p className="mt-1 text-white text-xs bg-gray-800 p-2 rounded max-h-20 overflow-y-auto">
                                {report.playgroundConfig.systemPrompt}
                              </p>
                            </div>
                          )}
                          {report.playgroundConfig.userPrompt && (
                            <div className="col-span-2">
                              <span className="text-gray-400">User Prompt:</span>
                              <p className="mt-1 text-white text-xs bg-gray-800 p-2 rounded max-h-20 overflow-y-auto">
                                {report.playgroundConfig.userPrompt}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export Modal */}
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
    </div>
  );
}
