import { Request, Response } from 'express';
import PRReport, { IPRReport } from '../models/prReport.model.js';
import {
  getRedisCache,
  setRedisCache,
  deleteRedisCache,
  clearRedisCachePattern,
  CACHE_TTL,
  connectToRedis,
} from '../config/redis.js';
import { logError, logger } from '../utils/logger.js';

/**
 * Save a PR report for a user
 * POST /pr-reports/save - PRIVATE
 * This function saves a PR report with the provided data.
 * @param req - Request object containing user ID and report data
 * @param res - Response object
 * @return {void} - Returns a JSON response with the saved report ID and other details
 */
export const savePRReport = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { prIdentifier, prMetadata, analysisReport, playgroundConfig, reportTitle } = req.body;

    if (!prIdentifier || !prMetadata || !playgroundConfig || !analysisReport || !reportTitle) {
      res.status(400).json({
        error:
          'Missing required fields: prIdentifier, prMetadata, playgroundConfig, analysisReport, or reportTitle',
      });
      return;
    }

    console.log('Saving PR report:', {
      prIdentifier,
      userId,
      prMetadata,
      playgroundConfig,
      analysisReport,
      reportTitle,
    });

    const savedReport = await PRReport.create({
      prIdentifier,
      userId,
      prMetadata,
      playgroundConfig,
      analysisReport,
      reportTitle: reportTitle || `Report - ${new Date().toLocaleDateString()}`,
    });

    console.log('Saved PR report:', savedReport);

    await clearPRReportCache(userId, prIdentifier);

    res.status(201).json({
      message: 'PR report saved successfully',
      reportId: savedReport._id,
      prIdentifier: savedReport.prIdentifier,
      reportTitle: savedReport.reportTitle,
    });
  } catch (error) {
    logError('Error saving PR report', error instanceof Error ? error : new Error(String(error)));
    console.error('Error saving PR report:', error);
    res.status(500).json({ error: 'Failed to save PR report' });
  }
};

/**
 * Get all PR reports for a user
 * GET /pr-reports/user - PRIVATE
 */
export const getUserPRReports = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const cacheKey = `user_pr_reports:${userId}:${page}:${limit}`;

    // Ensure Redis connection
    await connectToRedis();

    try {
      // Try to get from cache
      const cachedReports = await getRedisCache(cacheKey);
      if (cachedReports) {
        logger(' CACHE ', `User PR reports served from cache`, 'green');
        res.json(JSON.parse(cachedReports));
        return;
      }
    } catch (cacheError) {
      logError(
        'Redis cache read error for getUserPRReports',
        cacheError instanceof Error ? cacheError : new Error(String(cacheError)),
      );
    }

    // Fetch from database
    const [reports, total] = await Promise.all([
      PRReport.find({ userId }).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      PRReport.countDocuments({ userId }),
    ]);

    const result = {
      reports: reports.map((report) => ({
        _id: report._id,
        prIdentifier: report.prIdentifier,
        prMetadata: report.prMetadata,
        playgroundConfig: report.playgroundConfig,
        reportTitle: report.reportTitle,
        savedAt: report.savedAt,
        updatedAt: report.updatedAt,
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalReports: total,
        hasMore: skip + reports.length < total,
      },
    };

    try {
      // Cache for 5 minutes
      await setRedisCache(cacheKey, JSON.stringify(result), CACHE_TTL.SHORT);
      logger(' CACHE ', `User PR reports cached`, 'blue');
    } catch (cacheError) {
      logError(
        'Redis cache write error for getUserPRReports',
        cacheError instanceof Error ? cacheError : new Error(String(cacheError)),
      );
    }

    res.json(result);
  } catch (error) {
    logError(
      'Error fetching user PR reports',
      error instanceof Error ? error : new Error(String(error)),
    );
    res.status(500).json({ error: 'Failed to fetch PR reports' });
  }
};

/**
 * Get a specific PR report by ID
 * GET /pr-reports/:reportId - PRIVATE
 */
export const getPRReport = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { reportId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const cacheKey = `pr_report:${userId}:${reportId}`;

    // Ensure Redis connection
    await connectToRedis();

    try {
      // Try to get from cache
      const cachedReport = await getRedisCache(cacheKey);
      if (cachedReport) {
        logger(' CACHE ', `PR report served from cache: ${reportId}`, 'green');
        res.json(JSON.parse(cachedReport));
        return;
      }
    } catch (cacheError) {
      logError(
        'Redis cache read error for getPRReport',
        cacheError instanceof Error ? cacheError : new Error(String(cacheError)),
      );
    }

    // Fetch from database by ID and ensure it belongs to the user
    const report = await PRReport.findOne({ _id: reportId, userId }).lean();

    if (!report) {
      res.status(404).json({ error: 'PR report not found' });
      return;
    }

    try {
      // Cache for 15 minutes
      await setRedisCache(cacheKey, JSON.stringify(report), CACHE_TTL.MEDIUM);
      logger(' CACHE ', `PR report cached: ${reportId}`, 'blue');
    } catch (cacheError) {
      logError(
        'Redis cache write error for getPRReport',
        cacheError instanceof Error ? cacheError : new Error(String(cacheError)),
      );
    }

    res.json(report);
  } catch (error) {
    logError('Error fetching PR report', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ error: 'Failed to fetch PR report' });
  }
};

