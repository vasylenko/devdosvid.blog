locals {
  domain_name = "devdosvid.blog"
  github_ips = toset(["185.199.111.153", "185.199.110.153", "185.199.109.153", "185.199.108.153"])
}


resource "cloudflare_zone" "this" {
  zone = local.domain_name
  plan = "free"
}


resource "cloudflare_record" "github" {
  for_each = local.github_ips

  name     = local.domain_name
  type     = "A"
  zone_id  = cloudflare_zone.this.id
  value    = each.key
  proxied  = true
}

resource "cloudflare_record" "cf_pages_alias" {
  name    = "staging"
  type    = "CNAME"
  zone_id = cloudflare_zone.this.id
  value   = "staging-devdosvid-blog.pages.dev"
  proxied = true
}

resource "cloudflare_record" "www" {
  name    = "www"
  type    = "CNAME"
  zone_id = cloudflare_zone.this.id
  value   = local.domain_name
  proxied = true
}

resource "cloudflare_record" "google_site_verification" {
  name    = local.domain_name
  type    = "TXT"
  zone_id = cloudflare_zone.this.id
  value   = "google-site-verification=-tRStZVPDa5N0PeoJnEeVCjl3608UhV7k6F7KNMplK0"
  proxied = false
}