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

deploy_volume() {
  local tools_container="$1"
  local prod_container="$2"
  local app_dir="$3"

  docker exec "$tools_container" /bin/sh -lc "
    set -e
    if [ -d /app/.git ]; then
      git -C /app pull --ff-only origin '$branch'
    elif [ -z \"\$(ls -A /app 2>/dev/null)\" ]; then
      git clone --branch '$branch' --single-branch git@github.com:Yevhen-Yezerskyy/Bergen.git /app
    else
      echo 'ERROR: /app is not empty and is not a git repository' >&2
      exit 1
    fi
  "

  docker exec "$prod_container" /bin/sh -lc "cd /app/$app_dir && python manage.py collectstatic --noinput"
}

deploy_volume bergen-tools bergen-web-prod bergen_app
deploy_volume bergen-grand-tools bergen-grand-web-prod bergen_grand_app

docker restart bergen-web-prod >/dev/null
docker restart bergen-grand-web-prod >/dev/null
docker restart bergen-nginx >/dev/null

echo "Done"
