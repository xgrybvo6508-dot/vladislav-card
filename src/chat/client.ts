import { getString, isRecord } from "../lib/guards";
import { ChatClientError } from "./errors";
import { normalizeBaseUrl, type ChatSettings } from "./settings";

export const CHAT_TIMEOUT_MS = 20_000;

export interface AskProfileOptions {
  readonly settings: ChatSettings;
  readonly systemPrompt: string;
  readonly question: string;
  readonly fetchFn?: typeof fetch;
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
}

function requireConfiguration(settings: ChatSettings): string {
  const normalized = normalizeBaseUrl(settings.baseUrl);
  if (!normalized.ok || settings.model.trim() === "" || settings.apiKey === "") {
    throw new ChatClientError("missing-configuration");
  }
  return normalized.value;
}

function errorForStatus(status: number): ChatClientError {
  if (status === 401 || status === 403) {
    return new ChatClientError("unauthorized");
  }
  if (status === 404) return new ChatClientError("not-found");
  if (status === 429) return new ChatClientError("rate-limited");
  if (status >= 400 && status < 500) {
    return new ChatClientError("request-rejected");
  }
  return new ChatClientError("server");
}

function parseContent(value: unknown): string {
  if (!isRecord(value) || !Array.isArray(value.choices)) {
    throw new ChatClientError("invalid-response");
  }
  const choice = value.choices[0];
  if (!isRecord(choice) || !isRecord(choice.message)) {
    throw new ChatClientError("invalid-response");
  }
  const content = getString(choice.message, "content")?.trim();
  if (!content) throw new ChatClientError("invalid-response");
  return content;
}

export async function askProfile(options: AskProfileOptions): Promise<string> {
  const baseUrl = requireConfiguration(options.settings);
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? CHAT_TIMEOUT_MS;
  let timedOut = false;

  const stopFromCaller = (): void => controller.abort();
  options.signal?.addEventListener("abort", stopFromCaller, { once: true });
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await (options.fetchFn ?? fetch)(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.settings.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: options.settings.model.trim(),
        messages: [
          { role: "system", content: options.systemPrompt },
          { role: "user", content: options.question },
        ],
        temperature: 0.1,
        max_tokens: 220,
      }),
      signal: controller.signal,
    });

    if (!response.ok) throw errorForStatus(response.status);

    let body: unknown;
    try {
      body = (await response.json()) as unknown;
    } catch {
      throw new ChatClientError("invalid-response");
    }
    return parseContent(body);
  } catch (error: unknown) {
    if (error instanceof ChatClientError) throw error;
    if (controller.signal.aborted) {
      throw new ChatClientError(timedOut ? "timeout" : "cancelled");
    }
    throw new ChatClientError("network");
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener("abort", stopFromCaller);
  }
}
