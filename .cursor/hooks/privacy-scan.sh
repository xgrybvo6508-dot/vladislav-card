#!/usr/bin/env bash
# afterFileEdit hook: warn about private-data patterns in edited src/** files
# and index.html. With {"scan_all":true}, scan every in-scope project file.
# Reports categories and line numbers only. Always exits 0 with valid JSON.
set -u

DONE=0
finish() {
  [ "$DONE" = 1 ] || printf '{}\n'
  trap - EXIT
  exit 0
}
trap finish EXIT

input=$(cat 2>/dev/null || true)
command -v jq >/dev/null 2>&1 || exit 0

root=$(printf '%s' "$input" | jq -r '.workspace_roots[0] // ""' 2>/dev/null) || root=""
file=$(printf '%s' "$input" | jq -r '.file_path // ""' 2>/dev/null) || file=""
scan_all=$(printf '%s' "$input" | jq -r '.scan_all // false' 2>/dev/null) || scan_all=false
root=${root:-$PWD}
root=$(realpath -m -- "$root" 2>/dev/null) || exit 0

files=""
if [ "$scan_all" = "true" ]; then
  files=$(git -C "$root" ls-files --cached --others --exclude-standard -- src index.html 2>/dev/null || true)
elif [ -n "$file" ]; then
  case "$file" in
    /*) abs=$file ;;
    *) abs="$root/$file" ;;
  esac
  abs=$(realpath -m -- "$abs" 2>/dev/null) || exit 0
  case "$abs" in "$root"/*) files=${abs#"$root"/} ;; *) exit 0 ;; esac
fi

hits=""
add_hit() {
  local rel=$1 category=$2 pattern=$3 lines
  if [ "$category" = "phone-like number" ]; then
    # Ignore mandated local-development hosts and CSS rgb() tuples while
    # retaining the broad phone check for public prose.
    lines=$(
      grep -nEI -- "$pattern" "$root/$rel" 2>/dev/null |
        grep -vE '127\.0\.0\.1|rgb\(' |
        cut -d: -f1 |
        sort -nu |
        paste -sd, -
    )
  else
    lines=$(grep -nEI -- "$pattern" "$root/$rel" 2>/dev/null | cut -d: -f1 | sort -nu | paste -sd, -)
  fi
  [ -n "$lines" ] || return 0
  hits="${hits:+$hits; }$rel: $category (line $lines)"
}

while IFS= read -r rel; do
  [ -n "$rel" ] && [ -f "$root/$rel" ] || continue
  case "$rel" in src/* | index.html) ;; *) continue ;; esac

  add_hit "$rel" "email address" '[[:alnum:]_.%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}'
  add_hit "$rel" "private mail domain" '@(gmail(\.com)?|mail\.ru|yandex(\.[[:alpha:]]{2,})?)'
  add_hit "$rel" "phone-like number" '(^|[^[:alnum:]_])\+?[0-9][0-9() .-]{7,}[0-9]([^[:alnum:]_]|$)'
  add_hit "$rel" "street-address marker" '(^|[^[:alnum:]_])ul\.|(^|[^[:alnum:]_])street[[:space:]]+[0-9]+'
done <<<"$files"

[ -n "$hits" ] || exit 0

message="Privacy warning: possible private data found in $hits. Check against .cursor/rules/20-content-privacy.mdc and remove private values. Do not repeat the matched value."
jq -cn --arg m "$message" '{followup_message:$m}'
DONE=1