/**
 * Get all reports for a specific PR
 * GET /pr-reports/pr/:prIdentifier - PRIVATE
 */
export const getPRReports = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { prIdentifier } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const cacheKey = `pr_reports:${userId}:${prIdentifier}`;

    try {
      // Try to get from cache
      const cachedReports = await getRedisCache(cacheKey);
      if (cachedReports) {
        logger(' CACHE ', `PR reports served from cache: ${prIdentifier}`, 'green');
        res.json(JSON.parse(cachedReports));
        return;
      }
    } catch (cacheError) {
      logError(
        'Redis cache read error for getPRReports',
        cacheError instanceof Error ? cacheError : new Error(String(cacheError)),
      );
    }

    // Fetch all reports for this PR from database
    const reports = await PRReport.find({ prIdentifier, userId }).sort({ savedAt: -1 }).lean();

    const result = {
      reports,
      totalReports: reports.length,
    };

    try {
      // Cache for 10 minutes
      await setRedisCache(cacheKey, JSON.stringify(result), CACHE_TTL.SHORT * 2);
      logger(' CACHE ', `PR reports cached: ${prIdentifier}`, 'blue');
    } catch (cacheError) {
      logError(
        'Redis cache write error for getPRReports',
        cacheError instanceof Error ? cacheError : new Error(String(cacheError)),
      );
    }

    res.json(result);
  } catch (error) {
    logError(
      'Error fetching PR reports',
      error instanceof Error ? error : new Error(String(error)),
    );
    res.status(500).json({ error: 'Failed to fetch PR reports' });
  }
};

/**
 * Delete a PR report
 * DELETE /pr-reports/:reportId - PRIVATE
 */
export const deletePRReport = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { reportId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const deletedReport = await PRReport.findOneAndDelete({ _id: reportId, userId });

    if (!deletedReport) {
      res.status(404).json({ error: 'PR report not found' });
      return;
    }

    // Clear related cache
    await clearPRReportCache(userId, deletedReport.prIdentifier);

    logger(' PR_REPORT ', `Deleted PR report: ${reportId}`, 'yellow');
    res.json({ message: 'PR report deleted successfully' });
  } catch (error) {
    logError('Error deleting PR report', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ error: 'Failed to delete PR report' });
  }
};

/**
 * Export PR report in different formats
 * GET /pr-reports/:reportId/export/:format - PRIVATE
 */
export const exportPRReport = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { reportId, format } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const report = await PRReport.findOne({ _id: reportId, userId }).lean();

    if (!report) {
      res.status(404).json({ error: 'PR report not found' });
      return;
    }

    const formatType = format.toLowerCase();

    switch (formatType) {
      case 'json':
        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="pr-report-${report.prIdentifier.replace(/:/g, '-')}-${report._id}.json"`,
        );
        res.json(report);
        break;

      case 'markdown':
      case 'md':
        const markdownContent = generateMarkdownReport(report);
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="pr-report-${report.prIdentifier.replace(/:/g, '-')}-${report._id}.md"`,
        );
        res.send(markdownContent);
        break;

      case 'txt':
      case 'text':
        const textContent = generateTextReport(report);
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="pr-report-${report.prIdentifier.replace(/:/g, '-')}-${report._id}.txt"`,
        );
        res.send(textContent);
        break;

      case 'csv':
        const csvContent = generateCSVReport(report);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="pr-report-${report.prIdentifier.replace(/:/g, '-')}-${report._id}.csv"`,
        );
        res.send(csvContent);
        break;

      default:
        res.status(400).json({
          error: 'Unsupported format. Supported formats: json, markdown (md), text (txt), csv',
        });
        return;
    }

    logger(
      ' PR_REPORT ',
      `Exported PR report: ${report.prIdentifier} (${report._id}) as ${formatType}`,
      'purple',
    );
  } catch (error) {
    logError(
      'Error exporting PR report',
      error instanceof Error ? error : new Error(String(error)),
    );
    res.status(500).json({ error: 'Failed to export PR report' });
  }
};

/**
 * Helper function to clear PR report cache
 */
