# Micro Posts Feature

A Twitter-like short posts feature for your Hugo blog, perfect for quick thoughts, updates, and bite-sized content.

## 🎯 Features

- **Simplified Creation**: Easy CLI script for creating micro posts
- **Timeline Layout**: Beautiful timeline view for browsing micro posts
- **Homepage Integration**: Recent micro posts displayed on homepage
- **Minimal Frontmatter**: Streamlined metadata (no cover images, simplified structure)
- **Mobile Responsive**: Works perfectly on all devices
- **Theme Integration**: Seamlessly integrates with PaperMod theme

## 📁 Structure

```
content/
├── micros/                    # New micro posts section
│   ├── _index.md             # Micro posts listing page
│   └── YYYYMMDDHHMMSS-slug/  # Individual micro posts
│       └── index.md
├── posts/                     # Regular blog posts (unchanged)
...

layouts/
├── index.html                # Homepage with micro posts integration
├── micros/
│   ├── list.html             # Timeline view for micro posts
│   └── single.html           # Individual micro post view
└── partials/
    └── recent-micros.html    # Homepage micro posts partial

archetypes/
└── micro/
    └── index.md              # Template for new micro posts
```

## 🚀 Usage

### Creating a New Micro Post

Use the provided script for easy creation:

```bash
./newmicro.sh "Your micro post title or content"
```

Examples:
```bash
./newmicro.sh "Just deployed a new feature"
./newmicro.sh "Quick Terraform tip"
./newmicro.sh "Weekend thoughts on architecture"
```

This will:
1. Generate a timestamp-based filename
2. Create the micro post with proper frontmatter
3. Open it for editing

### Manual Creation

You can also manually create micro posts:

```bash
hugo new --kind micro "micros/my-micro-post"
```

### Frontmatter

Micro posts use simplified frontmatter:

```yaml
---
title: "Your Micro Post Title"
date: 2025-01-29T14:00:00+02:00
type: "micro"
draft: false
tags: ["tag1", "tag2"]  # optional
---

Your micro post content here...
```

## 🎨 Layouts

### Timeline View (`/micros/`)
- Clean timeline design with speech bubbles
- Date indicators on the left
- Easy scanning of content
- Tag support

### Individual Post View
- Minimal, focused design
- Twitter-like card appearance
- Prominent timestamp
- Tag display

### Homepage Integration
- Shows 3 most recent micro posts
- Grid layout on desktop, single column on mobile
- Direct links to full micro posts section

## ⚙️ Configuration

The feature is already configured in `config/_default/config.yaml`:

```yaml
params:
  mainSections: ["posts", "micros"]  # Includes micros in main content

menu:
  main:
    - identifier: micros
      name: "Micro Posts"
      url: /micros/
      weight: 15
```

## 🎯 Best Practices

### Content Guidelines
- **Length**: No strict limits, but aim for concise content (1-3 paragraphs)
- **Frequency**: Perfect for daily thoughts, quick updates, links with commentary
- **Tone**: More casual and immediate than regular blog posts

### Use Cases
- Quick development updates
- Interesting links with brief commentary
- Random thoughts about technology
- Behind-the-scenes glimpses
- Quick tips and tricks
- Reactions to industry news

### SEO Considerations
- Micro posts are included in RSS feeds
- They appear in search results
- Use relevant tags for discoverability
- Consider using descriptive titles

## 🛠️ Customization

### Styling
All styles are included in the layout files. You can customize:
- Colors by modifying CSS custom properties
- Layout spacing and sizing
- Card appearance and hover effects

### Homepage Display
Modify `layouts/partials/recent-micros.html` to:
- Change number of posts displayed (currently 3)
- Adjust grid layout
- Modify card design

### Timeline Appearance
Edit `layouts/micros/list.html` to:
- Change timeline styling
- Modify bubble appearance
- Adjust date formatting

## 🔧 Technical Details

### File Naming Convention
Micro posts use timestamp-based naming for chronological ordering:
- Format: `YYYYMMDDHHMMSS-slug`
- Example: `20250129140000-testing-micro-posts`

### Content Type
- Uses `type: "micro"` to distinguish from regular posts
- Included in `mainSections` for homepage display
- Separate section for dedicated browsing

### Theme Integration
- Fully compatible with PaperMod theme
- Uses theme's CSS variables for consistent styling
- Respects theme's dark/light mode settings

## 📱 Mobile Experience

The micro posts feature is fully responsive:
- Timeline collapses to single column on mobile
- Cards adapt to smaller screens
- Touch-friendly navigation
- Optimized reading experience

## 🔮 Future Enhancements

Potential improvements for future versions:
- Character count indicator during creation
- Categories for micro posts
- Search integration
- Archive views by date
- Pagination for large numbers of micro posts
- Social media integration

## 🐛 Troubleshooting

### Micro posts not appearing
1. Check that `draft: false` in frontmatter
2. Verify `mainSections` includes "micros" in config
3. Ensure proper file structure under `content/micros/`

### Styling issues
1. Clear browser cache
2. Check CSS custom properties are properly defined
3. Verify layout files are in correct locations

### Navigation missing
1. Check menu configuration in `config.yaml`
2. Verify menu weight ordering
3. Ensure URL path matches section structure

---

*This feature seamlessly integrates with your existing Hugo blog while providing a new way to share quick thoughts and updates with your audience.*