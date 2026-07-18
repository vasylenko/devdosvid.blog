// The blog Worker: a 301 trailing-slash redirect, then static-asset serving for
// the blog at "/" (and "/slides" once the decks land) from the assembled dist/
// tree. Cloudflare's built-in trailing-slash redirect is a 307, which we can't
// accept for SEO.
//
// keepup is NOT here — it runs as its own Worker (worker-keepup/) on the
// /keepup route, so the two deploy independently.
//
// Preview hosts get X-Robots-Tag: noindex so Google never indexes a duplicate
// of the live site. This is a denylist on *.workers.dev (every deploy +
// version-preview URL), NOT an allowlist on the prod domain — so a production
// deploy can never be accidentally de-indexed, whatever hostname it serves on.
export default {
  async fetch(request, env) {
    const response = await route(request, env)
    if (!new URL(request.url).hostname.endsWith('.workers.dev')) return response

    // Re-wrap so headers are mutable (asset/redirect responses can be immutable).
    const guarded = new Response(response.body, response)
    guarded.headers.set('x-robots-tag', 'noindex, nofollow')
    return guarded
  },
}

async function route(request, env) {
  const url = new URL(request.url)
  const path = url.pathname

  // Directory-style path missing its slash → permanent redirect to add it.
  // Skip real files (they carry an extension); those are served as-is.
  const last = path.split('/').pop()
  if (!path.endsWith('/') && !/\.[a-z0-9]+$/i.test(last)) {
    url.pathname += '/'
    return Response.redirect(url.toString(), 301)
  }
  return env.ASSETS.fetch(request)
}
