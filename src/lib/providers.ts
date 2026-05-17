export interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  requiresKey: boolean;
  keyPlaceholder: string;
  keyHint: string;
  models: { id: string; label: string }[];
  defaultModel: string;
  docsUrl: string;
}

export const PROVIDERS: AIProvider[] = [
  {
    id: "hackclub",
    name: "Hack Club AI",
    baseUrl: "https://ai.hackclub.com/proxy/v1",
    requiresKey: true,
    keyPlaceholder: "sk-hc-v1-...",
    keyHint: "Get a free key at ai.hackclub.com",
    docsUrl: "https://ai.hackclub.com",
    models: [
      { id: "qwen/qwen3-32b", label: "Qwen 3 32B" },
      { id: "deepseek/deepseek-r1", label: "DeepSeek R1" },
      { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
      { id: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash" },
      { id: "mistralai/mistral-small-3.1-24b-instruct", label: "Mistral Small 3.1" },
    ],
    defaultModel: "qwen/qwen3-32b",
  },
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    requiresKey: true,
    keyPlaceholder: "sk-...",
    keyHint: "Get your key at platform.openai.com",
    docsUrl: "https://platform.openai.com",
    models: [
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini" },
      { id: "gpt-4-turbo", label: "GPT-4 Turbo" },
      { id: "o1", label: "o1" },
      { id: "o3-mini", label: "o3-mini" },
    ],
    defaultModel: "gpt-4o",
  },
  {
    id: "cerebras",
    name: "Cerebras",
    baseUrl: "https://api.cerebras.ai/v1",
    requiresKey: true,
    keyPlaceholder: "csk-...",
    keyHint: "Get your key at cloud.cerebras.ai — ultra-fast inference",
    docsUrl: "https://cloud.cerebras.ai",
    models: [
      { id: "llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout 17B" },
      { id: "llama-3.3-70b", label: "Llama 3.3 70B" },
      { id: "llama3.1-8b", label: "Llama 3.1 8B" },
    ],
    defaultModel: "llama-3.3-70b",
  },
  {
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    requiresKey: true,
    keyPlaceholder: "gsk_...",
    keyHint: "Get your key at console.groq.com — very fast",
    docsUrl: "https://console.groq.com",
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
      { id: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 Distill 70B" },
      { id: "gemma2-9b-it", label: "Gemma 2 9B" },
    ],
    defaultModel: "llama-3.3-70b-versatile",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    requiresKey: true,
    keyPlaceholder: "sk-or-v1-...",
    keyHint: "Get your key at openrouter.ai — access 200+ models",
    docsUrl: "https://openrouter.ai",
    models: [
      { id: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4" },
      { id: "anthropic/claude-3.5-haiku", label: "Claude 3.5 Haiku" },
      { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
      { id: "openai/gpt-4o", label: "GPT-4o (via OR)" },
    ],
    defaultModel: "anthropic/claude-sonnet-4",
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    baseUrl: "http://localhost:11434/v1",
    requiresKey: false,
    keyPlaceholder: "ollama",
    keyHint: "No key needed — runs fully locally on your Mac",
    docsUrl: "https://ollama.com",
    models: [
      { id: "llama3.2", label: "Llama 3.2" },
      { id: "llama3.1:70b", label: "Llama 3.1 70B" },
      { id: "mistral", label: "Mistral 7B" },
      { id: "deepseek-r1:14b", label: "DeepSeek R1 14B" },
      { id: "qwen2.5:14b", label: "Qwen 2.5 14B" },
    ],
    defaultModel: "llama3.2",
  },
];

const PROVIDER_KEY = "jarvis_provider_id";
const MODEL_KEY = "jarvis_model_id";
const KEYS_PREFIX = "jarvis_key_";

export function getSelectedProvider(): AIProvider {
  const id = localStorage.getItem(PROVIDER_KEY) || "hackclub";
  return PROVIDERS.find((p) => p.id === id) || PROVIDERS[0];
}

export function setSelectedProvider(id: string) {
  localStorage.setItem(PROVIDER_KEY, id);
}

export function getSelectedModel(providerId?: string): string {
  const pid = providerId || getSelectedProvider().id;
  const provider = PROVIDERS.find((p) => p.id === pid) || PROVIDERS[0];
  return localStorage.getItem(`${MODEL_KEY}_${pid}`) || provider.defaultModel;
}

export function setSelectedModel(providerId: string, modelId: string) {
  localStorage.setItem(`${MODEL_KEY}_${providerId}`, modelId);
}

export function getProviderKey(providerId: string): string {
  if (providerId === "ollama") return "ollama";
  return localStorage.getItem(`${KEYS_PREFIX}${providerId}`) || "";
}

export function setProviderKey(providerId: string, key: string) {
  localStorage.setItem(`${KEYS_PREFIX}${providerId}`, key);
}
