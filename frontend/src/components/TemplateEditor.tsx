import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert } from './ui/alert';

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

interface TemplateEditorProps {
  onTemplateChange?: (template: string) => void;
  onGenerate?: (template: string) => void;
  initialTemplate?: string;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  onTemplateChange,
  onGenerate,
  initialTemplate = ''
}) => {
  const [template, setTemplate] = useState(initialTemplate);
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [preview, setPreview] = useState('');
  const [validation, setValidation] = useState<TemplateValidation | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('editor');

  const fetchTemplateVariables = async () => {
    try {
      const response = await fetch('/api/playground/template-variables', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setVariables(data.variables);
      }
    } catch (error) {
      console.error('Failed to fetch template variables:', error);
    }
  };

  const previewTemplate = useCallback(async () => {
    if (!template.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/playground/preview-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ systemPromptTemplate: template })
      });
      const data = await response.json();

      if (data.success) {
        setPreview(data.preview);
        setValidation(data.validation);
      }
    } catch (error) {
      console.error('Failed to preview template:', error);
    } finally {
      setLoading(false);
    }
  }, [template]);

  // Fetch available template variables on component mount
  useEffect(() => {
    fetchTemplateVariables();
  }, []);

  // Auto-preview template changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (template.trim()) {
        previewTemplate();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [template, previewTemplate]);

  const handleTemplateChange = useCallback((newTemplate: string) => {
    setTemplate(newTemplate);
    onTemplateChange?.(newTemplate);
  }, [onTemplateChange]);

  const insertVariable = useCallback((variableKey: string) => {
    const textarea = document.querySelector('#template-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const insertion = `{{${variableKey}}}`;
      const newTemplate = template.substring(0, start) + insertion + template.substring(end);
      handleTemplateChange(newTemplate);

      // Set cursor position after insertion
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + insertion.length, start + insertion.length);
      }, 0);
    }
  }, [template, handleTemplateChange]);

  const filteredVariables = variables.filter(variable =>
    variable.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    variable.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const quickTemplates = [
    {
      name: 'Basic Analysis',
      template: `Analyze this PR titled "{{title}}" by {{author}}. It's currently {{state}} and affects {{files_changed}} files with {{additions}} additions and {{deletions}} deletions.`
    },
    {
      name: 'Security Focus',
      template: `Security Analysis for PR: {{title}}\n\nThis PR by {{author}} modifies {{files_changed}} files.\n\nDescription: {{description}}\n\nPlease conduct a thorough security analysis.`
    },
    {
      name: 'Performance Review',
      template: `Performance Impact Analysis\n\nPR: {{title}} ({{state}})\nAuthor: {{author}}\nScale: {{files_changed}} files, {{additions}} additions\n\n{{description}}\n\nAnalyze performance implications.`
    }
  ];

  return (
    <div className="template-editor w-full max-w-6xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>System Prompt Template Editor</CardTitle>
          <p className="text-sm text-gray-600">
            Create dynamic system prompts using template variables. Variables will be automatically replaced with actual PR data.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="editor">Template Editor</TabsTrigger>
              <TabsTrigger value="variables">Variables</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-textarea">System Prompt Template</Label>
                <Textarea
                  id="template-textarea"
                  value={template}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  placeholder="Enter your system prompt template here... Use {{variable_name}} to include PR data."
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              {/* Quick Templates */}
              <div className="space-y-2">
                <Label>Quick Templates</Label>
                <div className="flex flex-wrap gap-2">
                  {quickTemplates.map((qt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleTemplateChange(qt.template)}
                    >
                      {qt.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Validation Status */}
              {validation && (
                <div className="space-y-2">
                  <Alert className={validation.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    <div className="space-y-2">
                      <div className="font-medium">
                        {validation.isValid ? '✅ Template Valid' : '❌ Template Invalid'}
                      </div>

                      {validation.validVariables.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">Used Variables: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {validation.validVariables.map(variable => (
                              <Badge key={variable} variant="secondary" className="text-xs">
                                {variable}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {validation.invalidVariables.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-red-600">Invalid Variables: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {validation.invalidVariables.map(variable => (
                              <Badge key={variable} variant="destructive" className="text-xs">
                                {variable}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Alert>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={previewTemplate} disabled={loading}>
                  {loading ? 'Previewing...' : 'Preview Template'}
                </Button>
                <Button
                  onClick={() => onGenerate?.(template)}
                  disabled={!validation?.isValid || loading}
                >
                  Generate Analysis
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="variables" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="variable-search">Search Variables</Label>
                <Input
                  id="variable-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search variables..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredVariables.map((variable) => (
                  <Card
                    key={variable.key}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => insertVariable(variable.key)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-mono text-sm font-medium">
                            {'{{' + variable.key + '}}'}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {variable.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Example: {variable.example}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost">
                          Insert
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="space-y-2">
                <Label>Template Preview</Label>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  {loading ? (
                    <div className="text-center text-gray-500">Loading preview...</div>
                  ) : preview ? (
                    <pre className="whitespace-pre-wrap text-sm">{preview}</pre>
                  ) : (
                    <div className="text-center text-gray-500">
                      Enter a template to see preview
                    </div>
                  )}
                </div>
              </div>

              {validation && (
                <div className="text-sm text-gray-600">
                  <strong>Template Statistics:</strong>
                  <ul className="list-disc list-inside mt-1">
                    <li>Valid variables used: {validation.validVariables.length}</li>
                    <li>Available unused variables: {validation.unusedVariables.length}</li>
                    {validation.invalidVariables.length > 0 && (
                      <li className="text-red-600">Invalid variables: {validation.invalidVariables.length}</li>
                    )}
                  </ul>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateEditor;
