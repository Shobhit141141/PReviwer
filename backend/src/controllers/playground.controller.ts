import { Request, Response } from 'express';
import Playground from '../models/playground.model.js';
import { useLLMConnection } from '../utils/llmTest.js';
import { PR_TEMPLATES } from '../data/prTemplates.js';
import { decrypt, encrypt } from '../utils/encrypt_decrypt.js';
import { logError } from '../utils/logger.js';
import { TemplateVariable, TemplateValidation } from '../types/index.js';

// Available template variables for PR analysis
const AVAILABLE_TEMPLATE_VARIABLES: Record<string, TemplateVariable> = {
  title: {
    key: 'title',
    description: 'Pull request title',
    example: 'Fix authentication bug in user login',
    path: 'prData.title',
  },
  description: {
    key: 'description',
    description: 'Pull request description',
    example: 'This PR fixes the authentication issue where users could not login...',
    path: 'prData.description',
  },
  author: {
    key: 'author',
    description: 'Pull request author name',
    example: 'John Doe',
    path: 'prData.author?.name || prData.author?.login',
  },
  state: {
    key: 'state',
    description: 'Pull request state (open/closed/merged)',
    example: 'open',
    path: 'prData.state',
  },
  files_changed: {
    key: 'files_changed',
    description: 'all the files changed in the pull request',
    example: `[
        {
            "filename": "app.py",
            "status": "modified",
            "additions": 5,
            "deletions": 1,
            "changes": 6,
            "patch": "@@ -4,13 +4,14 @@\n from functions.file_to_text import pdf_to_text  \r\n import joblib\r\n \r\n-\r\n+# Load the model\r\n MODEL_PATH = 'best_model.pkl'\r\n if os.path.exists(MODEL_PATH):\r\n     model = joblib.load(MODEL_PATH)\r\n else:\r\n     raise FileNotFoundError(f\"Model file '{MODEL_PATH}' not found.\")\r\n \r\n+# Custom category order for the model output labels\r\n CUSTOM_CATEGORY_ORDER = {\r\n     'Legal': 0,\r\n     'Medical': 10,\r\n@@ -27,9 +28,11 @@\n app = Flask(__name__)\r\n app.config['UPLOAD_FOLDER'] = 'uploads'\r\n \r\n+# Create upload folder if it does not exist\r\n if not os.path.exists(app.config['UPLOAD_FOLDER']):\r\n     os.makedirs(app.config['UPLOAD_FOLDER'])\r\n \r\n+# Route to index.html\r\n @app.route('/')\r\n def upload_file():\r\n     return render_template('index.html')\r\n@@ -65,5 +68,6 @@ def uploader():\n     except Exception as e:\r\n         return jsonify({'error': str(e)}), 500\r\n \r\n+# Run the app  \r\n if __name__ == '__main__':\r\n     app.run(debug=True)\r"
        }
    ]`,
    path: 'prData.stats?.changed_files || []',
  },
  additions: {
    key: 'additions',
    description: 'Number of lines added',
    example: '150',
    path: 'prData.stats?.additions || 0',
  },
  deletions: {
    key: 'deletions',
    description: 'Number of lines deleted',
    example: '75',
    path: 'prData.stats?.deletions || 0',
  },
  commits: {
    key: 'commits',
    description: 'Number of commits',
    example: '3',
    path: 'prData.stats?.commits || 0',
  },
  branch_source: {
    key: 'branch_source',
    description: 'Source branch name',
    example: 'feature/user-auth',
    path: 'prData.head?.ref',
  },
  branch_target: {
    key: 'branch_target',
    description: 'Target branch name',
    example: 'main',
    path: 'prData.base?.ref',
  },
  created_at: {
    key: 'created_at',
    description: 'PR creation date',
    example: '2024-01-15',
    path: 'prData.created_at',
  },
  updated_at: {
    key: 'updated_at',
    description: 'PR last update date',
    example: '2024-01-16',
    path: 'prData.updated_at',
  },
};

