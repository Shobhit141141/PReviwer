"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { XCircle, AlertCircle, GitMerge, BookOpen } from 'lucide-react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/formatDate';
import { githubApi, playgroundApi, prReportApi } from '@/lib/api';
import { PRDetailsType, Report } from '@/types';
import { toast } from 'react-hot-toast';
import PrSkeleton from '@/components/skeletons/pr.skeleton';
import PrContent from '@/components/pr';
import PrReport from '@/components/pr/prReports';
import PrExport from '@/components/pr/prExport';
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";

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
  const prIdentifier = params ? `${params[0]}:${params[1]}:${params[2]}` : '';
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

    } catch (err: unknown) {
      console.error('Error fetching PR details:', err);
      setError((err as { message?: string }).message || 'Failed to fetch PR details');
    } finally {
      setLoading(false);
    }
  }, [params, router]);

  const fetchSavedReports = async () => {
    try {
      const reports = await prReportApi.getPRReports(prIdentifier);
      setSavedReports({ totalReports: reports.totalReports, reports: reports.reports });
      console.log('Saved reports:', reports);
    } catch (error) {
      console.log('No saved reports found', error);
      setSavedReports({ totalReports: 0, reports: [] });
    }
  };

  useEffect(() => {
    if (showSavedReports) {
      fetchSavedReports();
    }
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prIdentifier, showSavedReports]);

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

  const handleCommentOnPR = async (comment: string) => {
    const [owner, repo, prId] = params || [];
    if (!owner || !repo || !prId) {
      console.error("Missing required parameters");
      return;
    }

    try {
      await toast.promise(
        githubApi.commentOnPr(owner, repo, prId, comment),
        {
          loading: "Adding comment...",
          success: "Comment added successfully!",
          error: "Failed to add comment. Please try again.",
        }
      );
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };


  const mergeStatus = getMergeStatus();

  // Loading state
  if (loading) {
    return (
      <PrSkeleton />
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

      <div className="container mx-auto px-6 py-8 ">

        <PrContent prData={prData} showReport={showReport} templateReport={templateReport ?? undefined} reportTitle={reportTitle} savedReports={savedReports} generatingReport={generatingReport} savingReport={savingReport} mergeStatus={mergeStatus} showSavedReports={showSavedReports} setShowReport={setShowReport} setTemplateReport={setTemplateReport} setReportTitle={setReportTitle} setShowExportModal={setShowExportModal} setShowSavedReports={setShowSavedReports} setGeneratingReport={setGeneratingReport} setSavingReport={setSavingReport} handleGenerateReport={handleGenerateReport} handleSaveReport={handleSaveReport} handleCommentOnPR={handleCommentOnPR} formatDate={formatDate} handlePRCacheRefresh={handlePRCacheRefresh} params={{ params }} router={router} />
      </div>

      {/* Saved Reports Sheet */}
      <Sheet open={showSavedReports} onOpenChange={setShowSavedReports}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-black/10 backdrop-blur-md">
          <SheetHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              Saved Reports ({savedReports.totalReports})
            </CardTitle>
          </SheetHeader>
          {savedReports.totalReports > 0 ? (
            <PrReport
              savedReports={savedReports}
              setSelectedReportForExport={setSelectedReportForExport}
              setShowExportModal={setShowExportModal}
              handleDeleteSavedReport={handleDeleteSavedReport}
            />
          ) : (
            <p className="text-gray-400 mt-4">No saved reports available.</p>
          )}
        </SheetContent>
      </Sheet>


      {/* Export Modal */}
      <PrExport
        showExportModal={showExportModal}
        setShowExportModal={setShowExportModal}
        selectedReportForExport={selectedReportForExport}
        setSelectedReportForExport={setSelectedReportForExport}
        templateReport={templateReport}
      />
    </div>
  );
}
