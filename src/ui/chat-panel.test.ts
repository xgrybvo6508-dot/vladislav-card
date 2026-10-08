// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { askProfile } from "../chat/client";
import { ChatClientError } from "../chat/errors";
import { SETTINGS_STORAGE_KEY, type ChatSettings } from "../chat/settings";
import { createChatPanel } from "./chat-panel";

vi.mock("../chat/client", () => ({
  askProfile: vi.fn(),
}));

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

const settings: ChatSettings = {
  preset: "custom",
  baseUrl: "https://example.test/v1",
  model: "test-model",
  apiKey: "test-placeholder",
};

function buttonByText(root: ParentNode, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll<HTMLButtonElement>("button")].find(
    (candidate) => candidate.textContent === text,
  );
  if (button === undefined) throw new Error(`Missing ${text} button.`);
  return button;
}

function setup(): {
  readonly panel: HTMLElement;
  readonly storage: MemoryStorage;
  readonly form: HTMLFormElement;
  readonly question: HTMLInputElement;
  readonly status: HTMLParagraphElement;
} {
  const storage = new MemoryStorage();
  storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  storage.writes.length = 0;
  const panel = createChatPanel(storage);
  document.body.append(panel);
  buttonByText(panel, "Open chat").click();

  const form = panel.querySelector<HTMLFormElement>(".chat-form");
  const question = panel.querySelector<HTMLInputElement>('[name="question"]');
  const status = panel.querySelector<HTMLParagraphElement>(".live-status");
  if (form === null || question === null || status === null) {
    throw new Error("Chat controls were not created.");
  }
  return { panel, storage, form, question, status };
}

function submit(form: HTMLFormElement): void {
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

afterEach(() => {
  vi.mocked(askProfile).mockReset();
  document.body.replaceChildren();
});

describe("chat panel", () => {
  it("renders assistant content as text and announces success in the live status", async () => {
    const modelText = '<img src="bad" onerror="bad()"> **plain text**';
    vi.mocked(askProfile).mockResolvedValue(modelText);
    const { panel, storage, form, question, status } = setup();
    question.value = "What projects are listed?";

    submit(form);

    await vi.waitFor(() => {
      expect(status.textContent).toBe("Answer received.");
    });
    const answer = panel.querySelector<HTMLElement>(".chat-answer");
    const answerText = answer?.querySelector("p");
    expect(answer?.hidden).toBe(false);
    expect(answerText?.textContent).toBe(modelText);
    expect(answerText?.querySelector("img")).toBeNull();
    expect(status.getAttribute("role")).toBe("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.getAttribute("aria-atomic")).toBe("true");
    expect(status.dataset.state).toBe("success");
    expect(storage.writes).toEqual([]);
  });

  it("disables duplicate submission while pending and exposes cancellation", async () => {
    vi.mocked(askProfile).mockImplementation(
      ({ signal }) =>
        new Promise((_resolve, reject) => {
          signal?.addEventListener(
            "abort",
            () => reject(new ChatClientError("cancelled")),
            { once: true },
          );
        }),
    );
    const { panel, form, question, status } = setup();
    question.value = "What projects are listed?";
    const ask = buttonByText(panel, "Ask");
    const settingsButton = buttonByText(panel, "Settings");
    const cancel = buttonByText(panel, "Cancel request");

    submit(form);

    expect(form.getAttribute("aria-busy")).toBe("true");
    expect(question.disabled).toBe(true);
    expect(ask.disabled).toBe(true);
    expect(settingsButton.disabled).toBe(true);
    expect(cancel.hidden).toBe(false);
    expect(cancel.disabled).toBe(false);
    expect(status.textContent).toBe("Sending question.");
    expect(vi.mocked(askProfile)).toHaveBeenCalledOnce();

    submit(form);
    expect(vi.mocked(askProfile)).toHaveBeenCalledOnce();

    cancel.click();
    expect(status.textContent).toBe("Stopping request.");

    await vi.waitFor(() => {
      expect(status.textContent).toBe("The request was stopped.");
    });
    expect(status.dataset.state).toBe("error");
    expect(form.getAttribute("aria-busy")).toBe("false");
    expect(question.disabled).toBe(false);
    expect(ask.disabled).toBe(false);
    expect(settingsButton.disabled).toBe(false);
    expect(cancel.hidden).toBe(true);
    expect(document.activeElement).toBe(question);
  });

  it("announces settings changes through the same polite live region", () => {
    const { panel, status } = setup();
    const settingsButton = buttonByText(panel, "Settings");
    settingsButton.click();

    const provider = panel.querySelector<HTMLSelectElement>('[name="provider"]');
    const baseUrl = panel.querySelector<HTMLInputElement>('[name="baseUrl"]');
    const model = panel.querySelector<HTMLInputElement>('[name="model"]');
    const apiKey = panel.querySelector<HTMLInputElement>('[name="apiKey"]');
    const settingsForm = panel.querySelector<HTMLFormElement>(".settings-form");
    if (
      provider === null ||
      baseUrl === null ||
      model === null ||
      apiKey === null ||
      settingsForm === null
    ) {
      throw new Error("Settings form was not created.");
    }

    provider.value = "custom";
    baseUrl.value = "https://example.test/v1";
    model.value = "test-model";
    apiKey.value = "";
    submit(settingsForm);

    expect(status.textContent).toBe("Settings saved.");
    expect(status.dataset.state).toBe("success");
  });
});
