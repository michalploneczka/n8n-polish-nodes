#!/usr/bin/env bash
# dev-install.sh — build packages and install them into a running n8n Docker container
#
# Usage:
#   ./scripts/dev-install.sh              # install all packages
#   ./scripts/dev-install.sh ceidg        # install only n8n-nodes-ceidg
#   CONTAINER=my-n8n ./scripts/dev-install.sh

set -e

CONTAINER="${CONTAINER:-n8n}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

# Determine which packages to install
if [ -n "$1" ]; then
  PACKAGES=("packages/n8n-nodes-$1")
else
  PACKAGES=(packages/n8n-nodes-*)
fi

echo "→ Building packages..."
cd "$REPO_ROOT"
pnpm run build:all

echo "→ Packing tarballs..."
TARBALLS=()
for pkg in "${PACKAGES[@]}"; do
  [ -f "$REPO_ROOT/$pkg/package.json" ] || continue
  tarball=$(cd "$REPO_ROOT/$pkg" && npm pack --pack-destination "$TMP_DIR" 2>/dev/null | tail -1)
  TARBALLS+=("$TMP_DIR/$tarball")
  echo "  ✓ $(basename "$tarball")"
done

if [ ${#TARBALLS[@]} -eq 0 ]; then
  echo "No packages found." && exit 1
fi

echo "→ Copying to container '$CONTAINER'..."
for tarball in "${TARBALLS[@]}"; do
  docker cp "$tarball" "$CONTAINER:/tmp/"
done

echo "→ Installing inside container..."
TARBALL_ARGS=$(for t in "${TARBALLS[@]}"; do echo -n "/tmp/$(basename "$t") "; done)
docker exec "$CONTAINER" sh -c "
  rm -rf /home/node/.n8n/custom &&
  mkdir -p /home/node/.n8n/custom &&
  cd /home/node/.n8n/custom &&
  npm install --no-save --ignore-scripts $TARBALL_ARGS
"

echo "→ Restarting container..."
docker restart "$CONTAINER" > /dev/null

echo ""
echo "Done. Open http://localhost:5678 and verify the nodes appear."
