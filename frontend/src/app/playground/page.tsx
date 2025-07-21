"use client";

import { useEffect, useState } from "react";
import { playgroundApi } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { MODELS, PROVIDERS } from "@/config/enums";


export default function PlaygroundPage() {
  const [llm_provider, setProvider] = useState<keyof typeof MODELS>(PROVIDERS[0].value as keyof typeof MODELS);
  const [llm_model, setModel] = useState<string>("");
  const [llm_api_key, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [system_prompt, setSystemPrompt] = useState("");
  const [secondary_system_prompt, setSecondarySystemPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ message: string } | null>(null);
  const [abResult, setAbResult] = useState<{ input: string; primary: string; secondary: string } | null>(null);
  const [promptResults, setPromptResults] = useState<{ type: string; prompt: string; response: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const getModelConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await playgroundApi.getPlaygroundConfig();
      if (res?.data) {
        setProvider(res.data.llm_provider as keyof typeof MODELS);
        setModel(res.data.llm_model || MODELS[res.data.llm_provider as keyof typeof MODELS][0]);
        setApiKey(res.data.llm_api_key || "");
        setSystemPrompt(res.data.system_prompt || "");
        setSecondarySystemPrompt(res.data.secondary_system_prompt || "");
      }
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null) {
        setError((err as { data?: { error?: string }; message?: string }).data?.error || (err as { message?: string }).message || "Unknown error");
      } else {
        setError("Unknown error");
      }
    } finally {
      setLoading(false);
    } 
  };

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
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null) {
        setError((err as { data?: { error?: string }; message?: string }).data?.error || (err as { message?: string }).message || "Unknown error");
      } else {
        setError("Unknown error");
      }
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
    } catch (err : unknown) {
      if (typeof err === "object" && err !== null) {
        setError((err as { data?: { error?: string }; message?: string }).data?.error || (err as { message?: string }).message || "Unknown error");
      } else {
        setError("Unknown error");
      }
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
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null) {
        setError((err as { data?: { error?: string }; message?: string }).data?.error || (err as { message?: string }).message || "Unknown error");
      } else {
        setError("Unknown error");
      }
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
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null) {
        setError((err as { data?: { error?: string }; message?: string }).data?.error || (err as { message?: string }).message || "Unknown error");
      } else {
        setError("Unknown error");
      }
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
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null) {
        setError((err as { data?: { error?: string }; message?: string }).data?.error || (err as { message?: string }).message || "Unknown error");
      } else {
        setError("Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };


  const [providerOpen, setProviderOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);

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
              {/* Provider Dropdown */}
              <div className="relative inline-block text-left">
                <button
                type="button"
                  onClick={() => setProviderOpen((prev) => !prev)}
                  className="text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 focus:ring-2 focus:outline-none focus:ring-white/30 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex items-center"
                >
                  {PROVIDERS.find(p => p.value === llm_provider)?.label}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </button>

                {providerOpen && (
                  <div className="absolute z-10 mt-2 w-44 rounded-lg shadow-lg bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-200">
                    <ul className="py-2 text-sm text-white">
                      {PROVIDERS.map((p) => (
                        <li key={p.value}>
                          <button
                            onClick={() => {
                              setProvider(p.value as keyof typeof MODELS);
                              setModel(MODELS[p.value as keyof typeof MODELS][0]);
                              setProviderOpen(false);
                            }}
                            className="flex items-center w-full text-left px-4 py-2 hover:bg-white/20 transition-all  duration-200"
                          >
                            <img src={p.icon} alt="" className="w-5 h-5 mr-2" />
                            {p.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Model Dropdown */}
              <div className="relative inline-block text-left">
                <button
                  type="button"
                  onClick={() => setModelOpen((prev) => !prev)}
                  className="text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 focus:ring-2 focus:outline-none focus:ring-white/30 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex items-center"
                >
                  {llm_model}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </button>

                {modelOpen && (
                  <div className="absolute z-10 mt-2 w-52 rounded-lg shadow-lg bg-white/10 backdrop-blur-md border border-white/20">
                    <ul className="py-2 text-sm text-white">
                      {MODELS[llm_provider].map((model) => (
                        <li key={model}>
                          <button
                            onClick={() => {
                              setModel(model);
                              setModelOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-white/20"
                          >
                            {model}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
            {promptResults.map((r : unknown) => (
              <div key={(r as { type: string }).type} className="border rounded p-3 bg-muted/30">
                <div className="font-semibold">{(r as { type: string }).type}</div>
                <div className="text-xs text-muted-foreground mb-1">
                  Prompt: {(r as { prompt: string }).prompt}
                </div>
                <div className="whitespace-pre-wrap text-sm">{(r as { response: string }).response}</div>
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