/**
 * Configure the LLM model and system prompts for the playground
 * /playground/configure - PRIVATE
 * This function saves the user's LLM configuration and system prompts.
 * @param req - Request object containing user configuration data
 * @param res - Response object to send the configuration result
 * @returns { message: 'Model configured successfully', data: savedConfig }
 */
export const configureModel = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      llm_provider,
      llm_model,
      llm_api_key,
      system_prompt,
      secondary_system_prompt,
      user_prompt,
    } = req.body;
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }
    const configData = {
      llm_provider,
      llm_model,
      llm_api_key: encrypt(llm_api_key),
      system_prompt,
      secondary_system_prompt,
      user_prompt,
    };

    const savedConfig = await Playground.findOneAndUpdate(
      { user: req.user.id },
      { $set: configData, $setOnInsert: { user: req.user.id } },
      { new: true, upsert: true },
    );
    res.status(200).json({ message: 'Model configured successfully', data: savedConfig });
  } catch (err) {
    res.status(400).json({ error: 'Failed to configure model', details: err });
  }
};

/**
 * Test the LLM model connection with the provided configuration
 * /playground/test-connection - PRIVATE
 * This function tests the LLM connection using the provided configuration.
 * @param req - Request object containing LLM configuration data
 * @param res - Response object to send the test result
 * @returns { success: true, response: testResponse }
 */
export const testModelConnection = async (req: Request, res: Response): Promise<void> => {
  const { llm_provider, llm_model, llm_api_key } = req.body;
  try {
    const response = await useLLMConnection({ llm_provider, llm_model, llm_api_key });
    res.status(200).json({ success: true, response });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Test connection failed', details: err });
  }
};

/**
 * Test the system prompt with the LLM model
 * /playground/test-system-prompt - PRIVATE
 * This function tests the system prompt with the configured LLM model.
 * @param req - Request object containing system prompt and LLM configuration
 * @param res - Response object to send the test results
 * @returns { results: Array<{ type: string, prompt: string, response: string }> }
 */
export const testSystemPrompt = async (req: Request, res: Response): Promise<void> => {
  const { system_prompt, llm_provider, llm_model, llm_api_key } = req.body;
  try {
    const results = await Promise.all(
      Object.entries(PR_TEMPLATES).map(async ([type, prompt]) => {
        const response = await useLLMConnection({
          llm_provider,
          llm_model,
          llm_api_key,
          system_prompt,
          user_input: prompt,
        });
        return { type, prompt, response };
      }),
    );
    res.status(200).json({ results });
  } catch (err: any) {
    logError('Prompt testing error:', err);
    res.status(500).json({ error: 'Prompt testing failed', details: err });
  }
};

/**
 * AB test two system prompts with the LLM model
 * /playground/ab-test - PRIVATE
 * This function tests two system prompts with the configured LLM model.
 * @param req - Request object containing system prompts and LLM configuration
 * @param res - Response object to send the AB test results
 * @returns { input: string, primary: string, secondary: string }
 */
export const abTestPrompts = async (req: Request, res: Response): Promise<void> => {
  const { system_prompt, secondary_system_prompt, llm_provider, llm_model, llm_api_key } = req.body;
  const samplePrompt = PR_TEMPLATES.best;

  try {
    const [primaryResponse, secondaryResponse] = await Promise.all([
      useLLMConnection({
        llm_provider,
        llm_model,
        llm_api_key,
        system_prompt,
        user_input: samplePrompt,
      }),
      useLLMConnection({
        llm_provider,
        llm_model,
        llm_api_key,
        system_prompt: secondary_system_prompt,
        user_input: samplePrompt,
      }),
    ]);

    res.status(200).json({
      input: samplePrompt,
      primary: primaryResponse,
      secondary: secondaryResponse,
    });
  } catch (err) {
    res.status(500).json({ error: 'AB test failed', details: err });
  }
};

