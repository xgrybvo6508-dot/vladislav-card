// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { SETTINGS_STORAGE_KEY, type ChatSettings } from "../chat/settings";
import { createSettingsDialog } from "./settings-dialog";

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

const savedSettings: ChatSettings = {
  preset: "groq",
  baseUrl: "https://api.groq.com/openai/v1",
  model: "openai/gpt-oss-120b",
  apiKey: "test-placeholder",
};

function setup(storage = new MemoryStorage()): {
  readonly dialog: HTMLDialogElement;
  readonly trigger: HTMLButtonElement;
  readonly storage: MemoryStorage;
  readonly onSettingsChange: ReturnType<typeof vi.fn<(message: string) => void>>;
} {
  const trigger = document.createElement("button");
  trigger.textContent = "Settings";
  const onSettingsChange = vi.fn<(message: string) => void>();
  const dialog = createSettingsDialog({
    trigger,
    storage,
    onSettingsChange,
  });
  document.body.append(trigger, dialog);
  return { dialog, trigger, storage, onSettingsChange };
}

function control<T extends HTMLInputElement | HTMLSelectElement>(
  dialog: HTMLDialogElement,
  name: string,
): T {
  const element = dialog.querySelector<T>(`[name="${name}"]`);
  if (element === null) throw new Error(`Missing ${name} control.`);
  return element;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("settings dialog keyboard behavior", () => {
  it("opens with focus on the provider control and masks a saved key", () => {
    const storage = new MemoryStorage();
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(savedSettings));
    const { dialog, trigger } = setup(storage);

    trigger.click();

    const provider = control<HTMLSelectElement>(dialog, "provider");
    const apiKey = control<HTMLInputElement>(dialog, "apiKey");
    expect(dialog.open).toBe(true);
    expect(document.activeElement).toBe(provider);
    expect(provider.value).toBe("groq");
    expect(apiKey.type).toBe("password");
    expect(apiKey.value).toBe("");
    expect(apiKey.placeholder).toBe("Saved key is masked");
    expect(dialog.textContent).not.toContain(savedSettings.apiKey);
  });

  it("wraps Tab from the last control and Shift+Tab from the first control", () => {
    const { dialog, trigger } = setup();
    trigger.click();

    const provider = control<HTMLSelectElement>(dialog, "provider");
    const buttons = dialog.querySelectorAll<HTMLButtonElement>("button");
    const clearKey = buttons.item(buttons.length - 1);

    clearKey.focus();
    dialog.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Tab",
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(document.activeElement).toBe(provider);

    provider.focus();
    dialog.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Tab",
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(document.activeElement).toBe(clearKey);
  });

  it("closes on Escape and returns focus to the Settings trigger", () => {
    const { dialog, trigger } = setup();
    trigger.click();
    expect(document.activeElement).not.toBe(trigger);

    dialog.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });
});

describe("settings dialog storage boundary", () => {
  it("saves only vc:settings and reuses the masked saved key", () => {
    const storage = new MemoryStorage();
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(savedSettings));
    storage.writes.length = 0;
    const { dialog, trigger, onSettingsChange } = setup(storage);
    trigger.click();

    control<HTMLInputElement>(dialog, "baseUrl").value =
      "https://api.groq.com/openai/v1/";
    const form = dialog.querySelector<HTMLFormElement>("form");
    if (form === null) throw new Error("Missing settings form.");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(dialog.open).toBe(false);
    expect(storage.writes).toEqual([SETTINGS_STORAGE_KEY]);
    expect([...storage.values.keys()]).toEqual([SETTINGS_STORAGE_KEY]);
    expect(JSON.parse(storage.getItem(SETTINGS_STORAGE_KEY) ?? "")).toEqual(
      savedSettings,
    );
    expect(onSettingsChange).toHaveBeenCalledWith("Settings saved.");
    expect(document.activeElement).toBe(trigger);
  });

  it("clears the key while preserving the public provider fields", () => {
    const storage = new MemoryStorage();
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(savedSettings));
    storage.writes.length = 0;
    const { dialog, trigger, onSettingsChange } = setup(storage);
    trigger.click();

    const clearKey = [...dialog.querySelectorAll<HTMLButtonElement>("button")].find(
      (button) => button.textContent === "Clear saved key",
    );
    if (clearKey === undefined) throw new Error("Missing clear-key button.");
    clearKey.click();

    expect(storage.writes).toEqual([SETTINGS_STORAGE_KEY]);
    expect(JSON.parse(storage.getItem(SETTINGS_STORAGE_KEY) ?? "")).toEqual({
      ...savedSettings,
      apiKey: "",
    });
    expect(dialog.textContent).toContain("No key is saved.");
    expect(dialog.textContent).not.toContain(savedSettings.apiKey);
    expect(onSettingsChange).toHaveBeenCalledWith("Saved key cleared.");
  });
});
