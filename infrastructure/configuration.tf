terraform {
  cloud {
    organization = "vasylenko"
    workspaces {
      name = "devdosvid"
    }
  }
  required_version = "~> 1.2.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 3.18"
    }
  }
}

provider "cloudflare" {
  #  export CLOUDFLARE_API_TOKEN=  # for local runs
  #  export CLOUDFLARE_ACCOUNT_ID= # for local runs
  rps                = 10
  api_client_logging = false
}