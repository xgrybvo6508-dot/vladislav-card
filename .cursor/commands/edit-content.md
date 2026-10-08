# Edit profile content

Edit the section or fact named after the command.

1. Read `.cursor/rules/00-user-context.mdc` and `.cursor/rules/20-content-privacy.mdc`.
2. Use the `content-writer` agent to make the smallest needed change in `src/content/profile.ts`. Do not put profile copy in any other file.
3. If link-preview wording must match, update only the corresponding static metadata in `index.html`; keep the profile data as the source of truth.
4. Use the read-only `privacy-reviewer` on every changed string and fix every violation it reports.
5. Run `npm run typecheck` and the privacy scan from `/privacy-check` when the project is set up.

Reply with the sections changed and the privacy result. Never add a private fact merely because it was requested; ask Vladislav when the fact is outside the approved public list.
