# devDosvid blog

## Purpose

Personal blog by Serhii Vasylenko. Shares experience and insights on Technical Leadership and Platform Engineering. Built for long-term content publishing with strong SEO and reader privacy.

## Tech Stack

- **Static site generator**: Hugo 
- **Theme**: [PaperMod](https://github.com/adityatelange/hugo-PaperMod/) — imported as a Hugo module (not a git submodule) via `go.mod`
- **Hosting**: GitHub Pages (branch `gh-pages-hugo`) with Cloudflare CDN in front
- **PR previews**: Cloudflare Pages (`devdosvid-preview` project)
- **Analytics**: Simple Analytics (privacy-first, no Google Analytics)
- **Comments**: Giscus (GitHub Discussions-based)
- **Email subscriptions**: Beehiiv (embedded iframe)
- **Fonts**: Albert Sans, self-hosted (no Google Fonts)
- **Docker**: Hugo runtime image on `ghcr.io/vasylenko/hugo-runtime`, used in CI and optionally for local dev

## Project Structure

```
config/                          # Hugo configuration (per-environment)
  _default/config.yaml           # Main config: permalinks, theme params, taxonomy
  development/config.yaml        # Drafts enabled, no minification
  production/config.yaml         # Production base URL, minification, analytics

content/                         # All site content (Markdown + YAML front matter)
  posts/YYYY/<slug>/index.md     # Blog posts as page bundles (co-located images)
  about/index.md                 # About page (includes tech talks section)
  cv/index.md                    # CV page with custom layout and print styles
  archives.md                    # Archive listing (PaperMod built-in layout)
  search/index.md                # Search page (requires JSON output format)

layouts/                         # Template overrides and custom components
  _default/single.html           # Full override of PaperMod's single post template
  _default/cv.html               # Custom CV layout
  partials/                      # PaperMod extension points and custom partials
    extend_head.html             # Font faces, Twitter meta, Simple Analytics
    extend_footer.html           # Ukrainian themed footer
    hooks/post-content-end.html  # Injects email subscription after post content
    comments.html                # Giscus integration
  shortcodes/                    # 12 custom shortcodes (see SHORTCODES.md)

assets/css/extended/             # Custom CSS (PaperMod's user override directory)
  variables.css                  # CSS custom properties (design tokens, color palette)
  custom.css                     # Main custom styles
  cv.css                         # CV page styles (with print @media rules)
  (+ feature-specific CSS files)

static/                          # Favicons, fonts (woff2), social SVG icons

.github/
  workflows/deploy-production.yaml  # main → build in Docker → gh-pages-hugo → Cloudflare purge
  workflows/deploy-preview.yaml     # PR → build → Cloudflare Pages preview
  workflows/build-hugo-image.yaml   # Dockerfile/compose changes → rebuild GHCR image
  actions/build-hugo-website/       # Shared composite action for Hugo builds
```

## Development

**Local server**: `docker compose up` — runs Hugo in a Docker container (`ghcr.io/vasylenko/hugo-runtime`) on port 8080. Builds drafts and future posts, disables fast render for reliable live reload. Hugo version is pinned in `.env` and shared with CI.

**New blog post**: `./newpost.sh <slug>` — scaffolds a page bundle under `content/posts/` from the `post-bundle` archetype (requires local Hugo install)

**Hugo environment configs**: `development` is used locally (drafts enabled, no minification), `production` is used in CI (real base URL, minification, Simple Analytics injection)

**Docker image** (`hugo-runtime.dockerfile`): Two-stage build — Alpine downloads the Hugo extended binary, copies it into a `golang:1.22` image (Go is needed for Hugo modules). Published to `ghcr.io/vasylenko/hugo-runtime:${HUGO_VERSION}`. Rebuilt automatically by CI when the Dockerfile, compose file, or `.env` changes.

## Content Conventions

- Every blog post is a **page bundle**: a directory with `index.md` and co-located images
- Front matter is **YAML** with fields: `title`, `date`, `summary`, `description`, `cover` (with `image`, `relative: true`, `alt`), `tags`, `categories`, `draft`
- Post directories live under `content/posts/YYYY/` organized by year
- Permalink pattern: `posts/:year/:month/:day/:slug` — this is SEO-critical, do not change
- Cover images use co-located files (e.g., `cover-image.png`) with `relative: true` in front matter
- Posts use custom shortcodes for rich content — see `SHORTCODES.md` for full reference

### Key Shortcodes

| Shortcode | Purpose |
|-----------|---------|
| `{{< attention >}}...{{< /attention >}}` | Highlighted callout box |
| `{{< updatenotice >}}...{{< /updatenotice >}}` | Update/revision notice |
| `{{< snippet >}}...{{< /snippet >}}` | Expandable code snippet |
| `{{< figure src="..." alt="..." caption="..." >}}` | Image with caption (custom, not Hugo built-in) |
| `{{< youtube src="VIDEO_ID" title="..." >}}` | Responsive YouTube embed |
| `{{< animation src="..." >}}` | Looping webm video |
| `{{< tech-talk title="..." event="..." date="..." >}}` | Tech talk card (about page) |
| `{{< email-subscription >}}` | Beehiiv subscription form |
| `{{< rawhtml >}}...{{< /rawhtml >}}` | Raw HTML passthrough |

## Code Style & Conventions

### Templates (layouts)

- Extend PaperMod using its designated extension points (`extend_head.html`, `extend_footer.html`, `hooks/`) rather than copying entire templates
- When a full template override is unavoidable (like `single.html`), keep it as close to the original as possible
- Shortcodes use named parameters via `.Get "param"` and process inner content with `{{ .Inner | markdownify }}`

### CSS

- All custom CSS goes in `assets/css/extended/` — this is PaperMod's convention for user overrides
- Design tokens are in `variables.css` using `--color-*`, `--font-*`, `--radius` naming
- Color palette: orange `#FF9F1C`, green `#027E6F`, red `#FF4D45`, toxic `#D5FF00`, gray `#545454`, charcoal `#1C1C1C`
- Plain CSS only — no preprocessors, no Tailwind, no CSS-in-JS
- Light theme only (deliberate choice, no dark mode support)

### Naming

- CSS files: `lowercase-hyphenated.css`
- Shortcode files: `lowercase-hyphenated.html`
- Post slugs: descriptive kebab-case (e.g., `positional-dominance-is-making-you-a-worse-engineer`)

## Quirks

### PaperMod theme overrides are fragile
Custom layouts in `layouts/` override PaperMod templates. When the theme updates (via `go get`), overridden templates may break silently if PaperMod changes its internal structure. After theme updates, verify that `single.html`, `cover.html`, and all `extend_*.html` partials still work correctly.

### Docker build is required for CI parity
The CI pipeline builds inside a Docker container (`ghcr.io/vasylenko/hugo-runtime`). Local `hugo` commands may produce different results if your local Hugo version differs. Use `docker compose up` to match CI behavior exactly.

### Content structure is SEO-sensitive
The permalink pattern (`posts/:year/:month/:day/:slug`), page bundle structure, and front matter fields (`summary`, `description`, `cover`) are tuned for SEO. Changing these affects existing URLs, sitemap, and search engine indexing. Don't reorganize content paths without understanding the SEO impact.

### The `gist` shortcode is deprecated
Hugo v0.143.0 deprecated the built-in `gist` shortcode. It still works but will be removed in a future release. Avoid using it in new content.

### Typo in CSS filename
`assets/css/extended/profiels.css` is intentionally misspelled (should be "profiles"). Don't rename it without updating any references.

## Architectural Decisions

- **Hugo modules over git submodules**: The PaperMod theme is managed via Go modules (`go.mod`/`go.sum`), not a git submodule. This means theme updates go through `go get -u`, and the theme version is locked in `go.sum`.
- **Self-hosted fonts + privacy-first analytics**: No external font loading (Google Fonts) or tracking (Google Analytics). Albert Sans is bundled as woff2 files; analytics use Simple Analytics which doesn't track individuals.
- **Light theme only**: Deliberate design decision — `disableThemeToggle: true` in config. No dark mode CSS exists or is planned.
