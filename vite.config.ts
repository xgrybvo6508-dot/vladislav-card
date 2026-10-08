import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self' data:",
  // Visitors select the OpenAI-compatible HTTPS origin at runtime.
  "connect-src 'self' https: http://localhost:* http://127.0.0.1:*",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-src 'none'",
  "worker-src 'none'",
].join("; ");

function injectProductionCsp(): Plugin {
  return {
    name: "inject-production-csp",
    transformIndexHtml: {
      order: "post",
      handler(html, context) {
        if (!context.bundle) return html;

        return html.replace(
          "<head>",
          `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}">`,
        );
      },
    },
  };
}

export default defineConfig({
  base: "/vladislav-card/",
  plugins: [injectProductionCsp()],
  build: {
    target: "es2022",
  },
  test: {
    environment: "node",
    restoreMocks: true,
  },
});