/**
 * Save the system prompts for the user
 * /playground/save-prompts - PRIVATE
 * This function saves the user's system prompts to the database.
 * @param req - Request object containing system prompts
 * @param res - Response object to send the save result
 * @returns { message: 'Prompts updated', data: updatedConfig }
 */
export const savePrompts = async (req: Request, res: Response): Promise<void> => {
  const { system_prompt, secondary_system_prompt, user_prompt } = req.body;

  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }
    const updated = await Playground.findOneAndUpdate(
      { user: req.user.id },
      { system_prompt, secondary_system_prompt, user_prompt },
      { new: true },
    );
    res.status(200).json({ message: 'Prompts updated', data: updated });
  } catch (err) {
    res.status(400).json({ error: 'Failed to update prompts', details: err });
  }
};

/**
 * Get the user's playground configuration
 * /playground/config - PRIVATE
 * This function retrieves the user's playground configuration from the database.
 * @param req - Request object containing user information
 * @param res - Response object to send the configuration data
 * @returns { data: PlaygroundConfig }
 */
export const getPlaygroundConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }
    const config = await Playground.findOne({ user: req.user.id });
    if (!config) {
      res.status(404).json({ error: 'Configuration not found' });
      return;
    }
    const configObj = config.toObject();
    if (configObj.llm_api_key) {
      configObj.llm_api_key = decrypt(configObj.llm_api_key);
    }
    res.status(200).json({ data: configObj });
  } catch (err) {
    res.status(400).json({ error: 'Failed to retrieve configuration', details: err });
  }
};

export const generateAnalysisReportUsingSystemPrompt = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { system_prompt, llm_provider, llm_model, llm_api_key, user_input } = req.body;
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }

    // Decrypt API key
    const decryptedApiKey = decrypt(llm_api_key);

    // Generate analysis using the configured LLM
    const analysisResponse = await useLLMConnection({
      llm_provider,
      llm_model,
      llm_api_key: decryptedApiKey,
      system_prompt,
      user_input,
    });

    res.status(200).json({
      success: true,
      analysis: analysisResponse,
    });
  } catch (err: any) {
    logError('Analysis generation error:', err);
    res.status(500).json({
      error: 'Failed to generate analysis report',
      details: err.message || 'Unknown error occurred',
    });
  }
};

/**
 * Generate AI analysis report for a pull request
 * /playground/generate-analysis - PRIVATE
 * This function generates an AI-powered analysis report using the user's configured LLM model and system prompt.
 * @param req - Request object containing PR data and analysis parameters
 * @param res - Response object to send the analysis report
 * @returns { analysis: AnalysisReport }
 */
export const generateAdvAnalysisReport = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }

    const { prData, analysisType = 'full' } = req.body;

    if (!prData) {
      res.status(400).json({ error: 'PR data is required for analysis' });
      return;
    }

    // Get user's playground configuration
    const config = await Playground.findOne({ user: req.user.id });

    if (!config) {
      res.status(404).json({
        error: 'Playground configuration not found. Please configure your LLM model first.',
      });
      return;
    }

    // Check if connection is valid
    if (!config.isConnectionValid) {
      res.status(400).json({
        error: 'LLM connection is not valid. Please test your connection in the playground first.',
      });
      return;
    }

    // Decrypt API key
    const decryptedApiKey = decrypt(config.llm_api_key);

    // Prepare analysis prompt based on PR data
    const analysisPrompt = buildAnalysisPrompt(prData, analysisType);

    // Generate analysis using the configured LLM
    const analysisResponse = await useLLMConnection({
      llm_provider: config.llm_provider,
      llm_model: config.llm_model,
      llm_api_key: decryptedApiKey,
      system_prompt: config.system_prompt,
      user_input: analysisPrompt,
    });

    // Parse and structure the analysis response
    const structuredAnalysis = parseAnalysisResponse(analysisResponse, prData);

    res.status(200).json({
      success: true,
      analysis: structuredAnalysis,
      metadata: {
        model: config.llm_model,
        provider: config.llm_provider,
        timestamp: new Date().toISOString(),
        analysisType,
      },
    });
  } catch (err: any) {
    logError('Analysis generation error:', err);
    res.status(500).json({
      error: 'Failed to generate analysis report',
      details: err.message || 'Unknown error occurred',
    });
  }
};

