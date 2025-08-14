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
import { AlertTriangle, BadgeCheck, BadgeInfo, ChevronDown, CircleCheck, CircleX, Eye, EyeOff, Loader, ThumbsUp } from "lucide-react";
import { MODELS, PROVIDERS } from "@/config/enums";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const PR_VARIABLES = [
  { key: "title", label: "Title" },
  { key: "description", label: "Description" },
  { key: "author", label: "Author" },
  { key: "state", label: "State" },
  { key: "files_changed", label: "Files Changed" },
  { key: "additions", label: "Additions" },
  { key: "deletions", label: "Deletions" },
  { key: "commits", label: "Commits" },
  { key: "labels", label: "Labels" },
  {
    key: "merge_status",
    label: "Merge Status"
  },
];

export default function PlaygroundPage() {
  const [llm_provider, setProvider] = useState<keyof typeof MODELS>(PROVIDERS[0].value as keyof typeof MODELS);
  const [llm_model, setModel] = useState<string>("");
  const [llm_api_key, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [system_prompt, setSystemPrompt] = useState("");
  const [user_prompt, setUserPrompt] = useState("Please analyze this pull request based on the context provided in the system prompt. You can use the {{variables}} to access the pull request data. For example, you can use {{title}} to get the title of the pull request.");
  const [secondary_system_prompt, setSecondarySystemPrompt] = useState("");
  const [loading,] = useState(false);
  const [testResult, setTestResult] = useState<{ message: string, success: boolean } | null>(null);
  const [abResult, setAbResult] = useState<{ input: string; primary: string; secondary: string } | null>(null);
  const [promptResults, setPromptResults] = useState<{ type: string; prompt: string; response: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionPos, setSuggestionPos] = useState({ top: 0, left: 0 });

  const router = useRouter();
  const [fetching, setFetching] = useState({
    systemPrompt: false,
    abTest: false,
    savePrompts: false,
    testConnection: false,
    configureModel: false,
    getModelConfig: false,
  });

  const getModelConfig = async () => {
    setFetching(prev => ({ ...prev, getModelConfig: true }));
    setError(null);
    try {
      const res = await playgroundApi.getPlaygroundConfig();
      if (res?.data) {
        setProvider(res.data.llm_provider as keyof typeof MODELS);
        setModel(res.data.llm_model || MODELS[res.data.llm_provider as keyof typeof MODELS][0]);
        setApiKey(res.data.llm_api_key || "");
        setSystemPrompt(res.data.system_prompt || "");
        setSecondarySystemPrompt(res.data.secondary_system_prompt || "");
        setUserPrompt(res.data.user_prompt || "");
      }
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null) {
        setError((err as { data?: { error?: string }; message?: string }).data?.error || (err as { message?: string }).message || "Unknown error");
      } else {
        setError("Unknown error");
      }
    } finally {
      setFetching(prev => ({ ...prev, getModelConfig: false }));
    }
  };

  useEffect(() => {
    getModelConfig();
  }, []);

  const handleConfigure = async (e: React.FormEvent) => {
    e.preventDefault();
    setFetching(prev => ({ ...prev, configureModel: true }));
    setError(null);
    // Clear previous results when starting configuration
    setPromptResults([]);
    setAbResult(null);
    try {
      const res = await playgroundApi.configureModel({
        llm_provider,
        llm_model,
        llm_api_key,
        system_prompt,
        secondary_system_prompt,
        user_prompt
      });
      setTestResult({ message: res.message, success: res.success });
      toast.success(res.message);
    } catch (err: unknown) {
      toast.error("Failed to configure model. Please try again.");
      if (typeof err === "object" && err !== null) {
        setError((err as { data?: { error?: string }; message?: string }).data?.error || (err as { message?: string }).message || "Unknown error");
      } else {
        setError("Unknown error");
      }
    } finally {
      setFetching(prev => ({ ...prev, configureModel: false }));
    }
  };

  const handleTestConnection = async () => {
    setFetching(prev => ({ ...prev, testConnection: true }));
    setError(null);
    // Clear previous results when starting connection test
    setPromptResults([]);
    setAbResult(null);
    try {
      const res = await playgroundApi.testModelConnection({
        llm_provider,
        llm_model,
        llm_api_key
      });
      setTestResult({
        message: res.success
          ? "Connection successful!"
          : "Connection failed: " + res.error,
        success: res.success || false
      });
      toast.success(res.success ? "Connection successful!" : "Connection failed: " + res.error);
    } catch (err: unknown) {
      toast.error("Failed to test connection. Please try again.");
      if (typeof err === "object" && err !== null) {
        setError((err as { data?: { error?: string }; message?: string }).data?.error || (err as { message?: string }).message || "Unknown error");
      } else {
        setError("Unknown error");
      }
    } finally {
      setFetching(prev => ({ ...prev, testConnection: false }));
    }
  };
  useEffect(() => {
    if (showSuggestions) {
      document.addEventListener("mousedown", closeSuggestionBoxOnClickOutside);
      return () => {
        document.removeEventListener("mousedown", closeSuggestionBoxOnClickOutside);
      };
    }
  }, [showSuggestions]);

  const closeSuggestionBoxOnClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      !target.closest(".suggestion-box") &&
      !target.closest("textarea") &&
      !target.closest(".suggestion-item")
    ) {
      setShowSuggestions(false);
      setActivePromptField(null);
    }
  };
  const handleTestSystemPrompt = async () => {
    setFetching(prev => ({ ...prev, systemPrompt: true }));
    setError(null);
    // Clear previous results when starting system prompt test
    setTestResult(null);
    setAbResult(null);
    try {
      const res = await playgroundApi.testSystemPrompt({
        llm_provider,
        llm_model,
        llm_api_key,
        system_prompt
      });
      setPromptResults(res.results);
    } catch (err: unknown) {
      toast.error("Failed to test system prompt. Please try again.");
      if (typeof err === "object" && err !== null) {
        setError((err as { data?: { error?: string }; message?: string }).data?.error || (err as { message?: string }).message || "Unknown error");
      } else {
        setError("Unknown error");
      }
    } finally {
      setFetching(prev => ({ ...prev, systemPrompt: false }));
    }
  };

  const handleAbTest = async () => {
    setFetching(prev => ({ ...prev, abTest: true }));
    setError(null);
    setTestResult(null);
    setPromptResults([]);
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
      toast.error("Failed to run A/B test. Please try again.");
      if (typeof err === "object" && err !== null) {
        setError((err as { data?: { error?: string }; message?: string }).data?.error || (err as { message?: string }).message || "Unknown error");
      } else {
        setError("Unknown error");
      }
    } finally {
      setFetching(prev => ({ ...prev, abTest: false }));
    }
  };

  const handleSavePrompts = async () => {
    setFetching(prev => ({ ...prev, savePrompts: true }));
    setError(null);
    // Clear previous results when saving prompts
    setPromptResults([]);
    setAbResult(null);
    try {
      const res = await playgroundApi.savePrompts({
        system_prompt,
        secondary_system_prompt
      });
      setTestResult({ message: res.message, success: res.success });
      toast.success(res.message);
    } catch (err: unknown) {
      toast.error("Failed to save prompts. Please try again.");
      if (typeof err === "object" && err !== null) {
        setError((err as { data?: { error?: string }; message?: string }).data?.error || (err as { message?: string }).message || "Unknown error");
      } else {
        setError("Unknown error");
      }
    } finally {
      setFetching(prev => ({ ...prev, savePrompts: false }));
    }
  };

  const getStyleAndIcon = (type: string) => {
    switch (type) {
      case "best":
        return {
          icon: <BadgeCheck className="text-green-400 w-5 h-5" />,
          color: "bg-green-800/20 border-green-600",
          label: "Best",
        };
      case "good":
        return {
          icon: <ThumbsUp className="text-blue-400 w-5 h-5" />,
          color: "bg-blue-800/20 border-blue-600",
          label: "Good",
        };
      case "bad":
        return {
          icon: <AlertTriangle className="text-red-400 w-5 h-5" />,
          color: "bg-red-800/10 border-red-600",
          label: "Bad",
        };
      default:
        return {
          icon: null,
          color: "bg-muted/10",
          label: type,
        };
    }
  };

  const [providerOpen, setProviderOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [, setActivePromptField] = useState<"system" | "secondary" | "user" | null>(null);

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-8 pt-20">
      <div className="fixed pointer-events-none top-[10%] left-[5%] w-[400px] h-[400px] bg-purple-500 rounded-full blur-[160px] opacity-50"></div>
      <div className="fixed pointer-events-none top-[20%] right-[5%] w-[300px] h-[300px] bg-pink-500 rounded-full blur-[140px] opacity-35"></div>
      <div className="fixed pointer-events-none bottom-[15%] left-[20%] w-[350px] h-[350px] bg-blue-500 rounded-full blur-[150px] opacity-30"></div>
      <div className="fixed pointer-events-none bottom-[10%] right-[15%] w-[400px] h-[400px] bg-fuchsia-500 rounded-full blur-[180px] opacity-35"></div>
      <div className="fixed pointer-events-none top-[40%] left-[40%] w-[300px] h-[300px] bg-indigo-500 rounded-full blur-[120px] opacity-25"></div>


      <Button
        variant="outline"
        onClick={() => router.back()}
        className="border-gray-700 hover:bg-gray-800"
      >
        ← Back
      </Button>
      <Card>

        <CardHeader className="flex items-center gap-4">
          <CardTitle className="text-xl">🛠️ Model Configuration</CardTitle>
          {testResult?.message && (
            <div className="text-green-400 text-sm border border-green-400 rounded-md flex items-center w-fit p-2 bg-green-500/20"><CircleCheck className="h-4 w-4 mr-1" />{testResult.message}</div>
          )}
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

              <div className="">
                <Label>System Prompt</Label>
                <textarea
                  className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-foreground border-border focus:outline-none focus:ring-2 focus:ring-ring/50"
                  value={system_prompt}
                  onChange={(e) => {
                    setSystemPrompt(e.target.value);
                    // const cursorPos = e.target.selectionStart;
                    // const beforeCursor = e.target.value.slice(0, cursorPos);
                    // if (beforeCursor.endsWith("{{")) {
                    //   setActivePromptField("system");
                    //   setShowSuggestions(true);
                    //   const rect = e.target.getBoundingClientRect();
                    //   setSuggestionPos({ top: rect.top + 25, left: rect.left + 20 });
                    // } else {
                    //   setShowSuggestions(false);
                    // }
                  }}
                  placeholder="Main prompt for the model"
                  rows={4}
                />

                {/* {showSuggestions && (
                  <ul
                    className="absolute z-10 bg-white text-black border text-sm rounded shadow mt-1 w-52 suggestion-box"
                    style={{ top: suggestionPos.top, left: suggestionPos.left }}
                  >
                    {PR_VARIABLES.map((v) => (
                      <li
                        key={v.key}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => {
                          if (activePromptField === "system") {
                            const newPrompt = system_prompt.replace(/{{$/, `{{${v.key}}}`);
                            setSystemPrompt(newPrompt);
                          } else if (activePromptField === "secondary") {
                            const newPrompt = secondary_system_prompt.replace(/{{$/, `{{${v.key}}}`);
                            setSecondarySystemPrompt(newPrompt);
                          }
                          setShowSuggestions(false);
                          setActivePromptField(null);
                        }}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer suggestion-item"
                      >
                        {v.label} – <code>{v.key}</code>
                      </li>
                    ))}
                  </ul>
                )} */}

              </div>


              <div>
                <Label>Secondary Prompt</Label>
                <textarea
                  className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-foreground border-border focus:outline-none focus:ring-2 focus:ring-ring/50"
                  value={secondary_system_prompt}
                  onChange={(e) => {
                    setSecondarySystemPrompt(e.target.value);
                    // const cursorPos = e.target.selectionStart;
                    // const beforeCursor = e.target.value.slice(0, cursorPos);
                    // if (beforeCursor.endsWith("{{")) {
                    //   setActivePromptField("secondary");
                    //   setShowSuggestions(true);
                    //   const rect = e.target.getBoundingClientRect();
                    //   setSuggestionPos({ top: rect.top + 25, left: rect.left + 20 });
                    // } else {
                    //   setShowSuggestions(false);
                    // }
                  }}
                  placeholder="Main prompt for the model"
                  rows={4}
                />
                {/* {showSuggestions && (
                  <ul
                    className="absolute z-10 bg-white text-black border text-sm rounded shadow mt-1 w-52 suggestion-box"
                    style={{ top: suggestionPos.top, left: suggestionPos.left }}
                  >
                    {PR_VARIABLES.map((v) => (
                      <li
                        key={v.key}
                        onClick={() => {
                          if (activePromptField === "system") {
                            const newPrompt = system_prompt.replace(/{{$/, `{{${v.key}}}`);
                            setSystemPrompt(newPrompt);
                          } else if (activePromptField === "secondary") {
                            const newPrompt = secondary_system_prompt.replace(/{{$/, `{{${v.key}}}`);
                            setSecondarySystemPrompt(newPrompt);
                          }
                          setShowSuggestions(false);
                          setActivePromptField(null);
                        }}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer suggestion-item"
                      >
                        {v.label} – <code>{v.key}</code>
                      </li>
                    ))}
                  </ul>
                )} */}


              </div>

              <div className="col-span-full w-full ">
                <Label>User Prompt</Label>
                <textarea
                  className="w-full mt-1 px-3 py-2 rounded-md border bg-background text-foreground border-border focus:outline-none focus:ring-2 focus:ring-ring/50"
                  value={user_prompt}
                  onChange={(e) => {
                    setUserPrompt(e.target.value);
                    const cursorPos = e.target.selectionStart;
                    const beforeCursor = e.target.value.slice(0, cursorPos);
                    if (beforeCursor.endsWith("{{")) {
                      setActivePromptField("user");
                      setShowSuggestions(true);
                      const rect = e.target.getBoundingClientRect();
                      setSuggestionPos({ top: rect.top + 25, left: rect.left + 20 });
                    } else {
                      setShowSuggestions(false);
                    }
                  }}
                  placeholder="User prompt for the model"
                  rows={8}
                />
                <p className="text-sm text-muted-foreground flex items-center">
                  <BadgeInfo className=" h-4 " />use <code className="text-yellow-500 mx-1">{"{{variable}} "}</code> to reference variables in your prompt.
                </p>
                {showSuggestions && (
                  <ul
                    className="absolute z-10 bg-white text-black border text-sm rounded shadow mt-1 w-52 suggestion-box"
                    style={{ top: suggestionPos.top, left: suggestionPos.left }}
                  >
                    {PR_VARIABLES.map((v) => (
                      <li
                        key={v.key}
                        onClick={() => {
                          const newPrompt = user_prompt.replace(/{{$/, `{{${v.key}}}`);
                          setUserPrompt(newPrompt);
                          setShowSuggestions(false);
                          setActivePromptField(null);
                        }}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer suggestion-item"
                      >
                        {v.label} – <code>{v.key}</code>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex max-sm:flex-wrap gap-2 pt-2 w-full">
                <Button type="submit" disabled={loading || fetching.configureModel}>
                  {fetching.configureModel && <Loader className="animate-spin" />} Save Config
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={loading || fetching.testConnection}
                >
                  {fetching.testConnection && <Loader className="animate-spin" />} Test Connection
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestSystemPrompt}
                  disabled={loading || fetching.systemPrompt}
                >
                  {fetching.systemPrompt && <Loader className="animate-spin" />} Test Prompt
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAbTest}
                  disabled={loading || fetching.abTest}
                >
                  {fetching.abTest && <Loader className="animate-spin" />} A/B Test
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSavePrompts}
                  disabled={loading || fetching.savePrompts}
                >
                  {fetching.savePrompts && <Loader className="animate-spin" />} Save Prompts
                </Button>
              </div>
            </div>
            {error && <div className="text-red-400 text-sm border border-red-400 rounded-md flex items-center w-fit p-2 bg-red-500/20"><CircleX className="h-4 w-4 mr-1" />{error}</div>}

          </form>
        </CardContent>
      </Card>

      {promptResults && promptResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🧪 Prompt Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {promptResults.map((r: unknown) => {
              const { type, prompt, response } = r as {
                type: string;
                prompt: string;
                response: string;
              };

              const { icon, color, label } = getStyleAndIcon(type);

              return (
                <div key={type} className={`border rounded p-4 ${color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {icon}
                    <span className="font-semibold text-lg">{label}</span>
                  </div>

                  <div className="text-sm text-muted-foreground mb-1 pb-4">
                    <p className="text-white font-medium mb-1">Prompt:</p>
                    <ReactMarkdown>{prompt}</ReactMarkdown>
                  </div>

                  <div className="whitespace-pre-wrap text-sm border-t-2 pt-4">
                    <p className="text-white font-medium mb-1">Response:</p>
                    <ReactMarkdown>{response}</ReactMarkdown>
                  </div>
                </div>
              );
            })}
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
              Input: <ReactMarkdown>
                {abResult.input}
              </ReactMarkdown>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded p-3 bg-muted/30">
                <div className="font-semibold">Primary Prompt</div>
                <div className="whitespace-pre-wrap text-sm">
                  <ReactMarkdown>
                    {abResult.primary}
                  </ReactMarkdown>
                </div>
              </div>
              <div className="border rounded p-3 bg-muted/30">
                <div className="font-semibold">Secondary Prompt</div>
                <div className="whitespace-pre-wrap text-sm">
                  <ReactMarkdown>
                    {abResult.secondary}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>

  );
}

