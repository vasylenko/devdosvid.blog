---
date: "2021-01-20T00:00:00Z"
showtoc: false
description: How to manage mac1.metal EC2 instances with Terraform
images: ["2021-01-20-terraforming-mac1-metal-at-AWS.jpg"]
cover:
    image: "2021-01-20-terraforming-mac1-metal-at-AWS.jpg"
subtitle: Infrastructure as Code for macOS instances
tags: ["aws", "terraform", "automation", "ec2"]
categories: [Cloud-based DevOps]
title: Terraforming mac1.metal at AWS
url: /2021/01/20/terraforming-mac1-metal-at-AWS.html
---

{{< updatenotice >}}
Updated on the 23rd of October, 2021: Terraform AWS provider now [supports](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/ec2_host) Dedicated Hosts natively
{{< /updatenotice >}}

In November 2021, AWS [announced](https://aws.amazon.com/blogs/aws/new-use-mac-instances-to-build-test-macos-ios-ipados-tvos-and-watchos-apps/) the support for Mac mini instances.

I believe this is huge, even despite the number of constraints this solution has. This offering opens the door to seamless macOS CI/CD integration into existing AWS infrastructure.

So here is a quick-start example of creating the dedicated host and the instance altogether using Terraform.

I intentionally used some hardcoded values for the sake of simplicity in the example.

```hcl
resource "aws_ec2_host" "example_host" {
  instance_type     = "mac1.metal"
  availability_zone = "us-east-1a"
}

resource "aws_instance" "example_instance" {
  ami           = data.aws_ami.mac1metal.id
  host_id       = aws_ec2_host.example_host.id
  instance_type = "mac1.metal"
  subnet_id     = data.aws_subnet.example_subnet.id
}

data "aws_subnet" "example_subnet" {
  availability_zone = "us-east-1a"
  filter {
    name   = "tag:Tier" # you should omit this filter if you don't distinguish your subnets on private and public 
    values = ["private"]
  }
}

data "aws_ami" "mac1metal" {
  owners      = ["amazon"]
  most_recent = true
  filter {
    name   = "name"
    values = ["amzn-ec2-macos-11*"] # get latest BigSur AMI
  }
}
```

Simple as that, yes. Now, you can integrate it into your CI system and have the Mac instance with the underlying host in a bundle.

💡 Pro tip: you can leverage the `aws_ec2_instance_type_offerings` [Data Source](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ec2_instance_type_offerings) and use its output with `aws_subnet` source to avoid availability zone hardcoding.

To make the code more uniform and reusable, you can wrap it into a [Terraform module](https://serhii.vasylenko.info/2020/09/09/terraform-modules-explained.html) that accepts specific parameters (such as `instance_type` or `availability_zone`) as input variables.