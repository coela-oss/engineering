#!/usr/bin/env bash
# Shared local/CI verification of the owner-maintained public content catalog.
set -euo pipefail

root=$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd -- "$root"
test ! -L datasets/catalog.json
test "$(wc -c < datasets/catalog.json)" -le 65536
jq -e '
  .schema_version == 1 and .id == "coela-engineering-content"
  and (.version | test("^[0-9]+[.][0-9]+[.][0-9]+$"))
  and (.entries | length > 0 and length <= 100)
  and ([.entries[].id] | length == (unique | length))
  and ([.entries[].path] | length == (unique | length))
  and all(.entries[]; . as $entry |
    (.sha256 | test("^[a-f0-9]{64}$"))
    and (.path | test("^content/(en|ja)/[a-z0-9-]+[.]md$"))
    and (.locale == "en" or .locale == "ja")
    and (.path | startswith("content/" + $entry.locale + "/"))
    and .license == "CC-BY-4.0")
' datasets/catalog.json >/dev/null
while IFS= read -r path; do
  test ! -L content
  test ! -L "$(dirname -- "$path")"
  test ! -L "$path"
  test -f "$path"
  test "$(wc -c < "$path")" -le 1048576
done < <(jq -r '.entries[].path' datasets/catalog.json)
jq -r '.entries[] | "\(.sha256)  \(.path)"' datasets/catalog.json |
  sha256sum --check --strict
