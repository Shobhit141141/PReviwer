# PR Analysis Template System

## Overview

The PR Analysis Template System allows users to create dynamic system prompts using template
variables that get automatically replaced with actual PR data. This enables personalized and
contextual analysis reports.

## Available Template Variables

Users can include the following variables in their system prompts using the `{{variable_name}}`
syntax:

| Variable            | Description              | Example Value                               | Usage               |
| ------------------- | ------------------------ | ------------------------------------------- | ------------------- |
| `{{title}}`         | Pull request title       | "Fix authentication bug in user login"      | `{{title}}`         |
| `{{description}}`   | Pull request description | "This PR fixes the authentication issue..." | `{{description}}`   |
| `{{author}}`        | PR author name           | "John Doe"                                  | `{{author}}`        |
| `{{state}}`         | PR state                 | "open", "closed", "merged"                  | `{{state}}`         |
| `{{files_changed}}` | Number of files changed  | "5"                                         | `{{files_changed}}` |
| `{{additions}}`     | Number of lines added    | "150"                                       | `{{additions}}`     |
| `{{deletions}}`     | Number of lines deleted  | "75"                                        | `{{deletions}}`     |
| `{{commits}}`       | Number of commits        | "3"                                         | `{{commits}}`       |
| `{{branch_source}}` | Source branch name       | "feature/user-auth"                         | `{{branch_source}}` |
| `{{branch_target}}` | Target branch name       | "main"                                      | `{{branch_target}}` |
| `{{created_at}}`    | PR creation date         | "2024-01-15T10:30:00Z"                      | `{{created_at}}`    |
| `{{updated_at}}`    | PR last update date      | "2024-01-16T14:45:00Z"                      | `{{updated_at}}`    |

## API Endpoints

### 1. Get Available Template Variables

**GET** `/playground/template-variables`

Returns all available template variables with descriptions and examples.

**Response:**

```json
{
  "success": true,
  "variables": [
    {
      "key": "title",
      "description": "Pull request title",
      "example": "Fix authentication bug in user login",
      "path": "prData.title"
    }
  ],
  "usage": "Use {{variable_key}} in your system prompt to include PR data..."
}
```

### 2. Preview System Prompt Template

**POST** `/playground/preview-template`

Preview how a system prompt template will look with sample PR data.

**Request Body:**

```json
{
  "systemPromptTemplate": "Analyze this PR titled {{title}} by {{author}}. It has {{files_changed}} files changed with {{additions}} additions and {{deletions}} deletions."
}
```

**Response:**

```json
{
  "success": true,
  "preview": "Analyze this PR titled Fix authentication bug in user login system by John Doe. It has 5 files changed with 150 additions and 75 deletions.",
  "validation": {
    "isValid": true,
    "validVariables": ["title", "author", "files_changed", "additions", "deletions"],
    "invalidVariables": [],
    "unusedVariables": ["description", "state", "commits", "branch_source", "branch_target", "created_at", "updated_at"]
  },
  "sampleData": {...},
  "availableVariables": [...]
}
```

### 3. Generate Templated Analysis Report

**POST** `/playground/generate-templated-analysis`

Generate an AI analysis report using a templated system prompt.

**Request Body:**

```json
{
  "prData": {
    "title": "Fix authentication bug",
    "description": "This PR fixes...",
    "author": { "name": "John Doe" },
    "state": "open",
    "stats": {
      "changed_files": 5,
      "additions": 150,
      "deletions": 75,
      "commits": 3
    }
  },
  "systemPromptTemplate": "Analyze the PR {{title}} by {{author}}. Focus on the {{files_changed}} files changed and provide security recommendations.",
  "llm_provider": "openai",
  "llm_model": "gpt-4",
  "llm_api_key": "encrypted_key",
  "validateOnly": false
}
```

**Response:**

```json
{
  "success": true,
  "analysis": "Based on the PR 'Fix authentication bug' by John Doe...",
  "templateInfo": {
    "originalTemplate": "Analyze the PR {{title}} by {{author}}...",
    "parsedPrompt": "Analyze the PR Fix authentication bug by John Doe...",
    "usedVariables": ["title", "author", "files_changed"],
    "unusedVariables": ["description", "state", "additions", "deletions", "commits"]
  },
  "metadata": {
    "model": "gpt-4",
    "provider": "openai",
    "timestamp": "2024-01-16T10:30:00Z",
    "templateBased": true
  }
}
```