/**
 * Build analysis prompt based on PR data and analysis type
 * @param prData - Pull request data
 * @param analysisType - Type of analysis to perform
 * @returns Formatted prompt string
 */
const buildAnalysisPrompt = (prData: any, analysisType: string): string => {
  const basePrompt = `
Please analyze the following pull request and provide a comprehensive analysis report.

**Pull Request Details:**
- Title: ${prData.title}
- Description: ${prData.description}
- Author: ${prData.author?.name || prData.author?.login}
- State: ${prData.state}
- Files Changed: ${prData.stats?.changed_files || 0}
- Additions: ${prData.stats?.additions || 0}
- Deletions: ${prData.stats?.deletions || 0}
- Commits: ${prData.stats?.commits || 0}

**Files Modified:**
${
  prData.files
    ?.slice(0, 10)
    .map(
      (file: any) => `
- ${file.filename} (+${file.additions} -${file.deletions})
`,
    )
    .join('') || 'No file details available'
}

**Recent Commits:**
${
  prData.commits
    ?.slice(0, 5)
    .map(
      (commit: any) => `
- ${commit.message} (by ${commit.author?.name || commit.author?.login})
`,
    )
    .join('') || 'No commit details available'
}

Please provide analysis in the following areas:
1. **Code Quality Assessment** - Rate the overall code quality and identify potential issues
2. **Security Analysis** - Identify any security vulnerabilities or concerns
3. **Performance Impact** - Assess potential performance implications
4. **Best Practices** - Check adherence to coding standards and best practices
5. **Risk Assessment** - Evaluate the risk level of merging this PR
6. **Recommendations** - Provide actionable recommendations for improvement

Format your response as a structured analysis with clear sections and ratings where appropriate.
`;

  if (analysisType === 'security') {
    return basePrompt + `\n\nFocus primarily on security aspects and vulnerability assessment.`;
  } else if (analysisType === 'performance') {
    return (
      basePrompt + `\n\nFocus primarily on performance implications and optimization opportunities.`
    );
  } else if (analysisType === 'quality') {
    return basePrompt + `\n\nFocus primarily on code quality, maintainability, and best practices.`;
  }

  return basePrompt;
};

/**
 * Parse and structure the analysis response from LLM
 * @param response - Raw LLM response
 * @param prData - Original PR data for context
 * @returns Structured analysis object
 */
const parseAnalysisResponse = (response: string, prData: any): any => {
  // This is a simplified parser - in a real implementation, you might want to use
  // more sophisticated parsing or ask the LLM to return structured JSON

  const analysis = {
    summary: {
      score: extractScore(response) || 7.5,
      complexity: extractComplexity(response) || 'Medium',
      risk_level: extractRiskLevel(response) || 'Low',
      estimated_review_time: estimateReviewTime(prData),
    },
    analysis: {
      code_quality: {
        score: extractSectionScore(response, 'code quality') || 8.0,
        issues: extractIssues(response, 'code quality'),
        strengths: extractStrengths(response, 'code quality'),
      },
      security: {
        score: extractSectionScore(response, 'security') || 8.5,
        vulnerabilities: extractVulnerabilities(response),
        recommendations: extractRecommendations(response, 'security'),
      },
      performance: {
        score: extractSectionScore(response, 'performance') || 8.0,
        concerns: extractConcerns(response, 'performance'),
        optimizations: extractOptimizations(response),
      },
    },
    files_analysis: analyzeFiles(prData.files || []),
    recommendations: extractGeneralRecommendations(response),
    raw_analysis: response,
  };

  return analysis;
};