async function clearPRReportCache(userId: string, prIdentifier?: string) {
  try {
    await connectToRedis();

    const keysToDelete: string[] = [];

    // Clear user reports list cache (all pages)
    const userReportsPattern = `user_pr_reports:${userId}:*`;
    const deletedUserReports = await clearRedisCachePattern(userReportsPattern);

    if (prIdentifier) {
      await deleteRedisCache(`pr_reports:${userId}:${prIdentifier}`);
      keysToDelete.push(`pr_reports:${userId}:${prIdentifier}`);
    }

    logger(
      ' CACHE ',
      `Cleared PR report cache: ${deletedUserReports + keysToDelete.length} keys`,
      'yellow',
    );
  } catch (error) {
    logError(
      'Error clearing PR report cache',
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

/**
 * Generate Markdown report
 */
function generateMarkdownReport(report: any): string {
  const { prMetadata, reportData, templateReport, savedAt } = report;

  return `# PR Analysis Report

## Pull Request Information
- **Title:** ${prMetadata.title}
- **Number:** #${prMetadata.number}
- **Repository:** ${prMetadata.owner}/${prMetadata.repo}
- **Author:** ${prMetadata.author}
- **State:** ${prMetadata.state}
- **Created:** ${prMetadata.created_at}
- **Report Generated:** ${new Date(savedAt).toISOString()}

## Summary
- **Overall Score:** ${reportData.summary.score}/10
- **Complexity:** ${reportData.summary.complexity}
- **Risk Level:** ${reportData.summary.risk_level}
- **Estimated Review Time:** ${reportData.summary.estimated_review_time}

## Code Quality Analysis
**Score:** ${reportData.analysis.code_quality.score}/10

### Strengths
${reportData.analysis.code_quality.strengths.map((s: string) => `- ${s}`).join('\n')}

### Issues
${reportData.analysis.code_quality.issues.map((i: string) => `- ${i}`).join('\n')}

## Security Analysis
**Score:** ${reportData.analysis.security.score}/10

### Vulnerabilities
${
  reportData.analysis.security.vulnerabilities.length > 0
    ? reportData.analysis.security.vulnerabilities.map((v: string) => `- ${v}`).join('\n')
    : '- No vulnerabilities detected'
}

### Recommendations
${reportData.analysis.security.recommendations.map((r: string) => `- ${r}`).join('\n')}

## Performance Analysis
**Score:** ${reportData.analysis.performance.score}/10

### Concerns
${reportData.analysis.performance.concerns.map((c: string) => `- ${c}`).join('\n')}

### Optimizations
${reportData.analysis.performance.optimizations.map((o: string) => `- ${o}`).join('\n')}

## File Analysis
${reportData.files_analysis
  .map(
    (file: any) => `
### ${file.filename}
- **Changes:** +${file.changes.additions}/-${file.changes.deletions}
- **Complexity:** ${file.complexity}
- **Rating:** ${file.rating}/10
- **Issues:** ${file.issues.length > 0 ? file.issues.join(', ') : 'None'}
`,
  )
  .join('\n')}

## Recommendations
${reportData.recommendations.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}

${templateReport ? `\n## AI Generated Analysis\n${templateReport}` : ''}

---
*Report generated by PReviwer - AI-Powered PR Analysis Tool*
`;
}

/**
 * Generate Text report
 */
function generateTextReport(report: any): string {
  return generateMarkdownReport(report)
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1');
}

/**
 * Generate CSV report
 */
function generateCSVReport(report: any): string {
  const { prMetadata, reportData, savedAt } = report;

  let csv = 'Category,Item,Value\n';
  csv += `PR Info,Title,"${prMetadata.title}"\n`;
  csv += `PR Info,Number,#${prMetadata.number}\n`;
  csv += `PR Info,Repository,${prMetadata.owner}/${prMetadata.repo}\n`;
  csv += `PR Info,Author,${prMetadata.author}\n`;
  csv += `PR Info,State,${prMetadata.state}\n`;
  csv += `PR Info,Created,${prMetadata.created_at}\n`;
  csv += `PR Info,Report Generated,${new Date(savedAt).toISOString()}\n`;

  csv += `Summary,Overall Score,${reportData.summary.score}/10\n`;
  csv += `Summary,Complexity,${reportData.summary.complexity}\n`;
  csv += `Summary,Risk Level,${reportData.summary.risk_level}\n`;
  csv += `Summary,Estimated Review Time,${reportData.summary.estimated_review_time}\n`;

  csv += `Analysis,Code Quality Score,${reportData.analysis.code_quality.score}/10\n`;
  csv += `Analysis,Security Score,${reportData.analysis.security.score}/10\n`;
  csv += `Analysis,Performance Score,${reportData.analysis.performance.score}/10\n`;

  // Add file analysis
  reportData.files_analysis.forEach((file: any) => {
    csv += `File Analysis,${file.filename} - Rating,${file.rating}/10\n`;
    csv += `File Analysis,${file.filename} - Complexity,${file.complexity}\n`;
    csv += `File Analysis,${file.filename} - Changes,+${file.changes.additions}/-${file.changes.deletions}\n`;
  });

  return csv;
}