## Usage Examples

### Basic Template

```
Analyze this PR titled "{{title}}" created by {{author}}.
The PR is currently {{state}} and involves {{files_changed}} files.
```

### Detailed Template

```
Please provide a comprehensive analysis of the following pull request:

**PR Information:**
- Title: {{title}}
- Author: {{author}}
- Status: {{state}}
- Created: {{created_at}}
- Last Updated: {{updated_at}}

**Change Summary:**
- Files Modified: {{files_changed}}
- Lines Added: {{additions}}
- Lines Deleted: {{deletions}}
- Total Commits: {{commits}}
- Source Branch: {{branch_source}}
- Target Branch: {{branch_target}}

**Description:**
{{description}}

Please focus on:
1. Code quality assessment
2. Security implications
3. Performance impact
4. Best practices compliance
```

### Conditional Logic Template

```
Analyze the PR "{{title}}" by {{author}}.

This is a {{state}} PR that modifies {{files_changed}} files.
{{#if additions > 100}}
This is a significant change with {{additions}} lines added.
{{/if}}

Focus areas:
- Security review (especially important for {{files_changed}} files)
- Performance impact assessment
- Code quality evaluation
```

## Frontend Integration

### TypeScript Types

```typescript
interface TemplateVariable {
  key: string;
  description: string;
  example: string;
  path: string;
}

interface TemplateValidation {
  isValid: boolean;
  validVariables: string[];
  invalidVariables: string[];
  unusedVariables: string[];
}
```

### React Component Example

```tsx
import React, { useState, useEffect } from 'react';

const SystemPromptEditor = () => {
  const [template, setTemplate] = useState('');
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    // Fetch available variables
    fetchTemplateVariables();
  }, []);

  const handleTemplateChange = (newTemplate: string) => {
    setTemplate(newTemplate);
    // Real-time preview
    previewTemplate(newTemplate);
  };

  const insertVariable = (variableKey: string) => {
    const insertion = `{{${variableKey}}}`;
    setTemplate((prev) => prev + insertion);
  };

  return (
    <div className="template-editor">
      <div className="variables-panel">
        <h3>Available Variables</h3>
        {variables.map((variable) => (
          <div key={variable.key} className="variable-item">
            <button onClick={() => insertVariable(variable.key)}>{variable.key}</button>
            <span>{variable.description}</span>
          </div>
        ))}
      </div>

      <div className="editor-panel">
        <textarea
          value={template}
          onChange={(e) => handleTemplateChange(e.target.value)}
          placeholder="Enter your system prompt template here..."
        />
      </div>

      <div className="preview-panel">
        <h3>Preview</h3>
        <pre>{preview}</pre>
      </div>
    </div>
  );
};
```

## Error Handling

### Invalid Variables

When invalid template variables are used, the API returns:

```json
{
  "error": "Invalid template variables found",
  "details": {
    "invalidVariables": ["invalid_var"],
    "availableVariables": ["title", "description", ...],
    "message": "Invalid variables: invalid_var. Use {{variable_name}} format with available variables."
  }
}
```

### Missing PR Data

```json
{
  "error": "PR data is required for analysis"
}
```

## Security Considerations

1. **Input Validation**: All template variables are validated against a whitelist
2. **XSS Prevention**: Template variables are sanitized before insertion
3. **API Key Encryption**: LLM API keys are encrypted in the database
4. **Rate Limiting**: Template generation is rate-limited per user
5. **Access Control**: All endpoints require authentication

## Performance Optimizations

1. **Caching**: Template parsing results are cached for repeated patterns
2. **Lazy Loading**: Variables are loaded on-demand
3. **Batch Processing**: Multiple template validations can be batched
4. **Background Processing**: Long-running analyses use background jobs

## Future Enhancements

1. **Conditional Logic**: Support for if/else statements in templates
2. **Custom Functions**: User-defined functions for data transformation
3. **Template Sharing**: Share templates between users/teams
4. **Version Control**: Track template versions and changes
5. **AI Suggestions**: AI-powered template optimization suggestions
