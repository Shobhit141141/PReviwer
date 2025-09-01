import React from "react";
import {
  FileText, GitMerge, GitCommit, Plus, Minus, CircleX,
  BookOpen, Sparkles, Loader, Save, MessageCircleCode,
  Download, Tag, User,
  Calendar,
  GitBranch,
  GitPullRequest,
  XCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { ClearSpecificPRButton } from "../RefreshButton";
import { Button } from "../ui/button";
import { PRDetailsType } from "@/types";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import Image from "next/image";

interface PrContentProps {
  prData: PRDetailsType;
  showReport: boolean;
  templateReport?: string;
  reportTitle: string;
  savedReports: { totalReports: number };
  generatingReport: boolean;
  savingReport: boolean;
  mergeStatus: { icon: React.ReactNode; text: string; description: string; color: string };
  showSavedReports: boolean;
  setShowReport: (val: boolean) => void;
  setTemplateReport: (val: string | null) => void;
  setReportTitle: (val: string) => void;
  setShowExportModal: (val: boolean) => void;
  setShowSavedReports: (val: boolean) => void;
  setGeneratingReport: (val: boolean) => void;
  setSavingReport: (val: boolean) => void;
  handleGenerateReport: () => void;
  handleSaveReport: () => void;
  handleCommentOnPR: (report: string) => void;
  handlePRCacheRefresh: () => void;
  formatDate: (date: string) => string;
  router: AppRouterInstance;
  params: { [key: string]: string | string[] | undefined };

}

const PrContent: React.FC<PrContentProps> = ({
  prData,
  showReport,
  templateReport,
  reportTitle,
  savedReports,
  generatingReport,
  savingReport,
  mergeStatus,
  showSavedReports,
  setShowReport,
  setTemplateReport,
  setReportTitle,
  setShowExportModal,
  setShowSavedReports,
  setGeneratingReport,
  setSavingReport,
  handleGenerateReport,
  handleSaveReport,
  handleCommentOnPR,
  formatDate,
  handlePRCacheRefresh,
  router,
  params
}) => {
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

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

      <div className="xl:col-span-2 space-y-6">
        {/* Header */}
        <div className="xl:col-span-2">
          <div className="flex justify-between mb-4">
            <div className="flex items-center gap-4">
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
            <Tooltip>
              <TooltipTrigger>
                <ClearSpecificPRButton
                  owner={params[0] as string}
                  repo={params[1] as string}
                  prNumber={params[2] as string}
                  onClearComplete={handlePRCacheRefresh}
                  className="h-8 px-3 text-xs"
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">Clear PR Cache</TooltipContent>
            </Tooltip>
          </div>

          <h1 className="text-3xl font-bold mb-2">
            {prData.title} <span className="text-gray-400">#{prData.number}</span>
          </h1>

          <div className="flex items-center gap-4 text-gray-400">
            <div className="flex items-center gap-2">
              <Image
                src={prData.author.avatar_url}
                alt={prData.author.name}
                className="w-6 h-6 rounded-full"
                width={24}
                height={24}
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

        {!showReport ? (
          <div className="space-y-6">
            {/* Description */}
            <div className="border border-gray-800 bg-black/40 rounded-xl p-6">
              <div className="flex items-center gap-2 font-semibold mb-4">
                <FileText className="w-5 h-5" /> Description
              </div>
              <p className="text-gray-300 leading-relaxed break-words whitespace-pre-wrap">
                {prData.description || "No description provided."}
              </p>
            </div>

            {/* Merge Status */}
            <div className="border border-gray-800 bg-black/40 rounded-xl p-6">
              <div className="flex items-center gap-2 font-semibold mb-4">
                <GitMerge className="w-5 h-5" /> Merge Status
              </div>
              <div className="flex items-center gap-3 p-4 bg-black/60 rounded-lg">
                {mergeStatus.icon}
                <div>
                  <p className="font-medium">{mergeStatus.text}</p>
                  <p className="text-sm text-gray-400 break-words">{mergeStatus.description}</p>
                </div>
              </div>
            </div>

            {/* Files Changed */}
            <div className="border border-gray-800 bg-black/40 rounded-xl p-6">
              <div className="flex items-center justify-between font-semibold mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Files Changed ({prData.stats.changed_files})
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-green-400">
                    <Plus className="w-3 h-3" />{prData.stats.additions}
                  </span>
                  <span className="flex items-center gap-1 text-red-400">
                    <Minus className="w-3 h-3" />{prData.stats.deletions}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {prData.files.slice(0, 5).map((file, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-black/60 rounded-lg">
                    <span className="text-sm font-mono break-all max-w-[70%]">{file.filename}</span>
                    <div className="flex gap-2 text-xs">
                      <span className="text-green-400">+{file.additions}</span>
                      <span className="text-red-400">-{file.deletions}</span>
                    </div>
                  </div>
                ))}
                {prData.files.length > 5 && (
                  <div className="text-center text-sm text-gray-400">
                    And {prData.files.length - 5} more files...
                  </div>
                )}
              </div>
            </div>

            {/* Commits */}
            <div className="border border-gray-800 bg-black/40 rounded-xl p-6">
              <div className="flex items-center gap-2 font-semibold mb-4">
                <GitCommit className="w-5 h-5" /> Commits ({prData.stats.commits})
              </div>
              <div className="space-y-3">
                {prData.commits.slice(0, 5).map((commit) => (
                  <div key={commit.sha} className="flex gap-3 p-3 bg-black/60 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium break-words">
                        {commit.message.split("\n")[0]}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Image
                          src={commit.author.avatar_url || "/default-avatar.png"}
                          alt={commit.author.name}
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          width={16}
                          height={16}
                        />
                        <p className="text-xs text-gray-400 truncate">
                          {formatDate(commit.date)} by {commit.author.name || commit.author.login}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {prData.commits.length > 5 && (
                  <div className="text-center text-sm text-gray-400">
                    And {prData.commits.length - 5} more commits...
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Report Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  setShowReport(false);
                  setTemplateReport(null);
                  setReportTitle("");
                  setShowExportModal(false);
                  setShowSavedReports(false);
                  setGeneratingReport(false);
                  setSavingReport(false);
                }}
                className="flex items-center px-3 py-2 border rounded-md text-gray-200 border-gray-600"
              >
                <CircleX className="w-4 h-4 mr-2" /> Close Report
              </button>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <span className="font-semibold">AI Analysis Report</span>
              </div>
            </div>

            {/* Report Content */}
            <div className="border border-gray-800 bg-black/40 rounded-xl p-6 overflow-hidden">
              <div className="prose prose-invert max-w-none break-words whitespace-pre-wrap overflow-auto">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    code: ({ className, children, ...props }) => (
                      <code className={`${className} break-words whitespace-pre-wrap`} {...props}>
                        {children}
                      </code>
                    ),
                    pre: ({ children, ...props }) => (
                      <pre className="overflow-x-auto bg-gray-800 p-3 rounded-md my-2" {...props}>
                        {children}
                      </pre>
                    ),
                  }}
                >
                  {templateReport || "No report data available."}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>



      <div className="space-y-6">
        {/* Enhanced AI Analysis */}
        <div className="border border-gray-800 bg-black/40 rounded-xl p-6" id="glassmorphism">
          <div className="flex items-center gap-2 font-semibold mb-4">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Analysis
          </div>

          <div className="space-y-3">
            <button
              onClick={handleGenerateReport}
              disabled={generatingReport}
              className="w-full flex items-center justify-center px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium disabled:opacity-50"
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
            </button>

            {templateReport && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Report title (optional)"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                />

                <button
                  onClick={handleSaveReport}
                  disabled={savingReport}
                  className="w-full flex items-center justify-center px-4 py-2 rounded-md border border-green-500 text-green-400 hover:bg-green-500/10 font-medium disabled:opacity-50"
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
                </button>

                <button
                  onClick={() => handleCommentOnPR(templateReport)}
                  className="w-full flex items-center justify-center px-4 py-2 rounded-md border border-orange-500 text-orange-400 hover:bg-orange-500/10 font-medium"
                >
                  <MessageCircleCode className="w-4 h-4 mr-2" />
                  Comment on PR
                </button>

                <button
                  onClick={() => setShowExportModal(true)}
                  className="w-full flex items-center justify-center px-4 py-2 rounded-md border border-blue-500 text-blue-400 hover:bg-blue-500/10 font-medium"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Current Report
                </button>
              </div>
            )}

            {savedReports.totalReports > 0 && (
              <button
                onClick={() => setShowSavedReports(!showSavedReports)}
                className="w-full flex items-center justify-center px-4 py-2 rounded-md border border-purple-500 text-purple-400 hover:bg-purple-500/10 font-medium"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                View Saved Reports ({savedReports.totalReports})
              </button>
            )}

            <p className="text-xs text-gray-400 text-center">
              Get AI-powered analysis and suggestions for this PR
            </p>
          </div>
        </div>

        {/* PR Stats */}
        <div className="border border-gray-800 bg-black/40 rounded-xl p-6" id="glassmorphism">
          <div className="font-semibold mb-4">Statistics</div>
          <div className="space-y-4">
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

            <div className="border-t border-gray-700 my-2" />

            <div className="flex justify-between items-center">
              <span className="text-sm text-green-400">Additions</span>
              <span className="font-semibold text-green-400">+{prData.stats.additions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-red-400">Deletions</span>
              <span className="font-semibold text-red-400">-{prData.stats.deletions}</span>
            </div>
          </div>
        </div>

        {/* Labels */}
        {prData.labels.length > 0 && (
          <div className="border border-gray-800 bg-black/40 rounded-xl p-6" id="glassmorphism">
            <div className="flex items-center gap-2 font-semibold mb-4">
              <Tag className="w-5 h-5" />
              Labels
            </div>
            <div className="flex flex-wrap gap-2">
              {prData.labels.map((label) => (
                <span
                  key={label.name}
                  className="px-3 py-1 text-sm rounded border break-words max-w-full"
                  style={{
                    backgroundColor: `#${label.color}30`,
                    color: `#${label.color}`,
                    borderColor: `#${label.color}50`
                  }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reviewers & Assignees */}
        <div className="border border-gray-800 bg-black/40 rounded-xl p-6" id="glassmorphism">
          <div className="flex items-center gap-2 font-semibold mb-4">
            <User className="w-5 h-5" />
            People
          </div>

          <div className="space-y-4">
            {prData.assignees.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Assignees</h4>
                <div className="flex flex-wrap gap-2">
                  {prData.assignees.map((assignee) => (
                    <div key={assignee.login} className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg max-w-full">
                      <Image
                        src={assignee.avatar_url}
                        alt={assignee.name}
                        className="w-6 h-6 rounded-full flex-shrink-0"
                        width={24}
                        height={24}
                      />
                      <span className="text-sm truncate">{assignee.login}</span>
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
                    <div key={reviewer.login} className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg max-w-full">
                      <Image
                        src={reviewer.avatar_url}
                        alt={reviewer.name}
                        className="w-6 h-6 rounded-full flex-shrink-0"
                        width={24}
                        height={24}
                      />
                      <span className="text-sm truncate">{reviewer.login}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrContent;