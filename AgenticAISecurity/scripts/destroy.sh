#!/usr/bin/env bash
# Remove the three Workers created by scripts/deploy.sh.
#
# Only the Workers are deleted. Controls that attendees created in the
# dashboard (custom domains are removed with the Worker; Access apps, service
# tokens, MCP portals, Gateway and DLP policies, AI Gateway, WAF rules) are
# left in place for review and must be removed manually.
#
# Usage: scripts/destroy.sh [--yes]
# Inputs: same as deploy.sh (LAB_ACCOUNT_ID, SERVICES_ACCOUNT_ID, optional tokens).
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

ASSUME_YES=0
for arg in "$@"; do
  case "$arg" in
    --yes|-y) ASSUME_YES=1 ;;
    -h|--help) sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) die "Unknown argument: $arg" ;;
  esac
done
export ASSUME_YES

check_tools
resolve_accounts

cat <<EOF

This deletes the following Workers:
  Lab account       $LAB_ACCOUNT_ID:  $APP_WORKER
  Services account  $SERVICES_ACCOUNT_ID:  $MCP_WORKER (including its Durable Object data), $GUIDE_WORKER

Attendee-created dashboard configuration is not removed.
EOF
confirm "Delete these Workers?" || die "Cancelled."

for dir in app mcp-server guide; do
  [[ -d "$REPO_ROOT/$dir/node_modules" ]] || (cd "$REPO_ROOT/$dir" && npm ci --no-audit --no-fund --loglevel=error)
done

check_account_access services mcp-server "$SERVICES_ACCOUNT_ID"
if [[ "$LAB_ACCOUNT_ID" != "$SERVICES_ACCOUNT_ID" ]]; then
  check_account_access lab app "$LAB_ACCOUNT_ID"
fi

failed=0
delete_worker() {
  local side="$1" dir="$2" name="$3"
  info "Deleting $name"
  if ! run_wrangler "$side" "$dir" delete "$name" --force; then
    warn "Could not delete $name. It may already be gone; check the dashboard."
    failed=1
  fi
}

delete_worker lab app "$APP_WORKER"
delete_worker services mcp-server "$MCP_WORKER"
delete_worker services guide "$GUIDE_WORKER"

if [[ "$failed" == "1" ]]; then
  warn "Finished with errors."
  exit 1
fi
info "All lab Workers deleted. Review and remove attendee-created controls in the dashboard."
