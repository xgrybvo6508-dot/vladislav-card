import { getString, isRecord } from "../lib/guards";
import { failure, success, type Result } from "../lib/result";

export const SETTINGS_STORAGE_KEY = "vc:settings";

export type ProviderPresetId = "groq" | "openrouter" | "nous" | "custom";

export interface ProviderPreset {
  readonly id: ProviderPresetId;
  readonly label: string;
  readonly baseUrl: string;
  readonly model: string;
}

export interface ChatSettings {
  readonly preset: ProviderPresetId;
  readonly baseUrl: string;
  readonly model: string;
  readonly apiKey: string;
}

export const PROVIDER_PRESETS: readonly ProviderPreset[] = [
  {
    id: "groq",
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "openai/gpt-oss-120b",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "",
  },
  {
    id: "nous",
    label: "Nous Portal",
    baseUrl: "https://inference-api.nousresearch.com/v1",
    model: "poolside/laguna-s-2.1:free",
  },
  { id: "custom", label: "Custom", baseUrl: "", model: "" },
] as const;

export const EMPTY_SETTINGS: ChatSettings = {
  preset: "custom",
  baseUrl: "",
  model: "",
  apiKey: "",
};

function isPresetId(value: string | undefined): value is ProviderPresetId {
  return PROVIDER_PRESETS.some((preset) => preset.id === value);
}

export function parseSettings(value: unknown): ChatSettings {
  if (!isRecord(value)) return EMPTY_SETTINGS;

  const presetValue = getString(value, "preset");
  const preset = isPresetId(presetValue) ? presetValue : "custom";
  const baseUrl = getString(value, "baseUrl") ?? "";
  const model = getString(value, "model") ?? "";
  const apiKey = getString(value, "apiKey") ?? "";

  const normalized = baseUrl === "" ? success("") : normalizeBaseUrl(baseUrl);
  if (!normalized.ok) return EMPTY_SETTINGS;

  return {
    preset,
    baseUrl: normalized.value,
    model: model.trim(),
    apiKey,
  };
}

export function normalizeBaseUrl(urlText: string): Result<string, string> {
  const trimmed = urlText.trim();
  if (trimmed === "") return failure("Enter a base URL.");

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return failure("Enter a valid base URL.");
  }

  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocal)) {
    return failure("Use HTTPS, or HTTP only for localhost development.");
  }
  if (url.username !== "" || url.password !== "") {
    return failure("The base URL must not contain credentials.");
  }
  if (url.hash !== "") return failure("The base URL must not contain a fragment.");
  if (url.search !== "") {
    return failure("The base URL must not contain query parameters.");
  }

  return success(url.toString().replace(/\/+$/, ""));
}

export function loadSettings(storage: Storage): ChatSettings {
  const raw = storage.getItem(SETTINGS_STORAGE_KEY);
  if (raw === null) return EMPTY_SETTINGS;

  try {
    return parseSettings(JSON.parse(raw) as unknown);
  } catch {
    return EMPTY_SETTINGS;
  }
}

export function saveSettings(storage: Storage, settings: ChatSettings): void {
  storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function clearSavedKey(storage: Storage): ChatSettings {
  const next = { ...loadSettings(storage), apiKey: "" };
  saveSettings(storage, next);
  return next;
}

export function getPreset(id: ProviderPresetId): ProviderPreset {
  const preset = PROVIDER_PRESETS.find((item) => item.id === id);
  if (preset === undefined) {
    throw new Error("Unknown provider preset.");
  }
  return preset;
}
