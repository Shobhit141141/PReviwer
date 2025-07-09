import { useEffect, useState } from "react";
import { playgroundApi } from "@/lib/api";
import PlaygroundCard from "@/components/playgroundCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const PROVIDERS = [
  { label: "OpenAI", value: "openai" },
  { label: "Anthropic", value: "anthropic" },
  { label: "Google", value: "google" },
];
const MODELS = {
  openai: ["gpt-3.5-turbo", "gpt-4", "gpt-4o"],
  anthropic: ["claude-3-opus", "claude-3-sonnet"],
  google: ["gemini-pro"],
};

export default function PlaygroundPage() {
  const [llm_provider, setProvider] = useState<keyof typeof MODELS>("openai");
  const [llm_model, setModel] = useState<string>(MODELS.openai[0]);
  const [llm_api_key, setApiKey] = useState("");
  const [system_prompt, setSystemPrompt] = useState("");
  const [secondary_system_prompt, setSecondarySystemPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [abResult, setAbResult] = useState<any>(null);
  const [promptResults, setPromptResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    playgroundApi.getPlaygroundConfig().then(cfg => {
      if (cfg && cfg.data) {
        const provider = cfg.data.llm_provider as keyof typeof MODELS;
        setProvider(provider);
        // If the model from config is valid for the provider, use it, else fallback to first model
        const validModels = MODELS[provider];
        setModel(validModels.includes(cfg.data.llm_model) ? cfg.data.llm_model : validModels[0]);
        setApiKey(""); // Do not prefill API key for security
        setSystemPrompt(cfg.data.system_prompt || "");
        setSecondarySystemPrompt(cfg.data.secondary_system_prompt || "");
      }
    }).catch(() => {});
  }, []);

  return (
    <div>
      <h1>Playground</h1>
      <p>LLM Provider: {llm_provider}</p>
      <p>LLM Model: {llm_model}</p>
      <p>API Key: {llm_api_key}</p>
      <p>System Prompt: {system_prompt}</p>
      <p>Secondary System Prompt: {secondary_system_prompt}</p>
    </div>
  );
}; 