---
date: "2021-01-20T00:00:00Z"
description: How to manage mac1.metal EC2 instances with Terraform
images: ["2021-01-20-terraforming-mac1-metal-at-AWS.jpg"]
cover:
    image: "2021-01-20-terraforming-mac1-metal-at-AWS.jpg"
subtitle: Infrastructure as Code for macOS instances
tags: ["aws", "terraform", "automation", "ec2"]
title: Terraforming mac1.metal at AWS
url: /2021/01/20/terraforming-mac1-metal-at-AWS.html
---

Recently AWS [announced](https://aws.amazon.com/blogs/aws/new-use-mac-instances-to-build-test-macos-ios-ipados-tvos-and-watchos-apps/) the support for Mac mini instances.

I believe this is huge, even despite the many constraints this solution has. Oh, and the price is as huge as the announcement as well.

But still, this offering opens the door to seamless macOS CI/CD integration into existing AWS infrastructure.

Here is a tip for engineers like me who decided to give this new instance type a try: managing a dedicated host for the "mac1.metal" instance using Terraform.

"mac1.metal" instance requires a dedicated host to be placed onto. This is a real Mac mini with a bit of magic from AWS.

As of 10 Jan 2021, the AWS Terraform provider does not have a dedicated host resource.

So we must solve this using  CloudFormation... in Terraform!

```hcl
variable "availability_zone" {
  default = "us-east-1a"
}

resource "random_pet" "runner_name" {
  length    = 2
  prefix    = "mac-metal-"
  separator = "-"
}

resource "aws_cloudformation_stack" "dedicated_host" {
  name = random_pet.runner_name.id

  timeout_in_minutes = 20

  template_body = <<STACK
{
  "Resources" : {
    "MyDedicatedHost": {
      "Type" : "AWS::EC2::Host",
      "Properties" : {
          "AutoPlacement" : "on",
          "AvailabilityZone" : "${var.availability_zone}",
          "HostRecovery" : "off",
          "InstanceType" : "mac1.metal"
        }
    }
  },
  "Outputs" : {
    "HostID" : {
      "Description": "Host ID",
      "Value" : { "Ref" : "MyDedicatedHost" }
    }
  }
}
STACK
}

output "dedicated_host_id" {
  value = aws_cloudformation_stack.dedicated_host.outputs["HostID"]
}
```

Then you pass HostID to `aws_instance` resource, and you have mac1.metal up and running!

I like to make boring technical things a bit less boring, so I decided to add a random pet name. Just for fun, why not.

You can wrap this into a module or add a count meta-argument to make it more versatile.

Simple as that, yes. But now, you can integrate it into your CI system (if you have enough courage and money 😄) and have the Mac instance with the underlying host in a bundle.

Thanks for reading me!


------
*credits for cover image: [AWS EC2 Mac Instances Launch - macOS in the cloud for the first time, with the benefits of EC2](https://www.youtube.com/watch?v=Pn3miC_tTH0)*