/**
 * Helper functions for parsing LLM response
 * will go in premium feature for paid users
 */
const extractScore = (text: string): number | null => {
  const scoreMatch = text.match(/(?:overall|total|final)?\s*score[:\s]*(\d+(?:\.\d+)?)/i);
  return scoreMatch ? parseFloat(scoreMatch[1]) : null;
};

const extractComplexity = (text: string): string => {
  if (text.toLowerCase().includes('high complexity') || text.toLowerCase().includes('complex'))
    return 'High';
  if (text.toLowerCase().includes('low complexity') || text.toLowerCase().includes('simple'))
    return 'Low';
  return 'Medium';
};

const extractRiskLevel = (text: string): string => {
  if (text.toLowerCase().includes('high risk')) return 'High';
  if (text.toLowerCase().includes('low risk')) return 'Low';
  return 'Medium';
};

const extractSectionScore = (text: string, section: string): number | null => {
  const regex = new RegExp(`${section}[:\\s]*(?:score[:\\s]*)?(\d+(?:\.\d+)?)`, 'i');
  const match = text.match(regex);
  return match ? parseFloat(match[1]) : null;
};

const extractIssues = (text: string, section: string): string[] => {
  // Simple extraction - look for bullet points or numbered lists after section
  const issues: string[] = [];
  const lines = text.split('\n');
  let inSection = false;

  for (const line of lines) {
    if (
      line.toLowerCase().includes(section.toLowerCase()) &&
      (line.toLowerCase().includes('issue') || line.toLowerCase().includes('problem'))
    ) {
      inSection = true;
      continue;
    }
    if (inSection && (line.match(/^[-*\d+\.]\s/) || line.includes('•'))) {
      issues.push(line.replace(/^[-*\d+\.\s•]+/, '').trim());
    }
    if (inSection && line.trim() === '') break;
  }

  return issues.slice(0, 5); // Limit to 5 issues
};

const extractStrengths = (text: string, section: string): string[] => {
  const strengths: string[] = [];
  const lines = text.split('\n');
  let inSection = false;

  for (const line of lines) {
    if (
      line.toLowerCase().includes(section.toLowerCase()) &&
      (line.toLowerCase().includes('strength') || line.toLowerCase().includes('good'))
    ) {
      inSection = true;
      continue;
    }
    if (inSection && (line.match(/^[-*\d+\.]\s/) || line.includes('•'))) {
      strengths.push(line.replace(/^[-*\d+\.\s•]+/, '').trim());
    }
    if (inSection && line.trim() === '') break;
  }

  return strengths.slice(0, 5);
};

const extractVulnerabilities = (text: string): string[] => {
  const vulnerabilities: string[] = [];
  if (
    text.toLowerCase().includes('no vulnerabilities') ||
    text.toLowerCase().includes('no security issues')
  ) {
    return vulnerabilities;
  }

  const lines = text.split('\n');
  for (const line of lines) {
    if (
      line.toLowerCase().includes('vulnerability') ||
      line.toLowerCase().includes('security risk')
    ) {
      vulnerabilities.push(line.trim());
    }
  }

  return vulnerabilities.slice(0, 3);
};

const extractRecommendations = (text: string, section: string): string[] => {
  const recommendations: string[] = [];
  const lines = text.split('\n');
  let inSection = false;

  for (const line of lines) {
    if (
      line.toLowerCase().includes(section.toLowerCase()) &&
      line.toLowerCase().includes('recommend')
    ) {
      inSection = true;
      continue;
    }
    if (inSection && (line.match(/^[-*\d+\.]\s/) || line.includes('•'))) {
      recommendations.push(line.replace(/^[-*\d+\.\s•]+/, '').trim());
    }
  }

  return recommendations.slice(0, 5);
};

