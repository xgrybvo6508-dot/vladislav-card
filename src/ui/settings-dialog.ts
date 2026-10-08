import {
  clearSavedKey,
  EMPTY_SETTINGS,
  getPreset,
  loadSettings,
  normalizeBaseUrl,
  PROVIDER_PRESETS,
  saveSettings,
  type ChatSettings,
  type ProviderPresetId,
} from "../chat/settings";

export interface SettingsDialogOptions {
  readonly trigger: HTMLButtonElement;
  readonly storage: Storage;
  readonly onSettingsChange: (message: string) => void;
}

function createField(
  labelText: string,
  control: HTMLInputElement | HTMLSelectElement,
): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = "field";

  const text = document.createElement("span");
  text.textContent = labelText;
  label.append(text, control);
  return label;
}

function readSettings(storage: Storage): ChatSettings {
  try {
    return loadSettings(storage);
  } catch {
    return EMPTY_SETTINGS;
  }
}

function getFocusableElements(dialog: HTMLDialogElement): HTMLElement[] {
  return Array.from(
    dialog.querySelectorAll<HTMLElement>(
      "button:not([disabled]), input:not([disabled]), select:not([disabled]), " +
        '[href], [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("hidden"));
}

export function createSettingsDialog(
  options: SettingsDialogOptions,
): HTMLDialogElement {
  const dialog = document.createElement("dialog");
  dialog.className = "settings-dialog";
  dialog.setAttribute("aria-labelledby", "settings-title");
  dialog.setAttribute("aria-describedby", "settings-privacy");

  const content = document.createElement("div");
  content.className = "dialog-content";

  const header = document.createElement("header");
  header.className = "dialog-header";
  const title = document.createElement("h2");
  title.id = "settings-title";
  title.textContent = "Chat settings";
  const privacy = document.createElement("p");
  privacy.id = "settings-privacy";
  privacy.textContent =
    "Settings stay in this browser. Your key is sent only to the API URL you choose.";
  header.append(title, privacy);

  const form = document.createElement("form");
  form.className = "settings-form";
  form.noValidate = true;

  const provider = document.createElement("select");
  provider.name = "provider";
  for (const preset of PROVIDER_PRESETS) {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.label;
    provider.append(option);
  }

  const baseUrl = document.createElement("input");
  baseUrl.name = "baseUrl";
  baseUrl.type = "url";
  baseUrl.setAttribute("autocomplete", "url");
  baseUrl.inputMode = "url";
  baseUrl.required = true;

  const model = document.createElement("input");
  model.name = "model";
  model.type = "text";
  model.autocomplete = "off";
  model.required = true;

  const apiKey = document.createElement("input");
  apiKey.name = "apiKey";
  apiKey.type = "password";
  apiKey.autocomplete = "off";
  apiKey.spellcheck = false;
  apiKey.setAttribute("aria-describedby", "saved-key-state");

  const savedKeyState = document.createElement("p");
  savedKeyState.id = "saved-key-state";
  savedKeyState.className = "saved-key-state";
  savedKeyState.setAttribute("aria-live", "polite");

  const status = document.createElement("p");
  status.className = "dialog-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const actions = document.createElement("div");
  actions.className = "dialog-actions";

  const save = document.createElement("button");
  save.className = "chat-submit dialog-save";
  save.type = "submit";
  save.textContent = "Save";

  const cancel = document.createElement("button");
  cancel.className = "quiet-button";
  cancel.type = "button";
  cancel.textContent = "Cancel";

  const clearKey = document.createElement("button");
  clearKey.className = "quiet-button clear-key";
  clearKey.type = "button";
  clearKey.textContent = "Clear saved key";

  actions.append(save, cancel, clearKey);
  form.append(
    createField("Provider", provider),
    createField("Base URL", baseUrl),
    createField("Model", model),
    createField("API key", apiKey),
    savedKeyState,
    status,
    actions,
  );
  content.append(header, form);
  dialog.append(content);

  let currentSettings = EMPTY_SETTINGS;

  const updateSavedKeyState = (): void => {
    const hasSavedKey = currentSettings.apiKey !== "";
    savedKeyState.textContent = hasSavedKey
      ? "A key is saved. Enter a new key only to replace it."
      : "No key is saved.";
    apiKey.placeholder = hasSavedKey ? "Saved key is masked" : "Enter an API key";
  };

  const populate = (): void => {
    currentSettings = readSettings(options.storage);
    provider.value = currentSettings.preset;
    baseUrl.value = currentSettings.baseUrl;
    model.value = currentSettings.model;
    apiKey.value = "";
    baseUrl.setCustomValidity("");
    model.setCustomValidity("");
    apiKey.setCustomValidity("");
    status.textContent = "";
    updateSavedKeyState();
  };

  const closeDialog = (): void => {
    if (dialog.open) dialog.close();
  };

  options.trigger.addEventListener("click", () => {
    populate();
    dialog.showModal();
    provider.focus();
  });

  provider.addEventListener("change", () => {
    const preset = getPreset(provider.value as ProviderPresetId);
    baseUrl.value = preset.baseUrl;
    model.value = preset.model;
    baseUrl.setCustomValidity("");
    model.setCustomValidity("");
  });

  baseUrl.addEventListener("input", () => baseUrl.setCustomValidity(""));
  model.addEventListener("input", () => model.setCustomValidity(""));
  apiKey.addEventListener("input", () => apiKey.setCustomValidity(""));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const normalizedUrl = normalizeBaseUrl(baseUrl.value);
    if (!normalizedUrl.ok) {
      baseUrl.setCustomValidity(normalizedUrl.error);
      baseUrl.reportValidity();
      baseUrl.focus();
      return;
    }

    if (model.value.trim() === "") {
      model.setCustomValidity("Enter a model name.");
      model.reportValidity();
      model.focus();
      return;
    }

    const nextKey = apiKey.value === "" ? currentSettings.apiKey : apiKey.value;
    if (nextKey === "") {
      apiKey.setCustomValidity("Enter an API key.");
      apiKey.reportValidity();
      apiKey.focus();
      return;
    }

    const nextSettings: ChatSettings = {
      preset: provider.value as ProviderPresetId,
      baseUrl: normalizedUrl.value,
      model: model.value.trim(),
      apiKey: nextKey,
    };

    try {
      saveSettings(options.storage, nextSettings);
    } catch {
      status.textContent = "Settings could not be saved in this browser.";
      return;
    }

    currentSettings = nextSettings;
    apiKey.value = "";
    options.onSettingsChange("Settings saved.");
    closeDialog();
  });

  clearKey.addEventListener("click", () => {
    try {
      currentSettings = clearSavedKey(options.storage);
    } catch {
      status.textContent = "The saved key could not be cleared.";
      return;
    }
    apiKey.value = "";
    apiKey.setCustomValidity("");
    updateSavedKeyState();
    status.textContent = "Saved key cleared.";
    options.onSettingsChange("Saved key cleared.");
  });

  cancel.addEventListener("click", closeDialog);

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog();
  });

  dialog.addEventListener("close", () => options.trigger.focus());

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = getFocusableElements(dialog);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (first === undefined || last === undefined) {
      event.preventDefault();
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  return dialog;
}
