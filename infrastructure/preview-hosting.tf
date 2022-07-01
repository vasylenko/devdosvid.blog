locals {
  domain_name    = "devdosvid.blog"
  preview_domain = "devdosvid-preview.pages.dev"
}

data "cloudflare_zone" "this" {
  name = local.domain_name
}

resource "cloudflare_record" "cf_pages_alias" {
  name    = "preview"
  type    = "CNAME"
  zone_id = data.cloudflare_zone.this.id
  value   = local.preview_domain
  proxied = true
}

resource "cloudflare_worker_script" "http_basic_auth" {
  content = file("${path.module}/http-basic-auth.js")
  name    = "basic-http-auth"
}

resource "cloudflare_worker_route" "staging" {
  zone_id     = data.cloudflare_zone.this.id
  pattern     = cloudflare_record.cf_pages_alias.hostname
  script_name = cloudflare_worker_script.http_basic_auth.name
}