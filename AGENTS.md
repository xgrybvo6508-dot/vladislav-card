# AGENTS.md: Vladislav card

`Vladislav card` is a static, one-page AI card for new contacts. It explains who Vladislav is, what he builds, who he wants to collaborate with, how to communicate with him, and how to reach him. It is mobile-first and deploys to GitHub Pages at `https://xgrybvo6508-dot.github.io/vladislav-card/` with Vite base `/vladislav-card/`.

## Owner and public content

Vladislav Shamanov is 18, a student in the St. Petersburg area, autistic, has ADHD, and is twice-exceptional (2e). State this openly and respectfully; identity-first “autistic” is fine. He learns through mind maps, prefers minimalism, and communicates best through direct, concrete text with clear expectations; async is fine. All UI is simple literal English.

He builds:

- Discrete Tasks: a university discrete-math practice PWA with an AI agent and memory (`https://xgrybvo6508-dot.github.io/discrete-tasks/`);
- a daily-tasks planner;
- Idea Pulse: an Obsidian idea-scoring workflow;
- AI learning systems built around mind maps and interleaving.

He seeks adult collaborators/cofounders (18–25+) for AI and development projects. The only public contact is X `@VladislavSsqwl` (`https://x.com/VladislavSsqwl`).

All editable content belongs in `src/content/profile.ts`. Do not duplicate facts in UI or chat code.

## Hard privacy limit

Never include email, phone, exact address, school/university name, finances, family information, health details beyond “autistic / ADHD / 2e”, private links, secrets, or keys. Use the `privacy-reviewer` proactively before every commit.

## Product and stack

- Vite + vanilla strict TypeScript; no frameworks.
- `src/content`, `src/ui`, `src/chat`, `src/lib`; colocated vitest tests.
- Dark `#0e0f13` theme; green `#3ddc97` means primary/success, purple `#a78bfa` means AI/agent.
- Calm, minimal, ADHD-friendly, one primary action, no flashing, reduced-motion support, WCAG AA, keyboard access, visible focus, and 44px touch targets.
- System fonts and local assets only. No CDNs, trackers, analytics, or telemetry.
- Strong OG/Twitter metadata. `og:url` is the deployed URL and `og:image` is a generated static PNG under `public/`.

## Optional “Ask about me”

Settings contain an OpenAI-compatible key, base URL, and model. Store them only in localStorage key `vc:settings`. Presets:

- Groq: `https://api.groq.com/openai/v1`, model `openai/gpt-oss-120b`
- OpenRouter: `https://openrouter.ai/api/v1`
- Nous Portal: `https://inference-api.nousresearch.com/v1`, model `poolside/laguna-s-2.1:free`
- Custom

Build the system prompt only from `src/content/profile.ts`. Never invent facts. Unsupported answers must be exactly: `I don't know — ask Vladislav on X`.

## Cursor configuration

Rules in `.cursor/rules/`: owner context, project conventions, content privacy, design system, and security/secrets.

Agents in `.cursor/agents/`: `content-writer`, read-only `privacy-reviewer`, `ui-designer`, `prompt-engineer`, and `tester`.

Commands in `.cursor/commands/`: `/edit-content`, `/privacy-check`, `/review`, and `/ship`.

Hooks in `.cursor/hooks.json`: dangerous-shell guard, secret-file read guard, post-edit Prettier, post-edit privacy scan, and stop-time secret scan. Test them with `bash .cursor/hooks/test-hooks.sh`.

## Done and safety

Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`, followed by secret and privacy scans. Never touch `~/.hermes`, never read secret files, and never run `git push`; the human deploys.
