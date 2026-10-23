#!/usr/bin/env bash
# Compatibility entrypoint; TypeScript owns the content contract for every reader.
set -euo pipefail
root=$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
exec node "$root/scripts/verify-content.mts"
