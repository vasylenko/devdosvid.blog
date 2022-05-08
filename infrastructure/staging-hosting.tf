locals {
  domain_name    = "devdosvid.blog"
  staging_domain = "devdosvid-blog.pages.dev"
}

data "cloudflare_zone" "this" {
  name = local.domain_name
}

resource "cloudflare_record" "cf_pages_alias" {
  name    = "staging"
  type    = "CNAME"
  zone_id = data.cloudflare_zone.this.id
  value   = local.staging_domain
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