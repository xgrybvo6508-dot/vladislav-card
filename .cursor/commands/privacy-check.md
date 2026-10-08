# Privacy check

Audit all public and changed content before a commit.

1. Use the read-only `privacy-reviewer` proactively. It must inspect every changed string in source, `index.html`, metadata, tests, prompts, manifests, and public assets against `.cursor/rules/20-content-privacy.mdc`.
2. Run the deterministic repository privacy scan:

```bash
jq -cn --arg r "$PWD" '{scan_all:true,workspace_roots:[$r]}' | .cursor/hooks/privacy-scan.sh
```

3. Run the secret scan:

```bash
printf '{"status":"completed"}' | .cursor/hooks/secret-scan.sh
```

4. Report `PASS` only when the reviewer and both scans are clean. Otherwise report file, line, category, and a safe fix without repeating any private or secret value.
