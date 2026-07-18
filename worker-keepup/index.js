// The keepup Worker. Serves the weekly digest + archive at /keepup, straight
// from the R2 bucket the cron writes to (one-way). Runs on its own route so it
// deploys independently of the blog — a keepup deploy can't touch the blog, and
// weekly content updates need no redeploy (R2 is read live).
//
// noindex on *.workers.dev so the raw deploy URL never competes with the real
// domain in search. Denylist, not allowlist — the production route can't be
// accidentally de-indexed.
export default {
  async fetch(request, env) {
    const response = await route(request, env)
    if (!new URL(request.url).hostname.endsWith('.workers.dev')) return response

    // Re-wrap so headers are mutable (R2/redirect responses can be immutable).
    const guarded = new Response(response.body, response)
    guarded.headers.set('x-robots-tag', 'noindex, nofollow')
    return guarded
  },
}

// The zone route only sends the keepup section here, but the workers.dev URL
// sees every path — so anything outside /keepup is a 404.
async function route(request, env) {
  const url = new URL(request.url)
  const path = url.pathname
  if (path === '/keepup' || path.startsWith('/keepup/')) return serveKeepup(url, env)
  return new Response('Not found', { status: 404 })
}

// Directory paths 301 to their slash form (SEO-consistent with the blog);
// /keepup/archive/ is generated live; any other path maps 1:1 to an object key.
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

// Build the "past digests" list from the archive/ prefix, newest-first. R2 list
// returns up to 1000 keys — ample for decades of weekly files.
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
