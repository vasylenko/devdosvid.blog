# keepup

Personal weekly tech digest — one static page rebuilt every Monday by GitHub Actions and served by Pages at https://vasylenko.github.io/keepup/. Curating sources in `config/topics.yml` is most of the work here.

## All HTTP goes through markfetch — don't add a Python HTTP client

Every fetch runs through the `markfetch` CLI via `fetch_raw()` in `keepup/fetchers/markfetch.py` (`markfetch --raw`). Don't add `requests`, `httpx`, or `urllib` — markfetch (Serhii's own npm tool) owns the wire, including the HTTP/1.1 trick that gets past Cloudflare. Consequences: it must be installed to run locally (`npm i -g markfetch`, then `uv run python -m keepup`), and the AWS bucketing call needs `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN` (Workers AI) — without them that section falls back to a flat, unsorted list.

## X timelines come from nitter.net, not the X API

`fetchers/x.py` reads each author's RSS off nitter.net (a public X mirror) through markfetch — the official API is pay-per-use (~$1 per weekly run was the measured bill; tweepy was tried and reverted). Consequences of leaning on a public instance: feeds are ~20 items deep, so a hyper-prolific author's week may be undercovered; a flaky instance week just footnotes the affected authors; and nitter serves an empty 200 for some lowercase handles when its cache is cold — that's why `dhh` is configured as `handle: DHH` (x.com URLs and the creator filter are case-insensitive, so this is safe). Retweets are dropped by `dc:creator` mismatch and thread continuations by their `R to ` title prefix, leaving original posts + thread heads.

## Source filters match publishers' own tag strings, not concepts

`categories:` in `config/topics.yml` is compared verbatim against each feed's `<category>` values — `kubernetes` matches nothing unless the feed literally emits that string. Read a feed's real category values before filtering on them. AWS is the trap: it tags some items with only a product slug (`general:products/aws-secrets-manager`) and no `marchitecture` area, so an area-only filter silently drops them.

## Adding a sitemap source: confirm the page's date format

`fetchers/sitemap.py` dates each item from an h1-adjacent `Mon DD, YYYY` string in the raw HTML. `lastmod` only shortlists candidates, it never dates them — a redeploy bumps it sitewide. Pages with no matching date are dropped, so a new RSS-less site that formats dates differently yields nothing until you extend the date patterns.

## The weekly commit is both the deploy and the keepalive

Each run re-renders `docs/` (the generated timestamp always changes) and commits to `main`; Pages serves `main`/`docs`. That commit also counts as the repo activity GitHub needs to avoid auto-disabling the cron after 60 days idle — so don't make the output deterministic-per-week to "skip empty commits." The churn is load-bearing.
