#!/usr/bin/env bash
#
# Local doc re-sync. Copies docs/ from each sibling Schuly repo (checked out next to
# this one) into docs/<Repo>/, PRESERVING the docs-site-owned docs/<Repo>/_category_.json.
#
# CI does this per-repo via the GitHub Actions template in templates/sync-docs.yml;
# this script is for local previews when you have all repos cloned side by side:
#
#   bash scripts/sync-docs.sh
#   bun run start
#
set -euo pipefail

REPOS=(Schuly SchulyBackend SchulyWebsite SchulyKeycloak SchulyPluginAbstractions SchulyPlugins)

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

for repo in "${REPOS[@]}"; do
  src="$ROOT/../$repo/docs"
  dest="$ROOT/docs/$repo"
  if [ ! -d "$src" ]; then
    echo "skip $repo (no $src)"
    continue
  fi
  mkdir -p "$dest"
  # Wipe previous content but keep the section config this repo owns.
  find "$dest" -mindepth 1 ! -name '_category_.json' -delete
  cp -r "$src"/. "$dest"/
  echo "synced $repo ($(find "$dest" -type f | wc -l | tr -d ' ') files)"
done

echo "Done. Run 'bun run start' to preview."
