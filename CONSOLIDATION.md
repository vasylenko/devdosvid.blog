# Consolidation: one repo, one Cloudflare Worker

Merge the blog, the slide decks, and the weekly `keepup` digest into this
single repo, served by one Cloudflare Worker — to simplify management and
tooling. Traffic is tiny, so the whole thing stays inside free tiers (~$0/mo).

## Target layout

```
devdosvid.blog/            # this repo (flipped private at cutover)
  content/ config/ layouts/ assets/ …   # blog — stays at root (protects lastmod)
  slides/                  # copied in — Vite/reveal.js decks
  keepup/                  # copied in — Python/uv digest
  worker/index.js          # 301 trailing-slash redirect + ASSETS fallthrough
  wrangler.jsonc           # the one Worker (assets.directory = ./dist)
  Taskfile.yml  .env       # command surface + version pins
  .github/workflows/
    site.yml               # push → assemble dist/ → wrangler deploy
    keepup-digest.yml      # weekly cron → Workers AI → commit HTML
```

Built output (blog `/`, `/slides`, `/keepup`) is assembled into `dist/` and
served by the Worker.

`slides/` and `keepup/` are plain copies, not `git subtree`. These are hobby
projects — their commit history has little value, and the original repos are
archived (read-only) anyway, so their history stays viewable there while the
merged repo keeps a clean log. The blog stays at root because *its* history is
load-bearing (`lastmod` → SEO), which copying the other two doesn't affect.

## Tooling

- **Orchestration:** root Taskfile — `task build`, `task deploy`, `task blog-serve`.
- **Build:** GitHub Actions assembles `dist/` (Hugo via the pinned Docker
  runtime; Vite for slides; copy keepup's rendered HTML) → `wrangler deploy`.
- **Host:** one Cloudflare Worker (Static Assets) for the whole domain.
- **keepup content:** weekly Actions cron runs the Python pipeline on Cloudflare
  Workers AI (open model) and commits the rendered HTML.
- **Deps/versions:** one Dependabot + one `.env` (Hugo, Go, Node, Python).

## Phases (each = one shippable PR)

1. **keepup LLM → Cloudflare Workers AI** — swap provider in the keepup repo.
   *Urgent:* GitHub Models retires 2026-07-30 (brownout 07-16).
2. **Consolidate into this repo** — root tooling + copy in `keepup`; `slides` is
   copied when the repo goes private (see constraints).
3. **Unified build → `dist/`** — `task build` assembles all three locally.
4. **Cloudflare Worker on a preview URL** — Worker + 301 + custom 404; SEO gate green.
5. **Cutover + decommission** — domain → Worker, flip private, archive old repos.

## Sequencing constraints (why the order matters)

- **Flip private only at cutover (Phase 5).** GitHub Pages serves this repo;
  making it private earlier can take the live site down (Pages-from-private
  needs a paid GitHub plan). Cloudflare serves the site by cutover, so Pages
  going dark is then harmless.
- **The private slides content can't enter a public repo.** So `slides` is
  copied in only once the repo is private — or earlier only if the GitHub plan
  lets a private repo keep Pages alive until cutover.
- **keepup's LLM swap (Phase 1) lands before it's copied in**, so the merged
  copy already runs on Workers AI.
