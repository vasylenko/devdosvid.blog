# devDosvid blog

Personal blog by Serhii Vasylenko about Technical Leadership and Platform Engineering.

## Tech Stack

- **Hugo** static site generator with [PaperMod](https://github.com/adityatelange/hugo-PaperMod/) theme (imported as Hugo module via `go.mod`, not a git submodule)
- **Hosting**: GitHub Pages (`gh-pages-hugo` branch) + Cloudflare CDN; PR previews on Cloudflare Pages
- **Newsletter**: Beehiiv (iframe in `partials/subscribe.html`, rendered on posts and home page)
- **Comments**: Giscus (GitHub Discussions)
- **Analytics**: Simple Analytics (privacy-first, no Google Analytics)
- **Fonts**: System font stack, no external font loading
- **CSS**: Plain CSS only, light theme only (`disableThemeToggle: true`)

## Project Structure

```
config/
  _default/config.yaml           # Main config: permalinks, theme params, taxonomy
  development/config.yaml        # Drafts enabled, no minification
  production/config.yaml         # Production base URL, minification, analytics

content/
  posts/YYYY/<slug>/index.md     # Blog posts (page bundles with co-located images)
  about/index.md                 # About page
  cv/index.md                    # CV page (custom layout + print styles)

layouts/
  _default/cv.html               # Custom CV layout
  _default/_markup/
    render-blockquote-alert.html # GFM alerts: > [!NOTE], > [!WARNING], etc.
  partials/
    extend_head.html             # Twitter meta, Simple Analytics
    extend_footer.html           # Ukrainian footer + subscribe (home page only)
    comments.html                # Subscribe form + Giscus
    subscribe.html               # Beehiiv embed (called from comments + footer)
  shortcodes/                    # See SHORTCODES.md

assets/css/extended/             # PaperMod's user override directory
  variables.css                  # Design tokens: --color-*, --font-*, --radius
  custom.css                     # Main custom styles
  cv.css                         # CV styles (with print @media)
  subscribe.css                  # Newsletter form styles
  alerts.css                     # GFM alert styles

.github/
  workflows/deploy-production.yaml  # main -> Docker build -> gh-pages-hugo -> Cloudflare purge
  workflows/deploy-preview.yaml     # PR -> Docker build -> Cloudflare Pages
  workflows/build-hugo-image.yaml   # Rebuild ghcr.io/vasylenko/hugo-runtime on Dockerfile/.env changes
  dependabot.yml                    # Weekly updates: gomod, docker, github-actions
```

## Development

- **Local server**: `task server-start` or `docker compose up` — Hugo in Docker on port 8080, drafts enabled
- **New post**: `./newpost.sh <title>` — auto-generates slug, scaffolds page bundle under `content/posts/YYYY/`
- **Hugo + Go versions**: pinned in `.env`, shared between `compose.yaml` and CI
- **Build output**: `publishdir/` (not default `public`), git-ignored
- **CI parity**: always use Docker for local builds — local Hugo binary may differ from CI

## Content Conventions

- Posts are **page bundles**: directory with `index.md` + co-located images
- Front matter (YAML): `title`, `date`, `summary`, `description`, `cover` (`image`, `relative: true`, `alt`), `keywords`, `series`, `draft`
- Post paths: `content/posts/YYYY/<slug>/`
- Permalinks: `posts/:year/:month/:day/:slug` — SEO-critical, do not change
- Only `series` taxonomy is configured; older posts have `tags`/`categories` but those taxonomies are disabled
- Color palette: orange `#FF9F1C`, green `#027E6F`, red `#FF4D45`, toxic `#D5FF00`, gray `#545454`, charcoal `#1C1C1C`

## Code Conventions

- **Templates**: use PaperMod extension points only (`extend_head`, `extend_footer`, `comments`) — no full template overrides
- **Shortcodes**: named parameters via `.Get "param"`, inner content via `{{ .Inner | markdownify }}`
- **CSS**: all files in `assets/css/extended/`, design tokens in `variables.css`
- **Naming**: CSS files `lowercase-hyphenated.css`, shortcodes `lowercase-hyphenated.html`, post slugs `descriptive-kebab-case`
