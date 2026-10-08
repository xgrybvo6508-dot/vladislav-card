import { askProfile } from "../chat/client";
import { getChatErrorMessage } from "../chat/errors";
import { buildSystemPrompt } from "../chat/prompt";
import { loadSettings } from "../chat/settings";
import { profile } from "../content/profile";
import { createSettingsDialog } from "./settings-dialog";

type StatusState = "idle" | "success" | "error";

function setStatus(
  status: HTMLParagraphElement,
  message: string,
  state: StatusState = "idle",
): void {
  status.textContent = message;
  status.dataset.state = state;
}

export function createChatPanel(storage: Storage): HTMLElement {
  const section = document.createElement("section");
  section.className = "chat-panel";
  section.setAttribute("aria-labelledby", "chat-title");

  const headingRow = document.createElement("div");
  headingRow.className = "chat-heading-row";

  const headingCopy = document.createElement("div");
  headingCopy.className = "chat-heading-copy";
  const kicker = document.createElement("p");
  kicker.className = "chat-kicker";
  kicker.textContent = "Optional AI";
  const heading = document.createElement("h2");
  heading.id = "chat-title";
  heading.textContent = "Ask about me";
  const description = document.createElement("p");
  description.className = "chat-description";
  description.textContent = "Ask one question using the public facts on this page.";
  headingCopy.append(kicker, heading, description);

  const toggleButton = document.createElement("button");
  toggleButton.className = "quiet-button chat-toggle";
  toggleButton.type = "button";
  toggleButton.textContent = "Open chat";
  toggleButton.setAttribute("aria-expanded", "false");
  toggleButton.setAttribute("aria-controls", "chat-content");
  headingRow.append(headingCopy, toggleButton);

  const chatContent = document.createElement("div");
  chatContent.id = "chat-content";
  chatContent.className = "chat-content";
  chatContent.hidden = true;

  const chatControls = document.createElement("div");
  chatControls.className = "chat-controls";
  const settingsButton = document.createElement("button");
  settingsButton.className = "quiet-button";
  settingsButton.type = "button";
  settingsButton.textContent = "Settings";
  settingsButton.setAttribute("aria-haspopup", "dialog");
  chatControls.append(settingsButton);

  const form = document.createElement("form");
  form.className = "chat-form";

  const questionLabel = document.createElement("label");
  questionLabel.className = "field";
  const questionLabelText = document.createElement("span");
  questionLabelText.textContent = "Question";
  const question = document.createElement("input");
  question.type = "text";
  question.name = "question";
  question.autocomplete = "off";
  question.placeholder = "What projects are listed?";
  question.required = true;
  question.maxLength = 500;
  question.setAttribute("aria-describedby", "chat-privacy-note");
  questionLabel.append(questionLabelText, question);

  const privacyNote = document.createElement("p");
  privacyNote.id = "chat-privacy-note";
  privacyNote.className = "privacy-note";
  privacyNote.textContent =
    "Your question is sent only to the API URL you choose. Questions and answers are not saved.";

  const actions = document.createElement("div");
  actions.className = "chat-actions";
  const submit = document.createElement("button");
  submit.className = "chat-submit";
  submit.type = "submit";
  submit.textContent = "Ask";
  const cancel = document.createElement("button");
  cancel.className = "cancel-request";
  cancel.type = "button";
  cancel.textContent = "Cancel request";
  cancel.hidden = true;
  actions.append(submit, cancel);

  const status = document.createElement("p");
  status.className = "live-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.setAttribute("aria-atomic", "true");

  const answer = document.createElement("section");
  answer.className = "chat-answer";
  answer.hidden = true;
  answer.setAttribute("aria-labelledby", "chat-answer-title");
  const answerHeading = document.createElement("h3");
  answerHeading.id = "chat-answer-title";
  answerHeading.textContent = "Answer";
  const answerText = document.createElement("p");
  answer.append(answerHeading, answerText);

  form.append(questionLabel, privacyNote, actions);
  chatContent.append(chatControls, form, status, answer);
  section.append(headingRow, chatContent);

  const settingsDialog = createSettingsDialog({
    trigger: settingsButton,
    storage,
    onSettingsChange: (message) => setStatus(status, message, "success"),
  });
  section.append(settingsDialog);

  let activeController: AbortController | null = null;

  toggleButton.addEventListener("click", () => {
    const isOpening = chatContent.hidden;
    chatContent.hidden = !isOpening;
    toggleButton.setAttribute("aria-expanded", String(isOpening));
    toggleButton.textContent = isOpening ? "Close chat" : "Open chat";

    if (isOpening) {
      question.focus();
    } else if (activeController !== null) {
      activeController.abort();
    }
  });

  const setPending = (pending: boolean): void => {
    form.setAttribute("aria-busy", String(pending));
    question.disabled = pending;
    submit.disabled = pending;
    settingsButton.disabled = pending;
    cancel.hidden = !pending;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const questionText = question.value.trim();
    if (questionText === "" || activeController !== null) {
      if (questionText === "") question.focus();
      return;
    }

    let settings;
    try {
      settings = loadSettings(storage);
    } catch {
      setStatus(status, "Settings could not be read in this browser.", "error");
      return;
    }

    const controller = new AbortController();
    activeController = controller;
    setPending(true);
    answer.hidden = true;
    answerText.textContent = "";
    setStatus(status, "Sending question.");

    try {
      const response = await askProfile({
        settings,
        systemPrompt: buildSystemPrompt(profile),
        question: questionText,
        signal: controller.signal,
      });
      answerText.textContent = response;
      answer.hidden = false;
      setStatus(status, "Answer received.", "success");
    } catch (error: unknown) {
      setStatus(status, getChatErrorMessage(error), "error");
    } finally {
      if (activeController === controller) {
        activeController = null;
        setPending(false);
        if (chatContent.hidden) {
          toggleButton.focus();
        } else {
          question.focus();
        }
      }
    }
  });

  cancel.addEventListener("click", () => {
    if (activeController === null) return;
    setStatus(status, "Stopping request.");
    activeController.abort();
  });

  return section;
}
