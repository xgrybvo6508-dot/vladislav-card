# Vladislav card

A static, one-page introduction built with Vite and strict TypeScript. It is
designed for GitHub Pages at
`https://xgrybvo6508-dot.github.io/vladislav-card/`.

## Development

```sh
npm ci
npm run dev
```

Quality checks:

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Regenerate the committed social preview image after changing its profile copy:

```sh
npm run generate:og
```

## Edit public content

Edit `src/content/profile.ts`. It is the single source for the public profile,
project links, contact details, metadata values, grounded chat prompt, and
social preview image. Do not duplicate profile facts in UI or chat modules.

## Ask about me

Chat is optional. A visitor opens Settings and supplies an OpenAI-compatible
base URL, model, and API key. The settings are stored only in that browser
under the `vc:settings` local storage key. The API key is sent only in the
`Authorization` header to the selected base URL. Questions and responses are
not saved.

The client sends one question with a profile-derived system prompt. It renders
the response as plain text and does not execute model output.
