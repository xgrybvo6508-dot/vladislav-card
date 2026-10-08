import { describe, expect, it } from "vitest";
import {
  clearSavedKey,
  getPreset,
  loadSettings,
  normalizeBaseUrl,
  parseSettings,
  PROVIDER_PRESETS,
  saveSettings,
  SETTINGS_STORAGE_KEY,
  type ChatSettings,
} from "./settings";

class MemoryStorage implements Storage {
  readonly values = new Map<string, string>();
  readonly writes: string[] = [];

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.writes.push(key);
    this.values.set(key, value);
  }
}

const configured: ChatSettings = {
  preset: "groq",
  baseUrl: "https://api.groq.com/openai/v1",
  model: "openai/gpt-oss-120b",
  apiKey: "unit-test-placeholder",
};

const localIpv4 = ["127", "0", "0", "1"].join(".");

function credentialedBaseUrl(): string {
  const url = new URL("https://example.test/v1");
  url.username = "name";
  url.password = "password";
  return url.href;
}

describe("settings", () => {
  it("provides all approved public presets", () => {
    expect(PROVIDER_PRESETS).toEqual([
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
    ]);
    expect(getPreset("groq")).toBe(PROVIDER_PRESETS[0]);
    expect(getPreset("openrouter")).toBe(PROVIDER_PRESETS[1]);
    expect(getPreset("nous")).toBe(PROVIDER_PRESETS[2]);
    expect(getPreset("custom")).toBe(PROVIDER_PRESETS[3]);
  });

  it("accepts HTTPS and local HTTP, then removes trailing slashes", () => {
    expect(normalizeBaseUrl("https://example.test/v1///")).toEqual({
      ok: true,
      value: "https://example.test/v1",
    });
    expect(normalizeBaseUrl("http://localhost:8080/v1/").ok).toBe(true);
    expect(normalizeBaseUrl(`http://${localIpv4}:8080/v1/`).ok).toBe(true);
  });

  it.each([
    "http://example.test/v1",
    "ftp://example.test/v1",
    credentialedBaseUrl(),
    "https://example.test/v1#part",
    "https://example.test/v1?key=value",
    "http://localhost.example.test/v1",
    `http://${localIpv4}.example.test/v1`,
    "",
    "not a URL",
  ])("rejects unsafe base URL %s", (url) => {
    expect(normalizeBaseUrl(url).ok).toBe(false);
  });

  it("validates unknown settings data and normalizes safe fields", () => {
    expect(
      parseSettings({
        preset: "groq",
        baseUrl: "https://api.groq.com/openai/v1///",
        model: "  openai/gpt-oss-120b  ",
        apiKey: configured.apiKey,
        extra: "ignored",
      }),
    ).toEqual(configured);
    expect(
      parseSettings({
        preset: "unknown",
        baseUrl: "",
        model: 5,
        apiKey: false,
      }),
    ).toEqual({
      preset: "custom",
      baseUrl: "",
      model: "",
      apiKey: "",
    });
    expect(parseSettings(["not", "settings"])).toEqual({
      preset: "custom",
      baseUrl: "",
      model: "",
      apiKey: "",
    });
  });

  it("falls back safely for malformed, legacy, and unsafe storage data", () => {
    const storage = new MemoryStorage();
    storage.setItem(SETTINGS_STORAGE_KEY, "{bad");
    expect(loadSettings(storage)).toEqual({
      preset: "custom",
      baseUrl: "",
      model: "",
      apiKey: "",
    });

    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ baseUrl: 4 }));
    expect(loadSettings(storage)).toEqual({
      preset: "custom",
      baseUrl: "",
      model: "",
      apiKey: "",
    });

    storage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        ...configured,
        baseUrl: credentialedBaseUrl(),
      }),
    );
    expect(loadSettings(storage)).toEqual({
      preset: "custom",
      baseUrl: "",
      model: "",
      apiKey: "",
    });
  });

  it("writes only the settings key and clears only the saved key", () => {
    const storage = new MemoryStorage();
    saveSettings(storage, configured);
    expect(storage.writes).toEqual([SETTINGS_STORAGE_KEY]);

    const cleared = clearSavedKey(storage);
    expect(cleared).toEqual({ ...configured, apiKey: "" });
    expect(storage.writes).toEqual([SETTINGS_STORAGE_KEY, SETTINGS_STORAGE_KEY]);
    expect([...storage.values.keys()]).toEqual([SETTINGS_STORAGE_KEY]);
  });
});
