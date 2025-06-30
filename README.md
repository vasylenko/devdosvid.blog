[![Deploy Production](https://github.com/vasylenko/devdosvid.blog/actions/workflows/deploy-production.yaml/badge.svg)](https://github.com/vasylenko/devdosvid.blog/actions/workflows/deploy-production.yaml)

# devDosvid Blog - Hugo Documentation

A personal blog powered by Hugo with extensive customizations and zero-cost hosting setup.

## 🏗️ Architecture Overview

💰 **Zero-cost hosting** with GitHub Pages and CloudFlare CDN for fast content delivery  
👨‍💻 **Static site generator**: [Hugo](https://gohugo.io/) with extended features  
📝 **Theme**: [PaperMod](https://github.com/adityatelange/hugo-PaperMod/) (Git submodule)  
⚙️ **CI/CD**: GitHub Actions with multi-environment deployment  
🌎 **CDN**: CloudFlare for performance and caching  
🐳 **Development**: Docker-based local development environment  

## 🎨 Custom Implementations

### Custom Shortcodes

This blog includes 12+ custom shortcodes for enhanced content creation:

#### Content Enhancement
- **`attention`** - Highlighted attention boxes for important information
- **`updatenotice`** - Update notification blocks for revised content  
- **`snippet`** - Collapsible/expandable code blocks (spoiler functionality)
- **`rawhtml`** - Raw HTML insertion capability

#### Media & Embeds
- **`youtube`** - Enhanced YouTube embeds with accessibility features
- **`figure`** - Advanced image display with captions, linking, and responsive sizing
- **`animation`** - WebM video animation embeds (optimized GIF replacement)
- **`gist`** - GitHub Gist embeds (deprecated in Hugo v0.143.0+)

#### Interactive Components
- **`email-subscription`** - Beehiiv newsletter subscription form
- **`social-profiles`** - Social media profile links with icons
- **`tech-talk`** - Technical presentation showcase with metadata

#### Utilities
- **`utilities/latest-post`** - Dynamic latest post URL generation

📖 **Full documentation**: See [SHORTCODES.md](./SHORTCODES.md) for detailed usage examples and parameters.

### Custom Partials & Templates

#### Layout Extensions
- **`extend_head.html`** - Custom font loading (Albert Sans) and analytics integration
- **`extend_footer.html`** - Footer customizations
- **`cover.html`** - Custom cover image handling
- **`comments.html`** - Comment system integration

#### Content Hooks
- **`hooks/post-content-begin.html`** - Pre-content injection
- **`hooks/post-content-end.html`** - Post-content injection  

#### Components
- **`components/email-subscription-content.html`** - Newsletter subscription component
- **`post-series.html`** - Post series navigation
- **`license.html`** - Content licensing information

### Custom Archetypes

- **`post-bundle/index.md`** - Enhanced post template with cover images, metadata, and SEO fields

### Typography & Fonts

Custom font implementation using Albert Sans with multiple weights:
- Light (300) - Regular & Italic
- Regular (400) - Regular & Italic  
- Medium (500) - Regular & Italic
- SemiBold (600) - Regular & Italic

Fonts are self-hosted for performance and GDPR compliance.

## 🛠️ Development Setup

### Prerequisites
- Docker & Docker Compose
- Hugo Extended (for local development without Docker)
- Git with submodules

### Local Development

#### Option 1: Docker Development (Recommended)
```bash
# Start development server
docker-compose up

# Access at http://127.0.0.1:8080
```

#### Option 2: Native Development
```bash
# Install dependencies
hugo mod get

# Start development server
./server.sh [localhost|production|development]

# Examples:
./server.sh localhost          # Bind to localhost only
./server.sh production         # Use production config
./server.sh development        # Use development config (default)
```

The `server.sh` script automatically:
- Detects network interface (macOS optimized)
- Enables draft and future content
- Disables caching for development
- Supports environment-specific configs

#### Creating New Posts
```bash
# Create a new post bundle
./newpost.sh "my-new-post-title"

# This creates: content/posts/my-new-post-title/index.md
```

### Docker Configuration

#### Custom Hugo Runtime
- **Base**: Alpine Linux + Golang 1.22
- **Hugo**: Extended version with dynamic version support
- **Image**: `ghcr.io/vasylenko/hugo-runtime:${HUGO_VERSION}`

#### Development Features
- Hot reload enabled
- Draft content visible
- Future-dated posts shown
- Cache disabled for development

## 🚀 Deployment & CI/CD

### Multi-Environment Setup

#### Development Environment
- Local development with drafts
- Hot reloading
- Debug-friendly configuration

#### Production Environment  
- Minified output
- Google Analytics enabled
- Heap Analytics integration
- SEO optimizations enabled

### GitHub Actions Workflows

#### 1. Production Deployment (`deploy-production.yaml`)
**Triggers**: Push to `main` branch, manual dispatch

**Process**:
1. **Build Stage**: Hugo site compilation with production config
2. **Deploy Stage**: Artifact deployment to `gh-pages-hugo` branch  
3. **Cache Purge**: CloudFlare cache invalidation

**Features**:
- Artifact-based deployment
- Conditional deployment (only on changes)
- Automated cache purging
- GitHub Pages integration

#### 2. Preview Deployment (`deploy-preview.yaml`)
- Pull request previews
- Staging environment testing

#### 3. Hugo Image Build (`build-hugo-image.yaml`)
- Custom Hugo runtime image building
- Multi-architecture support
- Automated image publishing

### Configuration Management

#### Multi-Environment Config Structure
```
config/
├── _default/          # Base configuration
├── development/       # Development overrides  
└── production/        # Production overrides
```

#### Key Production Settings
- Minification enabled
- Analytics integration (Simple Analytics)
- SEO enhancements
- Performance optimizations

## 🎯 Content Features

### SEO & Performance
- Automatic `lastmod` updates via Git integration
- Optimized sitemap generation
- Social media meta tags (Twitter, OpenGraph)
- Image optimization and responsive loading

### Content Organization
- **Taxonomies**: Series-based content grouping
- **Permalinks**: SEO-friendly URL structure (`/YYYY/MM/DD/slug/`)
- **RSS**: Full-text RSS feeds with 20-item limit

### Analytics & Tracking
- **Simple Analytics**: Privacy-first analytics
- **Heap Analytics**: User behavior tracking (production only)
- **GDPR Compliant**: No tracking cookies

## 🎨 Customization Tools

### Carbon Code Screenshots
Pre-configured Carbon settings for consistent code screenshots:
- **Theme**: Oceanic Next
- **Font**: Source Code Pro, 18px
- **Export**: 2x resolution, 800px width
- **Transparency**: Enabled for flexible backgrounds

Configuration: `carbon-config.json`

## 📁 Project Structure

```
├── .github/workflows/     # CI/CD workflows
├── archetypes/           # Content templates
├── assets/              # Static assets, fonts
├── config/              # Multi-environment configs
├── content/             # Blog content
├── layouts/             # Template customizations
│   ├── shortcodes/      # Custom shortcodes
│   ├── partials/        # Template partials
│   └── _default/        # Layout overrides
├── static/              # Static files
├── compose.yaml         # Docker development setup
├── hugo-runtime.dockerfile  # Custom Hugo image
├── server.sh           # Development server script
├── newpost.sh          # Post creation utility
└── SHORTCODES.md       # Shortcode documentation
```

## 🔧 Maintenance & Updates

### Theme Updates
```bash
# Update PaperMod theme
git submodule update --remote themes/PaperMod
```

### Hugo Updates
Update `HUGO_VERSION` in compose.yaml and rebuild:
```bash
docker-compose build --no-cache
```

### Dependencies
```bash
# Update Hugo modules
hugo mod get -u
hugo mod tidy
```

## 📚 Additional Resources

- **Theme Documentation**: [PaperMod Wiki](https://github.com/adityatelange/hugo-PaperMod/wiki)
- **Hugo Documentation**: [gohugo.io](https://gohugo.io/documentation/)
- **Shortcode Reference**: [SHORTCODES.md](./SHORTCODES.md)
- **Live Site**: [devdosvid.blog](https://devdosvid.blog)

## 🤝 Contributing

1. Create feature branch from `main`
2. Make changes with comprehensive testing
3. Update documentation as needed
4. Submit pull request for review

---

*This documentation covers all custom implementations and non-standard features of this Hugo blog setup.*