const extractConcerns = (text: string, section: string): string[] => {
  return extractIssues(text, section); // Reuse issues extraction for concerns
};

const extractOptimizations = (text: string): string[] => {
  const optimizations: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    if (
      line.toLowerCase().includes('optim') ||
      line.toLowerCase().includes('improve') ||
      line.toLowerCase().includes('enhance')
    ) {
      optimizations.push(line.replace(/^[-*\d+\.\s•]+/, '').trim());
    }
  }

  return optimizations.slice(0, 5);
};

const extractGeneralRecommendations = (text: string): string[] => {
  const recommendations: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    if (
      line.toLowerCase().includes('recommend') ||
      line.toLowerCase().includes('suggest') ||
      line.toLowerCase().includes('should')
    ) {
      let recommendation = line.replace(/^[-*\d+\.\s•]+/, '').trim();
      if (recommendation.length > 10) {
        // Filter out very short matches
        // Add emoji based on content
        if (recommendation.toLowerCase().includes('test')) {
          recommendation = '🧪 ' + recommendation;
        } else if (recommendation.toLowerCase().includes('security')) {
          recommendation = '🔒 ' + recommendation;
        } else if (recommendation.toLowerCase().includes('document')) {
          recommendation = '📚 ' + recommendation;
        } else {
          recommendation = '✅ ' + recommendation;
        }
        recommendations.push(recommendation);
      }
    }
  }

  return recommendations.slice(0, 10);
};

const analyzeFiles = (files: any[]): any[] => {
  return files.slice(0, 10).map((file: any) => ({
    filename: file.filename,
    changes: {
      additions: file.additions || 0,
      deletions: file.deletions || 0,
    },
    complexity: file.changes > 100 ? 'High' : file.changes > 50 ? 'Medium' : 'Low',
    issues: [], // Would be populated by actual file analysis
    rating: Math.min(10, Math.max(6, 10 - file.changes / 20)), // Simple rating based on changes
  }));
};

const estimateReviewTime = (prData: any): string => {
  const files = prData.stats?.changed_files || 0;
  const additions = prData.stats?.additions || 0;
  const deletions = prData.stats?.deletions || 0;

  const totalChanges = additions + deletions;
  const baseTime = Math.max(5, files * 2 + totalChanges / 20);

  if (baseTime < 15) return `${Math.round(baseTime)} minutes`;
  if (baseTime < 60) return `${Math.round(baseTime)} minutes`;
  return `${Math.round((baseTime / 60) * 10) / 10} hours`;
};

/**
 * Get available template variables for PR analysis
 * /playground/template-variables - PRIVATE
 * This function returns all available template variables that users can use in their system prompts.
 * @param req - Request object
 * @param res - Response object to send the template variables
 * @returns { variables: TemplateVariable[] }
 */
