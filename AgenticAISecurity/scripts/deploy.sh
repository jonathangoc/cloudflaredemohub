#!/usr/bin/env bash
# Deploy the Seven Hills lab starting environment.
#
#   Services account: lab guide (Docusaurus) + Shared Operations MCP server
#   Lab account:      Seven Hills app Worker (agent + storefront)
#
# The two accounts may be the same. Nothing in the lab guide is preconfigured;
# attendees perform every guide step themselves.
#
# Usage: scripts/deploy.sh [--yes] [--dry-run]
#   --yes      skip the confirmation prompt
#   --dry-run  install, build, and run `wrangler deploy --dry-run` only
#
# Inputs (environment or repository .env; you are prompted for missing IDs):
#   LAB_ACCOUNT_ID       required
#   SERVICES_ACCOUNT_ID  optional, defaults to LAB_ACCOUNT_ID
#   LAB_API_TOKEN / SERVICES_API_TOKEN / CLOUDFLARE_API_TOKEN  optional; else `wrangler login`
#   GUIDE_URL            optional, public URL of the guide if you add a custom domain
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

ASSUME_YES=0
DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --yes|-y) ASSUME_YES=1 ;;
    --dry-run) DRY_RUN=1 ;;
    -h|--help) sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) die "Unknown argument: $arg" ;;
  esac
done
export ASSUME_YES

check_tools

if [[ "$DRY_RUN" == "1" ]]; then
  # Dry runs need no account; use placeholders so wrangler has something to read.
  LAB_ACCOUNT_ID="${LAB_ACCOUNT_ID:-00000000000000000000000000000000}"
  SERVICES_ACCOUNT_ID="${SERVICES_ACCOUNT_ID:-$LAB_ACCOUNT_ID}"
  export LAB_ACCOUNT_ID SERVICES_ACCOUNT_ID
else
  resolve_accounts
fi

info "Installing dependencies"
for dir in mcp-server guide app; do
  (cd "$REPO_ROOT/$dir" && npm ci --no-audit --no-fund --loglevel=error)
done

existing=()
if [[ "$DRY_RUN" != "1" ]]; then
  info "Checking Wrangler access"
  check_account_access services mcp-server "$SERVICES_ACCOUNT_ID"
  if [[ "$LAB_ACCOUNT_ID" != "$SERVICES_ACCOUNT_ID" ]]; then
    check_account_access lab app "$LAB_ACCOUNT_ID"
  fi

  info "Checking for existing Workers"
  for entry in "services:mcp-server:$MCP_WORKER" "services:guide:$GUIDE_WORKER" "lab:app:$APP_WORKER"; do
    IFS=: read -r side dir name <<<"$entry"
    case "$(worker_exists "$side" "$dir" "$name")" in
      yes)     existing+=("$name ($side account)") ;;
      unknown) existing+=("$name ($side account, could not verify)") ;;
    esac
  done
fi

cat <<EOF

Seven Hills lab deployment
  Topology:          $(topology)
  Services account:  $SERVICES_ACCOUNT_ID  ->  $MCP_WORKER, $GUIDE_WORKER
  Lab account:       $LAB_ACCOUNT_ID  ->  $APP_WORKER
  Mode:              $([[ "$DRY_RUN" == "1" ]] && echo "dry run (no changes)" || echo "deploy")
EOF

if (( ${#existing[@]} > 0 )); then
  printf '\n\033[1;31m!!! WARNING: these Workers already exist and will be OVERWRITTEN !!!\033[0m\n'
  for name in "${existing[@]}"; do printf '\033[1;31m    - %s\033[0m\n' "$name"; done
  printf '\033[1;31mTheir code is replaced with this release. On %s, secrets, dashboard\n' "$APP_WORKER"
  printf 'variables, and the custom domain are kept. The MCP server and guide are fully replaced.\n'
  printf 'If attendees are mid-lab in this environment, stop now.\033[0m\n'
fi
echo

if [[ "$DRY_RUN" != "1" ]]; then
  if (( ${#existing[@]} > 0 )); then
    confirm "Overwrite the existing Workers listed above?" || die "Cancelled."
  else
    confirm "Continue?" || die "Cancelled."
  fi
fi

deploy_args=(deploy)
[[ "$DRY_RUN" == "1" ]] && deploy_args+=(--dry-run)

# 1. MCP server (services account). Its workers.dev URL gives us the account's
#    workers.dev subdomain, which we reuse for the guide URL.
info "Deploying $MCP_WORKER to the services account"
mcp_output="$(run_wrangler services mcp-server "${deploy_args[@]}" 2>&1 | tee /dev/stderr)"
mcp_url=""
if [[ "$DRY_RUN" != "1" ]]; then
  mcp_url="$(grep -Eo "https://$MCP_WORKER\.[a-z0-9-]+\.workers\.dev" <<<"$mcp_output" | head -n1 || true)"
  [[ -n "$mcp_url" ]] || die "Could not find the MCP server workers.dev URL in the Wrangler output. Make sure the services account has a workers.dev subdomain (Workers & Pages > Settings), then re-run."
fi

# 2. Guide (services account).
if [[ -z "${GUIDE_URL:-}" && -n "$mcp_url" ]]; then
  GUIDE_URL="${mcp_url/$MCP_WORKER/$GUIDE_WORKER}"
fi
export GUIDE_URL="${GUIDE_URL:-http://localhost:3000}"
info "Building the lab guide for $GUIDE_URL"
(cd "$REPO_ROOT/guide" && npm run build --silent)
info "Deploying $GUIDE_WORKER to the services account"
run_wrangler services guide "${deploy_args[@]}"

# 3. Seven Hills app (lab account). No workers.dev URL by design; the attendee
#    adds the custom domain in Module 01.
info "Deploying $APP_WORKER to the lab account (no public URL yet; 'No targets deployed' is expected)"
run_wrangler lab app "${deploy_args[@]}"

if [[ "$DRY_RUN" == "1" ]]; then
  info "Dry run complete. No changes were made."
  exit 0
fi

info "Checking that the MCP server and guide are publicly reachable"
check_public_url "$mcp_url/health" "MCP server" required || public_failed=1
check_public_url "$GUIDE_URL/" "Lab guide" optional || true

mcp_host="${mcp_url#https://}"
cat <<EOF

Deployment complete.

  Lab guide:        $GUIDE_URL
  MCP server:       $mcp_url/mcp   (health: $mcp_url/health)
  Seven Hills app:  Worker '$APP_WORKER' in account $LAB_ACCOUNT_ID (no public URL until Module 01)

Give attendees:
  1. The lab guide URL above.
  2. Access to the lab account ($LAB_ACCOUNT_ID).
  3. Lab domain:      an active zone in the lab account, used as the zone apex for the app
  4. MCP server host: $mcp_host

Attendees enter values 3 and 4 on the guide's Getting Started page.
Remove everything later with: scripts/destroy.sh
EOF

if [[ "${public_failed:-0}" == "1" ]]; then
  printf '\n\033[1;31m!!! The MCP server is not publicly reachable. Module 02 will fail until this is fixed (see warning above). !!!\033[0m\n'
  exit 2
fi
