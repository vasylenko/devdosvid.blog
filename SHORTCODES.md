# Hugo Shortcode Reference Guide

This document serves as a reference for all custom shortcodes available in this Hugo site. Each shortcode is explained with its purpose, parameters, and usage examples.

## Table of Contents

- [Content Enhancement](#content-enhancement)
  - [Attention](#attention)
  - [Update Notice](#update-notice)
  - [Snippet](#snippet)
  - [Raw HTML](#raw-html)
- [Media](#media)
  - [YouTube](#youtube)
  - [Figure](#figure)
  - [Animation](#animation)
  - [Gist](#gist)
- [Components](#components)
  - [Email Subscription](#email-subscription)
  - [Social Profiles](#social-profiles)
  - [Tech Talk](#tech-talk)
- [Utilities](#utilities)
  - [Latest Post](#latest-post)

## Content Enhancement

### Attention

Creates a highlighted box to draw attention to important information.

**Usage:**
```
{{< attention >}}
**Important:** This information requires special attention!
{{< /attention >}}
```

### Update Notice

Displays an update notification for content that has been revised.

**Usage:**
```
{{< updatenotice >}}
**Updated on May 15, 2023:** This article has been updated with new information.
{{< /updatenotice >}}
```

### Snippet

Creates an expandable code snippet that users can click to reveal.

**Usage:**
```
{{< snippet >}}
```bash
# Your code here
echo "Hello World"
```
{{< /snippet >}}
```

### Raw HTML

Allows insertion of raw HTML into markdown content.

**Usage:**
```
{{< rawhtml >}}
<div class="custom-element">
  This is raw <strong>HTML</strong> content.
</div>
{{< /rawhtml >}}
```

## Media

### YouTube

Embeds a YouTube video with responsive sizing and accessibility features.

**Parameters:**
- `src` (required): YouTube video ID
- `title`: Video title (for accessibility)
- `width`: Width of the video (defaults to 100%)
- `height`: Height of the video (defaults to 400px)
- `id`: Optional HTML ID for the container
- `class`: Optional CSS class for the container
- `allow_fullscreen`: Set to false to disable fullscreen option

**Usage:**
```
{{< youtube src="dQw4w9WgXcQ" title="Rick Astley - Never Gonna Give You Up" >}}
```

### Figure

Displays an image with optional caption, alt text, and formatting options.

**Parameters:**
- `src` (required): Image path
- `alt`: Alternative text for the image
- `caption`: Caption text
- `title`: Title for the figure
- `link`: URL to link the image to
- `target`: Target attribute for the link
- `rel`: Rel attribute for the link
- `class`: CSS class for the figure
- `width`: Width of the image
- `height`: Height of the image
- `align`: Alignment of the figure (use "center" for center alignment)

**Usage:**
```
{{< figure src="images/example.jpg" alt="Example image" caption="This is an example image" >}}
```

### Animation

Embeds a looping video animation (webm format).

**Parameters:**
- `src` (required): Path to the webm video file

**Usage:**
```
{{< animation src="/animations/demo.webm" >}}
```

**Note:** You can convert GIFs to webm using the ffmpeg command included in the shortcode:
```
ffmpeg -i source-file.gif -c vp9 -filter:v scale=800:-1 -b:v 0 -crf 41 dest-file.webm
```

### Gist

**Note:** This shortcode is deprecated in Hugo v0.143.0 and will be removed in a future release.

Embeds a GitHub Gist.

**Parameters:**
- First parameter: GitHub username
- Second parameter: Gist ID
- Third parameter (optional): Specific file from the Gist

**Usage:**
```
{{< gist username gist_id >}}
```

## Components

### Email Subscription

Embeds a Beehiiv subscription form.

**Usage:**
```
{{< email-subscription >}}
```

### Social Profiles

Displays social media profile links with icons.

**Usage:**
```
{{< social-profiles >}}
```

### Tech Talk

Displays information about a technical talk or presentation.

**Parameters:**
- `title` (required): Title of the talk
- `event` (required): Name of the event
- `date` (required): Date of the talk
- `event_link` (optional): URL to the event page
- `recording` (optional): URL to the talk recording
- `slides` (optional): URL to the presentation slides
- `image` (optional): Image preview for the talk
- `description` (optional): Brief description of the talk

**Usage:**
```
{{< tech-talk 
  title="Implementing DevOps in Legacy Environments" 
  event="DevOps Days 2023" 
  date="June 15, 2023"
  event_link="https://devopsdays.org/events/2023"
  recording="https://youtube.com/watch?v=example"
  slides="https://slideshare.net/example"
  image="/images/talks/devops-legacy.jpg"
  description="A practical approach to bringing DevOps practices into legacy software environments."
>}}
```

## Utilities

### Latest Post

Returns the URL of the most recent post.

**Usage:**
```
{{< utilities/latest-post >}}
```

---

## Tips for Using Shortcodes

1. **Nested Shortcodes**: Some shortcodes can contain other shortcodes. For example:
   ```
   {{< snippet >}}
   {{< youtube src="dQw4w9WgXcQ" >}}
   {{< /snippet >}}
   ```

2. **Escaping Shortcodes**: To display shortcode syntax instead of executing it, use `/*` and `*/`:
   ```
   {{</* youtube src="dQw4w9WgXcQ" */>}}
   ```

3. **Markdown in Shortcodes**: Shortcodes that support `.Inner` content typically allow markdown formatting within them, processed using the `markdownify` function. 