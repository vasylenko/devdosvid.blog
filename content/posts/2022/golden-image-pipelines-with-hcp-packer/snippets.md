## packer-template-example

```hcl
build {
  hcp_packer_registry {
    bucket_name = local.os_slug
    description = "Bucket for Amazon Linux 2"

    bucket_labels = {
      "owner" = "platform-team"
      "os"    = "Amazon Linux",
    }

    build_labels = {
      "build-time"      = timestamp()
      "base-ami-filter" = var.ami_base_filter_name
    }
  }
  sources = [
    "source.amazon-ebs.amazon-linux2-east",
    "source.amazon-ebs.amazon-linux2-west"
  ]
}
```

## packer-build-output

```shell
==> Builds finished. The artifacts of successful builds are:
--> amazon-ebs.amazon-linux2-east: AMIs were created:
us-east-1: ami-09c2d98160c47e7bd

--> amazon-ebs.amazon-linux2-east: Published metadata to HCP Packer registry packer/amazon-linux2/iterations/02GJ4X1RPY4Q4ZGWJP4DM7RF0A
```

## packer api curl request

```shell
HCP_ACCESS_TOKEN=<your token here>

HCP_ORG_ID="23bv9840-92aa-7419-abdh-0242ac000900"
HCP_PROJECT_ID="81bc1234-4123-abdh-ba79-0242ac218421"
HCP_BUCKET_NAME="amazon-linux2"
HCP_CHANNEL_NAME="stable"
HCP_BASE_URL="https://api.cloud.hashicorp.com/packer/2021-04-30"

curl -X PATCH \
--header "Authorization: Bearer $HCP_ACCESS_TOKEN" \
--data '{
"incremental_version":"3",
"iteration_id":"01H8V7WBDWRBCMZDZ2HG3MKSDL"
}' \
"${HCP_BASE_URL}/organizations/${HCP_ORG_ID}/projects/${HCP_PROJECT_ID}/images/${HCP_BUCKET_NAME}/channels/${HCP_CHANNEL_NAME}"
```

## terraform-hcp-packer

```terraform
provider "hcp" {}

data "hcp_packer_iteration" "amzlinux" {
  bucket_name = "amazon-linux2"
  channel     = "stable"
}

data "hcp_packer_image" "amzlinux_east" {
  bucket_name    = "amazon-linux2"
  cloud_provider = "aws"
  iteration_id   = data.hcp_packer_iteration.amzlinux.ulid
  region         = local.region
}

resource "aws_instance" "this" {
  ami           = data.hcp_packer_image.amzlinux_east.cloud_image_id
  instance_type = "t3.nano"
  subnet_id     = local.subnet_id
}
```

## logic-for-revoked-iteration

```terraform
resource "aws_instance" "example" {
  count         = data.hcp_packer_image.amzlinux_east.cloud_image_id == "error_revoked" ? 0 : 1
  ami           = data.hcp_packer_image.amzlinux_east.cloud_image_id
  instance_type = "t3.nano"
  subnet_id     = local.subnet_id
}
```