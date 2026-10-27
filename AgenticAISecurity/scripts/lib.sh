# Shared helpers for deploy.sh and destroy.sh. Sourced, not executed.
# shellcheck shell=bash

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

APP_WORKER="seven-hills-agent"
MCP_WORKER="seven-hills-operations-mcp"
GUIDE_WORKER="agentic-ai-lab-portal"

ACCOUNT_ID_PATTERN='^[0-9a-f]{32}$'

info()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn()  { printf '\033[1;33mwarning:\033[0m %s\n' "$*" >&2; }
die()   { printf '\033[1;31merror:\033[0m %s\n' "$*" >&2; exit 1; }

# Load KEY=VALUE pairs from the repository .env, if present, without
# overriding variables already set in the environment.
load_env_file() {
  local file="$REPO_ROOT/.env" line key value
  [[ -f "$file" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*(#|$) ]] && continue
    [[ "$line" =~ ^[[:space:]]*([A-Z_][A-Z0-9_]*)=(.*)$ ]] || continue
    key="${BASH_REMATCH[1]}"
    value="${BASH_REMATCH[2]}"
    value="${value%\"}"; value="${value#\"}"
    value="${value%\'}"; value="${value#\'}"
    if [[ -z "${!key:-}" ]]; then
      export "$key=$value"
    fi
  done < "$file"
}

prompt_if_empty() {
  local var="$1" question="$2" default="${3:-}" answer
  if [[ -n "${!var:-}" ]]; then return 0; fi
  if [[ ! -t 0 ]]; then
    if [[ -n "$default" ]]; then export "$var=$default"; return 0; fi
    die "$var is not set and no terminal is available to ask for it."
  fi
  if [[ -n "$default" ]]; then
    read -r -p "$question [$default]: " answer
    answer="${answer:-$default}"
  else
    read -r -p "$question: " answer
  fi
  export "$var=$answer"
}

# Resolve LAB_ACCOUNT_ID and SERVICES_ACCOUNT_ID (defaults to the lab account).
resolve_accounts() {
  load_env_file
  prompt_if_empty LAB_ACCOUNT_ID "Lab account ID (runs the Seven Hills app)"
  prompt_if_empty SERVICES_ACCOUNT_ID "Services account ID (runs the lab guide and MCP server)" "$LAB_ACCOUNT_ID"
  LAB_ACCOUNT_ID="$(printf '%s' "$LAB_ACCOUNT_ID" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
  SERVICES_ACCOUNT_ID="$(printf '%s' "$SERVICES_ACCOUNT_ID" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
  [[ "$LAB_ACCOUNT_ID" =~ $ACCOUNT_ID_PATTERN ]] || die "LAB_ACCOUNT_ID must be a 32-character hex account ID."
  [[ "$SERVICES_ACCOUNT_ID" =~ $ACCOUNT_ID_PATTERN ]] || die "SERVICES_ACCOUNT_ID must be a 32-character hex account ID."
  export LAB_ACCOUNT_ID SERVICES_ACCOUNT_ID
}

topology() {
  if [[ "$LAB_ACCOUNT_ID" == "$SERVICES_ACCOUNT_ID" ]]; then echo "single account"; else echo "split accounts"; fi
}

# Run wrangler for one account. If LAB_API_TOKEN / SERVICES_API_TOKEN is set,
# it is used for that account; otherwise Wrangler uses CLOUDFLARE_API_TOKEN or
# the `wrangler login` session.
#   run_wrangler <lab|services> <component dir> <wrangler args...>
run_wrangler() {
  local side="$1" dir="$2"; shift 2
  local account token
  if [[ "$side" == "lab" ]]; then
    account="$LAB_ACCOUNT_ID"; token="${LAB_API_TOKEN:-${CLOUDFLARE_API_TOKEN:-}}"
  else
    account="$SERVICES_ACCOUNT_ID"; token="${SERVICES_API_TOKEN:-${CLOUDFLARE_API_TOKEN:-}}"
  fi
  (
    cd "$REPO_ROOT/$dir"
    export CLOUDFLARE_ACCOUNT_ID="$account"
    if [[ -n "$token" ]]; then export CLOUDFLARE_API_TOKEN="$token"; else unset CLOUDFLARE_API_TOKEN; fi
    npx --no-install wrangler "$@"
  )
}

check_tools() {
  command -v node >/dev/null || die "Node.js 22 or later is required."
  command -v npm  >/dev/null || die "npm is required."
  local major
  major="$(node -p 'process.versions.node.split(".")[0]')"
  (( major >= 22 )) || die "Node.js 22 or later is required (found $(node -v))."
}

# Fail early if Wrangler cannot see the account.
check_account_access() {
  # macOS ships bash 3.2, so avoid ${var^^}.
  local side="$1" dir="$2" account="$3" out token_var
  if [[ "$side" == "lab" ]]; then token_var="LAB_API_TOKEN"; else token_var="SERVICES_API_TOKEN"; fi
  if ! out="$(run_wrangler "$side" "$dir" whoami 2>&1)"; then
    printf '%s\n' "$out" >&2
    die "Wrangler is not authenticated. Run 'npx wrangler login' in $dir, or set an API token."
  fi
  if ! grep -q "$account" <<<"$out"; then
    printf '%s\n' "$out" >&2
    die "The current Wrangler identity cannot see account $account ($side). Log in as a member of that account or set $token_var."
  fi
}

# Verify a freshly deployed workers.dev URL answers without authentication.
# Retries briefly because new workers.dev hostnames can take a few seconds.
#   check_public_url <url> <label> <required|optional>
check_public_url() {
  local url="$1" label="$2" level="$3" code="" location="" i
  command -v curl >/dev/null || { warn "curl not found; skipping the $label reachability check."; return 0; }
  for i in 1 2 3 4 5 6; do
    read -r code location < <(curl -s -o /dev/null -m 10 -w '%{http_code} %{redirect_url}\n' "$url" || echo "000 ")
    [[ "$code" == "200" ]] && { info "$label is reachable."; return 0; }
    [[ "$location" == *cloudflareaccess.com* ]] && break
    sleep 5
  done

  if [[ "$location" == *cloudflareaccess.com* ]]; then
    printf '\n\033[1;31m!!! WARNING: %s is behind Cloudflare Access !!!\033[0m\n' "$label"
    printf '\033[1;31m    %s redirects to %s\033[0m\n' "$url" "${location%%/cdn-cgi*}"
    printf '\033[1;31m    An Access application in this account covers the workers.dev hostname,\n'
    printf '    often a wildcard such as *.<subdomain>.workers.dev.\n'
    printf '    Fix: Zero Trust > Access controls > Applications: exclude this hostname or add a\n'
    printf '    Bypass policy for it. Also check that Access is not enabled on the Worker'"'"'s\n'
    printf '    workers.dev route (Workers & Pages > Worker > Settings > Domains & Routes).\033[0m\n'
  else
    printf '\n\033[1;31m!!! WARNING: %s did not return 200 (got %s): %s\033[0m\n' "$label" "$code" "$url"
  fi
  if [[ "$level" == "required" ]]; then
    printf '\033[1;31m    The lab requires this endpoint to be public. Attendees protect it themselves in Module 02.\033[0m\n'
    return 1
  fi
  printf '\033[1;33m    Attendees will need to sign in to your Zero Trust organization to read the guide.\033[0m\n'
  return 1
}

# Prints yes, no, or unknown.
#   worker_exists <lab|services> <component dir> <worker name>
worker_exists() {
  local side="$1" dir="$2" name="$3" out
  if out="$(run_wrangler "$side" "$dir" deployments list --name "$name" --json 2>&1)"; then
    echo yes
  elif grep -qiE '10007|not found|does not exist' <<<"$out"; then
    echo no
  else
    echo unknown
  fi
}

confirm() {
  local question="$1" answer
  [[ "${ASSUME_YES:-0}" == "1" ]] && return 0
  [[ -t 0 ]] || die "Refusing to continue without confirmation. Re-run with --yes."
  read -r -p "$question [y/N]: " answer
  [[ "$answer" =~ ^[Yy]([Ee][Ss])?$ ]]
}
