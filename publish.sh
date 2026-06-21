#!/usr/bin/env bash
set -euo pipefail

# Script to create a GitHub repo and push local main branch. Requires gh auth.
OWNER=$(gh api user --jq .login 2>/dev/null || true)
REPO_NAME=$(basename "$PWD" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g; s/[^a-z0-9._-]/-/g')

if [ -z "$OWNER" ]; then
  echo "gh not authenticated. Run: gh auth login --web"
  exit 1
fi

echo "Creating repo $OWNER/$REPO_NAME..."
gh repo create "$OWNER/$REPO_NAME" --public --source=. --remote=origin --push || {
  echo "gh repo create failed. Check token permissions or create repo manually at https://github.com/new"
  exit 2
}

echo "Done. Remote origin set to:"
git remote -v
