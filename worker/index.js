// The one Worker fronting devdosvid.blog. Its only logic is a permanent (301)
// trailing-slash redirect — Cloudflare's built-in asset redirect is a 307
// (temporary), which we can't accept for SEO. Everything else falls through to
// static asset serving (index.html resolution, custom 404).
//
// PROVISIONAL (Phase 4): confirm run_worker_first actually runs this ahead of
// the asset layer, and that the file-extension guard covers every real asset
// (.html, .xml, .woff2, .pdf, images) so keepup's .html pages aren't rewritten.
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const lastSegment = url.pathname.split('/').pop()

    // A path is a real file (not a directory) when its last segment has an
    // extension; those must never get a trailing slash appended.
    const isFile = /\.[a-z0-9]+$/i.test(lastSegment)
    if (!url.pathname.endsWith('/') && !isFile) {
      url.pathname += '/'
      return Response.redirect(url.toString(), 301)
    }

    return env.ASSETS.fetch(request)
  },
}
