// The one Worker fronting devdosvid.blog.
//
// Two jobs:
//   1. /keepup/*  — served from the R2 bucket (KEEPUP). The weekly job writes
//      keepup's digest + archive there one-way; the "past digests" index is
//      built live from a bucket listing, so nothing re-renders when a new week
//      lands.
//   2. everything else — the static site (blog + slides): a permanent (301)
//      trailing-slash redirect, then asset serving. Cloudflare's built-in
//      redirect is a 307, which we can't accept for SEO.
//
// PROVISIONAL (Phase 4): verify run_worker_first runs this ahead of the asset
// layer, and that the bucket name/binding match wrangler.jsonc.
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = url.pathname

    if (path === '/keepup' || path.startsWith('/keepup/')) {
      return serveKeepup(url, env)
    }

    // Directory-style path missing its slash → permanent redirect to add it.
    // Skip real files (they carry an extension); those are served as-is.
    const last = path.split('/').pop()
    if (!path.endsWith('/') && !/\.[a-z0-9]+$/i.test(last)) {
      url.pathname += '/'
      return Response.redirect(url.toString(), 301)
    }
    return env.ASSETS.fetch(request)
  },
}

// keepup lives in R2, not the static bundle. Directory paths 301 to their slash
// form (matching the rest of the site); /keepup/archive/ is generated live; any
// other path maps 1:1 to an object key.
async function serveKeepup(url, env) {
  const path = url.pathname
  if (path === '/keepup') return Response.redirect(url.origin + '/keepup/', 301)
  if (path === '/keepup/archive') return Response.redirect(url.origin + '/keepup/archive/', 301)
  if (path === '/keepup/archive/') return archiveIndex(env)

  let key = 'keepup/' + path.slice('/keepup/'.length)
  if (key.endsWith('/')) key += 'index.html'

  const object = await env.KEEPUP.get(key)
  if (object === null) return new Response('Not found', { status: 404 })

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  if (key.endsWith('.html')) headers.set('content-type', 'text/html; charset=utf-8')
  headers.set('cache-control', 'public, max-age=300')
  return new Response(object.body, { headers })
}

// Build the "past digests" list from the archive/ prefix. Weeks are named
// <ISO-week>.html; show them newest-first. (R2 list returns up to 1000 keys —
// ample for decades of weekly files; add cursor paging only if that ever bites.)
async function archiveIndex(env) {
  const listed = await env.KEEPUP.list({ prefix: 'keepup/archive/' })
  const weeks = listed.objects
    .map((o) => o.key.slice('keepup/archive/'.length).replace(/\.html$/, ''))
    .filter((w) => w && w !== 'index')
    .sort()
    .reverse()

  const items = weeks.map((w) => `<li><a href="/keepup/archive/${w}.html">${w}</a></li>`).join('\n')
  const body = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>keepup — archive</title>
<style>
  :root { color-scheme: light dark; }
  body { max-width: 42rem; margin: 2.5rem auto 4rem; padding: 0 1.25rem;
         font: 17px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  h1 { font-size: 1.5rem; }
  ul { padding-left: 1.2rem; } li { margin-bottom: .5rem; }
  a { color: inherit; text-decoration-color: color-mix(in srgb, currentColor 40%, transparent); }
  a:hover { text-decoration-color: currentColor; }
</style>
</head>
<body>
<h1>keepup — past digests</h1>
<ul>
${items}
</ul>
<p><a href="/keepup/">Latest</a></p>
</body>
</html>
`
  return new Response(body, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' },
  })
}
