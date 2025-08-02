export interface UserInfo {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  company?: string;
  location?: string;
  followers?: number;
  following?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateVariable {
  key: string;
  description: string;
  example: string;
  path: string;
}

export interface TemplateValidation {
  isValid: boolean;
  validVariables: string[];
  invalidVariables: string[];
  unusedVariables: string[];
}

export interface TemplatedAnalysisRequest {
  prData: any;
  systemPromptTemplate: string;
  llm_provider?: string;
  llm_model?: string;
  llm_api_key?: string;
  validateOnly?: boolean;
}

export interface TemplatedAnalysisResponse {
  success: boolean;
  analysis?: string;
  templateInfo?: {
    originalTemplate: string;
    parsedPrompt: string;
    usedVariables: string[];
    unusedVariables: string[];
  };
  validation?: TemplateValidation;
  metadata?: {
    model: string;
    provider: string;
    timestamp: string;
    templateBased: boolean;
  };
}

declare global {
  namespace Express {
    interface Request {
      user?: UserInfo;
      accessToken?: string;
    }
  }
}
