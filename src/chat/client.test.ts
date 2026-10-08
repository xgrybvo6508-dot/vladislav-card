import { describe, expect, it, vi } from "vitest";
import { askProfile, CHAT_TIMEOUT_MS } from "./client";
import { ChatClientError } from "./errors";
import type { ChatSettings } from "./settings";

const settings: ChatSettings = {
  preset: "custom",
  baseUrl: "https://api.example.test/v1/",
  model: "test-model",
  apiKey: "unit-test-placeholder",
};

function response(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("askProfile", () => {
  it("sends a minimal OpenAI-compatible request and returns text", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        response(200, { choices: [{ message: { content: "Hello" } }] }),
      );

    await expect(
      askProfile({
        settings,
        systemPrompt: "Public facts",
        question: "What do you build?",
        fetchFn,
      }),
    ).resolves.toBe("Hello");

    expect(fetchFn).toHaveBeenCalledOnce();
    const call = fetchFn.mock.calls[0];
    if (call === undefined) throw new Error("Expected fetch to be called.");
    const [url, init] = call;
    expect(url).toBe("https://api.example.test/v1/chat/completions");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({
      Authorization: `Bearer ${settings.apiKey}`,
      "Content-Type": "application/json",
    });
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(body).toMatchObject({
      model: "test-model",
      temperature: 0.1,
      max_tokens: 220,
    });
    expect(String(url)).not.toContain("unit-test-placeholder");
    expect(String(init?.body)).not.toContain("unit-test-placeholder");
  });

  it.each([
    [401, "unauthorized"],
    [403, "unauthorized"],
    [404, "not-found"],
    [429, "rate-limited"],
    [400, "request-rejected"],
    [500, "server"],
  ] as const)(
    "maps HTTP %i to %s without reading response data",
    async (status, code) => {
      const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(response(status, {}));
      const promise = askProfile({
        settings,
        systemPrompt: "facts",
        question: "question",
        fetchFn,
      });
      await expect(promise).rejects.toMatchObject({ code });
      await expect(promise).rejects.not.toThrow("unit-test-placeholder");
    },
  );

  it("maps network failures to a safe error", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("failed"));
    await expect(
      askProfile({
        settings,
        systemPrompt: "facts",
        question: "question",
        fetchFn,
      }),
    ).rejects.toEqual(new ChatClientError("network"));
  });

  it.each([
    {},
    { choices: [] },
    { choices: [{ message: {} }] },
    { choices: [{ message: { content: "  " } }] },
  ])("rejects an invalid response", async (body) => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(response(200, body));
    await expect(
      askProfile({
        settings,
        systemPrompt: "facts",
        question: "question",
        fetchFn,
      }),
    ).rejects.toMatchObject({ code: "invalid-response" });
  });

  it("rejects malformed JSON", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("not-json", { status: 200 }));
    await expect(
      askProfile({
        settings,
        systemPrompt: "facts",
        question: "question",
        fetchFn,
      }),
    ).rejects.toMatchObject({ code: "invalid-response" });
  });

  it("aborts after the finite timeout", async () => {
    vi.useFakeTimers();
    const fetchFn = vi.fn<typeof fetch>((_input, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });

    const pending = askProfile({
      settings,
      systemPrompt: "facts",
      question: "question",
      fetchFn,
    });
    const expectation = expect(pending).rejects.toMatchObject({
      code: "timeout",
    });
    await vi.advanceTimersByTimeAsync(CHAT_TIMEOUT_MS);
    await expectation;
    vi.useRealTimers();
  });

  it("maps caller cancellation and forwards it through the request signal", async () => {
    const caller = new AbortController();
    const requestSignals: AbortSignal[] = [];
    const fetchFn = vi.fn<typeof fetch>((_input, init) => {
      if (init?.signal !== null && init?.signal !== undefined) {
        requestSignals.push(init.signal);
      }
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        );
      });
    });

    const pending = askProfile({
      settings,
      systemPrompt: "facts",
      question: "question",
      fetchFn,
      signal: caller.signal,
    });
    caller.abort();

    await expect(pending).rejects.toEqual(new ChatClientError("cancelled"));
    expect(requestSignals).toHaveLength(1);
    expect(requestSignals[0]?.aborted).toBe(true);
  });

  it.each([
    [{ ...settings, baseUrl: "http://example.test/v1" }, "unsafe base URL"],
    [{ ...settings, model: "  " }, "blank model"],
    [{ ...settings, apiKey: "" }, "missing key"],
  ])("requires complete settings before fetch for %s", async (invalidSettings) => {
    const fetchFn = vi.fn<typeof fetch>();
    await expect(
      askProfile({
        settings: invalidSettings,
        systemPrompt: "facts",
        question: "question",
        fetchFn,
      }),
    ).rejects.toMatchObject({ code: "missing-configuration" });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("does not log requests, responses, credentials, or errors", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("failed"));

    await expect(
      askProfile({
        settings,
        systemPrompt: "facts",
        question: "question",
        fetchFn,
      }),
    ).rejects.toMatchObject({
      code: "network",
      message:
        "The request could not reach the API. Check the base URL, provider CORS settings, and your connection.",
    });
    expect(log).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});
