#!/usr/bin/env bash
#
# Local doc re-sync. Copies docs/ from each sibling Schuly repo (checked out next to
# this one) into docs/<Repo>/. Section labels + order live in docs/.vitepress/config.mjs
# (the SECTIONS map), so the synced folders only ever hold the source repo's markdown.
#
# CI does this per-repo via the GitHub Actions template in templates/sync-docs.yml;
# this script is for local previews when you have all repos cloned side by side:
#
#   bash scripts/sync-docs.sh
#   bun run dev
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
  rm -rf "$dest"
  mkdir -p "$dest"
  cp -r "$src"/. "$dest"/
  echo "synced $repo ($(find "$dest" -type f | wc -l | tr -d ' ') files)"
done

echo "Done. Run 'bun run dev' to preview."
