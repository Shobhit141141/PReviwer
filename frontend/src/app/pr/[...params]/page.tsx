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
  Shield,
  Zap,
  TrendingUp,
  Bug,
  Code,
  Loader
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/utils/formatDate';
import { githubApi, playgroundApi } from '@/lib/api';
import { PRDetailsType } from '@/types';
import ReactMarkdown from 'react-markdown';
// Mock PR Report Data
type MockPRReport = {
  summary: {
    score: number;
    complexity: string;
    risk_level: string;
    estimated_review_time: string;
  };
  analysis: {
    code_quality: {
      score: number;
      issues: string[];
      strengths: string[];
    };
    security: {
      score: number;
      vulnerabilities: string[];
      recommendations: string[];
    };
    performance: {
      score: number;
      concerns: string[];
      optimizations: string[];
    };
  };
  files_analysis: Array<{
    filename: string;
    changes: { additions: number; deletions: number };
    complexity: string;
    issues: string[];
    rating: number;
  }>;
  recommendations: string[];
};

export default function PRDetailsPage() {
  const params = useParams<{ params?: string[] }>().params
  const router = useRouter();

  const [prData, setPrData] = useState<PRDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [reportData, setReportData] = useState<MockPRReport | null>(null);
  const [generatingReport, ] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [templateReport, setTemplateReport] = useState<string | null>(null);
  useEffect(() => {
    const fetchPRDetails = async () => {
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
    };

    if (params) {
      fetchPRDetails();
    }
  }, [params]);

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
  const handleGenerateReport = async () => {
    try {
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
      setShowReport(true);
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };



  const getScoreColor = (score: number) => {
    if (score >= 9) return "text-green-400";
    if (score >= 7) return "text-yellow-400";
    return "text-red-400";
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return "text-green-400";
      case 'medium': return "text-yellow-400";
      case 'high': return "text-red-400";
      default: return "text-gray-400";
    }
  };

  const mergeStatus = getMergeStatus();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
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

  if (error || !prData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Background Effects */}
      <div className="fixed pointer-events-none top-[10%] left-[5%] w-[400px] h-[400px] bg-purple-500 rounded-full blur-[160px] opacity-50"></div>
      <div className="fixed pointer-events-none top-[20%] right-[5%] w-[300px] h-[300px] bg-pink-500 rounded-full blur-[140px] opacity-35"></div>
      <div className="fixed pointer-events-none bottom-[15%] left-[20%] w-[350px] h-[350px] bg-blue-500 rounded-full blur-[150px] opacity-30"></div>

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
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

          {!showReport ? (<div className="xl:col-span-2 space-y-6">
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
                  {prData.description}
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
                      +{prData.stats.additions}
                    </span>
                    <span className="flex items-center gap-1 text-red-400">
                      <Minus className="w-4 h-4" />
                      -{prData.stats.deletions}
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
          </div>) : (
            <div className="xl:col-span-2 space-y-6">
              <div className='flex items-center justify-between mb-4'>
                <Button onClick={() => setShowReport(false)}>Show Report</Button>
                <span>PR Report</span>
              </div>
              <ReactMarkdown>
                {templateReport || "No report data available."}
              </ReactMarkdown>
            </div>
          )}

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Generate PR Report */}
            <Card className="border-gray-800 bg-gray-900/50" id="glassmorphism">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant={"default"}
                  className="w-full mb-2 cursor-pointer"
                  onClick={() => handleGenerateReport()}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate PR Report
                </Button>
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                  onClick={() => setShowGenerateModal(true)}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate PR Report
                </Button>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Get AI-powered analysis and suggestions
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

            {/* Reviewers & Assignees */}
            <Card className="border-gray-800 bg-gray-900/50" id="glassmorphism">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  People
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* PR Report Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="w-max max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="w-6 h-6 text-purple-400" />
              AI PR Analysis Report
            </DialogTitle>
          </DialogHeader>

          {!reportData ? (
            <div className="space-y-6">
              <div className="text-center py-8">
                <Button
                  onClick={handleGenerateReport}
                  disabled={generatingReport}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg"
                >
                  {generatingReport ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing PR...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Analysis Report
                    </>
                  )}
                </Button>
                <p className="text-gray-400 mt-4">
                  Click to generate a comprehensive AI analysis of this pull request
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-gray-800 bg-gray-800/50">
                  <CardContent className="p-4 text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(reportData.summary.score)}`}>
                      {reportData.summary.score}/10
                    </div>
                    <div className="text-sm text-gray-400">Overall Score</div>
                  </CardContent>
                </Card>
                <Card className="border-gray-800 bg-gray-800/50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">{reportData.summary.complexity}</div>
                    <div className="text-sm text-gray-400">Complexity</div>
                  </CardContent>
                </Card>
                <Card className="border-gray-800 bg-gray-800/50">
                  <CardContent className="p-4 text-center">
                    <div className={`text-2xl font-bold ${getRiskColor(reportData.summary.risk_level)}`}>
                      {reportData.summary.risk_level}
                    </div>
                    <div className="text-sm text-gray-400">Risk Level</div>
                  </CardContent>
                </Card>
                <Card className="border-gray-800 bg-gray-800/50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400">{reportData.summary.estimated_review_time}</div>
                    <div className="text-sm text-gray-400">Review Time</div>
                  </CardContent>
                </Card>
              </div>

              {/* Analysis Sections */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Code Quality */}
                <Card className="border-gray-800 bg-gray-800/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="w-5 h-5 text-blue-400" />
                      Code Quality
                      <span className={`ml-auto text-sm ${getScoreColor(reportData.analysis.code_quality.score)}`}>
                        {reportData.analysis.code_quality.score}/10
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-green-400 mb-2">Strengths</h4>
                      <ul className="space-y-1">
                        {reportData.analysis.code_quality.strengths.map((strength, idx) => (
                          <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {reportData.analysis.code_quality.issues.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-yellow-400 mb-2">Issues</h4>
                        <ul className="space-y-1">
                          {reportData.analysis.code_quality.issues.map((issue, idx) => (
                            <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                              <AlertCircle className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Security */}
                <Card className="border-gray-800 bg-gray-800/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-400" />
                      Security
                      <span className={`ml-auto text-sm ${getScoreColor(reportData.analysis.security.score)}`}>
                        {reportData.analysis.security.score}/10
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {reportData.analysis.security.vulnerabilities.length === 0 ? (
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        No vulnerabilities detected
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-sm font-medium text-red-400 mb-2">Vulnerabilities</h4>
                        <ul className="space-y-1">
                          {reportData.analysis.security.vulnerabilities.map((vuln, idx) => (
                            <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                              <AlertCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                              {vuln}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-medium text-blue-400 mb-2">Recommendations</h4>
                      <ul className="space-y-1">
                        {reportData.analysis.security.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                            <TrendingUp className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance */}
                <Card className="border-gray-800 bg-gray-800/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      Performance
                      <span className={`ml-auto text-sm ${getScoreColor(reportData.analysis.performance.score)}`}>
                        {reportData.analysis.performance.score}/10
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {reportData.analysis.performance.concerns.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-yellow-400 mb-2">Concerns</h4>
                        <ul className="space-y-1">
                          {reportData.analysis.performance.concerns.map((concern, idx) => (
                            <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                              <AlertCircle className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                              {concern}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-medium text-green-400 mb-2">Optimizations</h4>
                      <ul className="space-y-1">
                        {reportData.analysis.performance.optimizations.map((opt, idx) => (
                          <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                            <TrendingUp className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                            {opt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* File Analysis */}
              <Card className="border-gray-800 bg-gray-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    File Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.files_analysis.map((file, idx) => (
                      <div key={idx} className="p-4 bg-gray-900/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm text-blue-400">{file.filename}</span>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-green-400">+{file.changes.additions}</span>
                            <span className="text-red-400">-{file.changes.deletions}</span>
                            <span className={`${getScoreColor(file.rating)}`}>
                              {file.rating}/10
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {file.complexity} Complexity
                          </Badge>
                        </div>
                        {file.issues.length > 0 && (
                          <ul className="space-y-1">
                            {file.issues.map((issue, issueIdx) => (
                              <li key={issueIdx} className="text-xs text-gray-300 flex items-start gap-2">
                                <Bug className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card className="border-gray-800 bg-gray-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reportData.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-gray-900/30 rounded-lg">
                        <span className="text-lg">{rec.charAt(0)}</span>
                        <span className="text-sm text-gray-300">{rec.slice(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <Button
                  variant="outline"
                  onClick={() => setReportData(null)}
                  className="border-gray-700 hover:bg-gray-800"
                >
                  Generate New Report
                </Button>
                <Button
                  onClick={() => setShowGenerateModal(false)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Close Report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}