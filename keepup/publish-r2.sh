#!/usr/bin/env bash
# Publish the rendered digest to R2, one-way: overwrite the latest page and add
# this week's archive copy. Past weeks already sit in R2 and are left untouched.
# Run from keepup/ after a build (dist/index.html + dist/archive/*.html present).
# Shared by `task keepup-publish` and the weekly workflow so the bucket + key
# layout live in exactly one place.
set -euo pipefail
shopt -s nullglob

bucket=devdosvid-keepup

npx wrangler r2 object put "$bucket/keepup/index.html" \
  --file=dist/index.html --content-type="text/html" --remote

for f in dist/archive/*.html; do
  npx wrangler r2 object put "$bucket/keepup/archive/$(basename "$f")" \
    --file="$f" --content-type="text/html" --remote
done
