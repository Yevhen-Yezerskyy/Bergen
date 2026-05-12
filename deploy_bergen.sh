#!/usr/bin/env bash
# FILE: deploy_bergen.sh
# DATE: 2026-05-12
# PURPOSE: Commit/push host changes, pull prod volume, collect static files, and restart Bergen prod.

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  echo "ERROR: run this script inside the Bergen git repository" >&2
  exit 1
fi

cd "$repo_root"

branch="$(git branch --show-current)"
if [[ -z "$branch" ]]; then
  echo "ERROR: current git branch is not available" >&2
  exit 1
fi

git add -A

if ! git diff --cached --quiet; then
  stamp="$(date '+%Y-%m-%d %H:%M:%S')"
  git commit -m "Revision ${stamp}, <Bergen>"
  git push origin "$branch"
fi

docker exec bergen-tools /bin/sh -lc "git -C /app pull --ff-only origin '$branch'"
docker exec bergen-web-prod /bin/sh -lc "cd /app/bergen_app && python manage.py collectstatic --noinput"
docker restart bergen-web-prod >/dev/null
docker restart bergen-nginx >/dev/null

echo "Done"
