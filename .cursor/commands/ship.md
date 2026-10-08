# Ship

Prepare Vladislav card for the human to deploy. Stop at the first failed step and report it.

1. `npm run typecheck`
2. `npm run lint`
3. `npm test`
4. `npm run build`
5. Confirm `dist/` uses the `/vladislav-card/` base and contains the required OG/Twitter metadata and local OG PNG.
6. Run the read-only `privacy-reviewer`, then:

```bash
jq -cn --arg r "$PWD" '{scan_all:true,workspace_roots:[$r]}' | .cursor/hooks/privacy-scan.sh
printf '{"status":"completed"}' | .cursor/hooks/secret-scan.sh
```

Both scans must return `{}`.

If all steps pass, report a compact PASS checklist and state that `.github/workflows/deploy.yml` will publish `dist/` to `https://xgrybvo6508-dot.github.io/vladislav-card/` after the human commits and pushes.

Never run `git push`; the human deploys. Never force-push, rewrite remote history, or bypass a failed check.
