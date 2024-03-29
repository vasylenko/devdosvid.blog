terraform {
  cloud {
    organization = "vasylenko"
    workspaces {
      name = "devdosvidblog"
    }
  }
}

provider "cloudflare" {
  #  export CLOUDFLARE_API_TOKEN=  # for local runs
  #  export CLOUDFLARE_ACCOUNT_ID= # for local runs
  rps                = 10
  api_client_logging = false
}