export const getTemplateVariables = async (req: Request, res: Response): Promise<void> => {
  try {
    const variables = Object.values(AVAILABLE_TEMPLATE_VARIABLES);
    res.status(200).json({
      success: true,
      variables,
      usage:
        'Use {{variable_key}} in your system prompt to include PR data. Example: {{title}} will be replaced with the actual PR title.',
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve template variables', details: err });
  }
};

/**
 * Parse system prompt and replace template variables with actual PR data
 * @param systemPrompt - The system prompt containing template variables
 * @param prData - Pull request data
 * @returns Parsed system prompt with variables replaced
 */
const parseUserPromptTemplate = (systemPrompt: string, prData: any): string => {
  let parsedPrompt = systemPrompt;

  Object.entries(AVAILABLE_TEMPLATE_VARIABLES).forEach(([key, config]) => {
    const variablePattern = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    let value = getNestedValue(prData, config.path);

    // Handle array of file changes
    if (key === 'files_changed' && Array.isArray(value)) {
      value = value
        .map(
          (file: any) =>
            `- ${file.filename} (${file.status}, +${file.additions}, -${file.deletions})\n${file.patch || ''}`
        )
        .join('\n');

      if (!value) value = 'No files changed';
    }

    // Stringify object values to avoid [object Object]
    if (typeof value === 'object' && value !== null) {
      try {
        value = JSON.stringify(value, null, 2);
      } catch {
        value = '[Unserializable Object]';
      }
    }

    parsedPrompt = parsedPrompt.replace(
      variablePattern,
      value !== undefined && value !== null ? String(value) : 'N/A'
    );
  });
  return parsedPrompt;
};


/**
 * Get nested object value using dot notation path
 * @param obj - Object to traverse
 * @param path - Dot notation path (e.g., 'prData.stats.additions')
 * @returns Value at the specified path
 */
const getNestedValue = (obj: any, path: string): any => {
  try {
    // Handle expressions like 'prData.author?.name || prData.author?.login'
    if (path.includes('||')) {
      const parts = path.split('||').map((p) => p.trim());
      for (const part of parts) {
        const value = getNestedValue(obj, part);
        if (value !== undefined && value !== null) {
          return value;
        }
      }
      return null;
    }

    // Remove 'prData.' prefix since we're already working with prData
    const cleanPath = path.replace(/^prData\./, '');

    return cleanPath
      .split(/[\.\?\[\]]/)
      .filter((p) => p)
      .reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : null;
      }, obj);
  } catch (error) {
    return null;
  }
};

/**
 * Validate system prompt template variables
 * @param systemPrompt - System prompt to validate
 * @returns Validation result with valid/invalid variables
 */
const validateSystemPromptTemplate = (systemPrompt: string): TemplateValidation => {
  const templateVariablePattern = /{{([^}]+)}}/g;
  const matches = [...systemPrompt.matchAll(templateVariablePattern)];
  const usedVariables = matches.map((match) => match[1].trim().toLowerCase());
  const availableVariables = Object.keys(AVAILABLE_TEMPLATE_VARIABLES);

  const validVariables = usedVariables.filter((variable) => availableVariables.includes(variable));

  const invalidVariables = usedVariables.filter(
    (variable) => !availableVariables.includes(variable),
  );

  const unusedVariables = availableVariables.filter(
    (variable) => !usedVariables.includes(variable),
  );

  return {
    isValid: invalidVariables.length === 0,
    validVariables,
    invalidVariables,
    unusedVariables,
  };
};

/**
 * Generate templated analysis report using user-defined system prompt with template variables
 * /playground/generate-templated-analysis - PRIVATE
 * This function generates an AI-powered analysis report using a templated system prompt.
 * @param req - Request object containing PR data, system prompt template, and LLM config
 * @param res - Response object to send the analysis report
 * @returns { analysis: string, templateInfo: object }
 */
