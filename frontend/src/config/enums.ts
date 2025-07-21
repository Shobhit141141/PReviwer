export const PROVIDERS = [
  { label: "OpenAI", value: "openai", icon :"/openai-icon.png" },
  { label: "Anthropic", value: "anthropic", icon :"/anth-icon.png" },
  { label: "Google", value: "google", icon :"/gemini-icon.png" },
  { label: "Mistral", value: "mistral", icon :"/mistral-icon.svg" },
  { label: "DeepSeek", value: "deepseek", icon :"/ds-icon.png" }
];

export const MODELS = {
  openai: [
    'gpt-4.1',
    'gpt-4.1-mini',
    'gpt-4.1-nano',
    'gpt-4.5-preview',
    'gpt-4o',
    'gpt-4o-mini',
    'o1',
    'o1-pro',
    'o1-mini',
    'o3',
    'o3-pro',
    'o3-mini',
    'o3-deep-research',
    'o4-mini',
    'o4-mini-deep-research',
    'codex-mini-latest',
  ],
  anthropic: [
    'claude-opus-4-20250514',
    'claude-sonnet-4-20250514',
    'claude-3-5-sonnet-20241022',
    'claude-3-7-sonnet-20250219',
    'claude-3-5-haiku-latest',
  ],
  google: [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite-preview-06-17',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
  ],
  mistral: [
    'magistral-medium-latest',
    'magistral-small-latest',
    'mistral-medium-latest',
    'mistral-large-latest',
    'pixtral-large-latest',
    'mistral-moderation-latest',
    'ministral-3b-latest',
    'ministral-8b-latest',
    'open-mistral-nemo',
    'mistral-small-latest',
    'devstral-small-latest',
    'mistral-saba-latest',
    'codestral-latest',
    'mistral-ocr-latest',
  ],
  deepseek:[
    'deepseek-chat',
    'deepseek-reasoner'
  ]

};
