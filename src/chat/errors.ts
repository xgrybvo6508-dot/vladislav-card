export type ChatErrorCode =
  | "missing-configuration"
  | "timeout"
  | "cancelled"
  | "network"
  | "unauthorized"
  | "not-found"
  | "rate-limited"
  | "request-rejected"
  | "server"
  | "invalid-response";

const ERROR_MESSAGES: Readonly<Record<ChatErrorCode, string>> = {
  "missing-configuration": "Open Settings and add a base URL, model, and API key.",
  timeout: "The API took too long to respond. Try again.",
  cancelled: "The request was stopped.",
  network:
    "The request could not reach the API. Check the base URL, provider CORS settings, and your connection.",
  unauthorized:
    "The API rejected the key or access. Check the API key and model access.",
  "not-found":
    "The API endpoint or model was not found. Check the base URL and model name.",
  "rate-limited": "The provider rate limit was reached. Wait, then try again.",
  "request-rejected": "The API rejected the request. Check the settings and try again.",
  server: "The API is unavailable. Try again later.",
  "invalid-response":
    "The API returned an unreadable response. Try again or choose another model.",
};

export class ChatClientError extends Error {
  readonly code: ChatErrorCode;

  constructor(code: ChatErrorCode) {
    super(ERROR_MESSAGES[code]);
    this.name = "ChatClientError";
    this.code = code;
  }
}

export function getChatErrorMessage(error: unknown): string {
  return error instanceof ChatClientError ? error.message : ERROR_MESSAGES.network;
}
