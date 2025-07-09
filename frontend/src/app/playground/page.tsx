"use client";

import { useEffect, useState } from "react";
import { playgroundApi } from "@/lib/api";
import PlaygroundCard from "@/components/playgroundCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

const PROVIDERS = [
  { label: "OpenAI", value: "openai" },
  { label: "Anthropic", value: "anthropic" },
  { label: "Google", value: "google" }
];

const MODELS = {
  openai: ["gpt-3.5-turbo", "gpt-4", "gpt-4o"],
  anthropic: ["claude-3-opus", "claude-3-sonnet"],
  google: ["gemini-2.5-pro"]
};

export default function PlaygroundPage() {
  const [llm_provider, setProvider] = useState<keyof typeof MODELS>(PROVIDERS[0].value as keyof typeof MODELS);
  const [llm_model, setModel] = useState<string>("");
  const [llm_api_key, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [system_prompt, setSystemPrompt] = useState("");
  const [secondary_system_prompt, setSecondarySystemPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [abResult, setAbResult] = useState<any>(null);
  const [promptResults, setPromptResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const getModelConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await playgroundApi.getPlaygroundConfig();
      if (res?.data) {
        // Set all state at once in a batch
        setProvider(res.data.llm_provider);
        setModel(res.data.llm_model || MODELS[res.data.llm_provider as keyof typeof MODELS][0]);
        setApiKey(res.data.llm_api_key || "");
        setSystemPrompt(res.data.system_prompt || "");
        setSecondarySystemPrompt(res.data.secondary_system_prompt || "");
      }
    } catch (err: any) {
      setError(err?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // When provider changes, ensure model is valid for the new provider
    if (!MODELS[llm_provider].includes(llm_model)) {
      setModel(MODELS[llm_provider][0]);
    }
  }, [llm_provider]);

  useEffect(() => {
    getModelConfig();
  }, []);

  const handleConfigure = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await playgroundApi.configureModel({
        llm_provider,
        llm_model,
        llm_api_key,
        system_prompt,
        secondary_system_prompt
      });
      setTestResult({ message: res.message });
    } catch (err: any) {
      setError(err?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await playgroundApi.testModelConnection({
        llm_provider,
        llm_model,
        llm_api_key
      });
      setTestResult({
        message: res.success
          ? "✅ Connection successful!"
          : "❌ Connection failed: " + res.error
      });
    } catch (err: any) {
      setError(err?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSystemPrompt = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await playgroundApi.testSystemPrompt({
        llm_provider,
        llm_model,
        llm_api_key,
        system_prompt
      });
      setPromptResults(res.results);
    } catch (err: any) {
      setError(err?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAbTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await playgroundApi.abTestPrompts({
        llm_provider,
        llm_model,
        llm_api_key,
        system_prompt,
        secondary_system_prompt
      });
      setAbResult(res);
    } catch (err: any) {
      setError(err?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrompts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await playgroundApi.savePrompts({
        system_prompt,
        secondary_system_prompt
      });
      setTestResult({ message: res.message });
    } catch (err: any) {
      setError(err?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      <div className="fixed pointer-events-none top-[10%] left-[5%] w-[400px] h-[400px] bg-purple-500 rounded-full blur-[160px] opacity-50"></div>
      <div className="fixed pointer-events-none top-[20%] right-[5%] w-[300px] h-[300px] bg-pink-500 rounded-full blur-[140px] opacity-35"></div>
      <div className="fixed pointer-events-none bottom-[15%] left-[20%] w-[350px] h-[350px] bg-blue-500 rounded-full blur-[150px] opacity-30"></div>
      <div className="fixed pointer-events-none bottom-[10%] right-[15%] w-[400px] h-[400px] bg-fuchsia-500 rounded-full blur-[180px] opacity-35"></div>
      <div className="fixed pointer-events-none top-[40%] left-[40%] w-[300px] h-[300px] bg-indigo-500 rounded-full blur-[120px] opacity-25"></div>
      <Card>
        <CardHeader>
          <CardTitle>🛠️ Model Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleConfigure} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Provider</Label>
                <Select
                  value={llm_provider}
                  onValueChange={(val) => {
                    const provider = val as keyof typeof MODELS;
                    setProvider(provider);
                    setModel(MODELS[provider][0]);
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Model</Label>
                <Select
                  value={llm_model}
                  // @ts-ignore - this is a workaround for TypeScript not recognizing the dynamic value
                  onValueChange={e => setModel(e.target.value)}
                  disabled={loading || !llm_provider}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={loading ? "Loading..." : "Select model"} />
                  </SelectTrigger>
                  {!loading && (
                    <SelectContent>
                      {MODELS[llm_provider].map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  )}
                </Select>
              </div>
              <div className="col-span-full relative">
                <Label>API Key</Label>
                <div className="relative mt-1">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={llm_api_key}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <Label>System Prompt</Label>
                <textarea
                  className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-foreground border-border focus:outline-none focus:ring-2 focus:ring-ring/50"
                  value={system_prompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Main prompt for the model"
                  rows={4}
                />
              </div>
              <div>
                <Label>Secondary Prompt</Label>
                <textarea
                  className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-foreground border-border focus:outline-none focus:ring-2 focus:ring-ring/50"
                  value={secondary_system_prompt}
                  onChange={(e) => setSecondarySystemPrompt(e.target.value)}
                  placeholder="Prompt for A/B testing"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit" disabled={loading}>
                Save Config
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={loading}
              >
                Test Connection
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleTestSystemPrompt}
                disabled={loading}
              >
                Test Prompt
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleAbTest}
                disabled={loading}
              >
                A/B Test
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleSavePrompts}
                disabled={loading}
              >
                Save Prompts
              </Button>
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}
            {testResult?.message && (
              <div className="text-green-600 text-sm">{testResult.message}</div>
            )}
          </form>
        </CardContent>
      </Card>

      {promptResults && (
        <Card>
          <CardHeader>
            <CardTitle>🧪 Prompt Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {promptResults.map((r: any) => (
              <div key={r.type} className="border rounded p-3 bg-muted/30">
                <div className="font-semibold">{r.type}</div>
                <div className="text-xs text-muted-foreground mb-1">
                  Prompt: {r.prompt}
                </div>
                <div className="whitespace-pre-wrap text-sm">{r.response}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {abResult && (
        <Card>
          <CardHeader>
            <CardTitle>🔁 A/B Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2 text-xs text-muted-foreground">
              Input: {abResult.input}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded p-3 bg-muted/30">
                <div className="font-semibold">Primary Prompt</div>
                <div className="whitespace-pre-wrap text-sm">{abResult.primary}</div>
              </div>
              <div className="border rounded p-3 bg-muted/30">
                <div className="font-semibold">Secondary Prompt</div>
                <div className="whitespace-pre-wrap text-sm">{abResult.secondary}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