export const generateTemplatedAnalysisReport = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    const { prData, validateOnly = false } = req.body;

    const playgroundConfig = await Playground.findOne({ user: userId });
    if (!playgroundConfig) {
      res.status(404).json({
        error: 'Playground configuration not found. Please configure your LLM model first.',
      });
      return;
    }
    const { llm_provider, llm_model, llm_api_key, user_prompt } = playgroundConfig;
    const systemPromptTemplate = playgroundConfig.system_prompt;
    // Validate required fields
    if (!prData) {
      res.status(400).json({ error: 'PR data is required for analysis' });
      return;
    }

    if (!systemPromptTemplate) {
      res.status(400).json({ error: 'System prompt template is required' });
      return;
    }

    // Validate template variables
    const validation = validateSystemPromptTemplate(user_prompt);

    if (!validation.isValid) {
      res.status(400).json({
        error: 'Invalid template variables found',
        details: {
          invalidVariables: validation.invalidVariables,
          availableVariables: Object.keys(AVAILABLE_TEMPLATE_VARIABLES),
          message: `Invalid variables: ${validation.invalidVariables.join(', ')}. Use {{variable_name}} format with available variables.`,
        },
      });
      return;
    }

    // If validateOnly is true, just return validation results
    if (validateOnly) {
      res.status(200).json({
        success: true,
        validation,
        parsedPrompt: parseUserPromptTemplate(user_prompt, prData),
        message: 'Template validation successful',
      });
      return;
    }

    // Parse the system prompt template with actual PR data
    const parsedUserPrompt = parseUserPromptTemplate(user_prompt, prData);

    // Get LLM configuration (use provided or from user's saved config)
    let llmConfig;
    if (llm_provider && llm_model && llm_api_key) {
      llmConfig = {
        llm_provider,
        llm_model,
        llm_api_key: decrypt(llm_api_key),
      };
    } else {
      // Use saved configuration
      const config = await Playground.findOne({ user: userId });
      if (!config) {
        res.status(404).json({
          error:
            'No LLM configuration found. Please provide LLM config or configure in playground.',
        });
        return;
      }

      llmConfig = {
        llm_provider: config.llm_provider,
        llm_model: config.llm_model,
        llm_api_key: decrypt(config.llm_api_key),
      };
    }

    // Generate analysis using the parsed system prompt
    const analysisResponse = await useLLMConnection({
      llm_provider: llmConfig.llm_provider,
      llm_model: llmConfig.llm_model,
      llm_api_key: llmConfig.llm_api_key,
      system_prompt: systemPromptTemplate,
      user_input: parsedUserPrompt,
    });

    res.status(200).json({
      success: true,
      analysis: analysisResponse,
      templateInfo: {
        originalTemplate: systemPromptTemplate,
        parsedPrompt: parsedUserPrompt,
        usedVariables: validation.validVariables,
        unusedVariables: validation.unusedVariables,
      },
      metadata: {
        model: llmConfig.llm_model,
        provider: llmConfig.llm_provider,
        timestamp: new Date().toISOString(),
        templateBased: true,
      },
    });
  } catch (err: any) {
    logError('Templated analysis generation error:', err);
    res.status(500).json({
      error: 'Failed to generate templated analysis report',
      details: err.message || 'Unknown error occurred',
    });
  }
};

/**
 * Preview system prompt template with sample PR data
 * /playground/preview-template - PRIVATE
 * This function previews how a system prompt template will look with sample PR data.
 * @param req - Request object containing system prompt template
 * @param res - Response object to send the preview
 * @returns { preview: string, validation: object }
 */
export const previewSystemPromptTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { systemPromptTemplate } = req.body;

    if (!systemPromptTemplate) {
      res.status(400).json({ error: 'System prompt template is required' });
      return;
    }

    // Sample PR data for preview
    const samplePrData = {
      title: 'Fix authentication bug in user login system',
      description:
        'This PR addresses a critical authentication issue where users were unable to login due to token validation problems. The fix includes proper error handling and improved security measures.',
      author: { name: 'John Doe', login: 'johndoe' },
      state: 'open',
      stats: {
        changed_files: 5,
        additions: 150,
        deletions: 75,
        commits: 3,
      },
      head: { ref: 'feature/fix-auth-bug' },
      base: { ref: 'main' },
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-16T14:45:00Z',
    };

    // Validate the template
    const validation = validateSystemPromptTemplate(systemPromptTemplate);

    // Parse with sample data
    const preview = parseUserPromptTemplate(systemPromptTemplate, samplePrData);

    res.status(200).json({
      success: true,
      preview,
      validation,
      sampleData: samplePrData,
      availableVariables: Object.values(AVAILABLE_TEMPLATE_VARIABLES),
    });
  } catch (err: any) {
    logError('Template preview error:', err);
    res.status(500).json({
      error: 'Failed to preview template',
      details: err.message || 'Unknown error occurred',
    });
  }
};
