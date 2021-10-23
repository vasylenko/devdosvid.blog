---
title: "Auto Scaling Group with macOS EC2 Instance"
date: 2021-10-24T02:00:31+03:00
description:
cover:
    image: cover-image.png
    relative: true
tags: [aws, architecture]
categories: [Cloud-based DevOps]
draft: true
---

It’s been almost a year since I started using macOS EC2 instances on AWS: there were [ups and downs in service offerings](https://serhii.vasylenko.info/2021/01/19/mac1-metal-EC2-Instance-user-experience.html) and a lot of discoveries with [macOS AMI build](https://serhii.vasylenko.info/2021/02/01/customizing-mac1-metal-ec2-ami.html) automation.
And I like this small but so helpful update of EC2 service very much: with mac1.metal instances, seamless integration of Apple-oriented CI/CD with other AWS infrastructure could finally happen.

While management of a single mac1.metal node (or a tiny number of ones) is not a big deal (especially when [Dedicated Host support](https://serhii.vasylenko.info/2021/01/20/terraforming-mac1-metal-at-AWS.html) was added to Terraform provider), governing the fleet of instances is still complicated. Or it has been complicated until recent days.

## Official / Unofficial Auto Scaling
I want to share new findings that solve the following challenges related to the macOS environment in AWS:
- Scale mac1.metal instances horizontally
- Automatically allocate and release Dedicated Hosts needed for instances
- Automatically replace unhealthy mac1.metal instances

If you have worked with AWS before, you know that Auto Scaling Groups provides all that. However, official documentation (as of October 2021) [states](https://github.com/awsdocs/amazon-ec2-user-guide/blob/269ac7494dd3aef62ae5d45e8b11f7ea5cadd2bf/doc_source/ec2-mac-instances.md) that “You cannot use Mac instances with Amazon EC2 Auto Scaling”. But in fact, you can.

With the help of Licence Manager, Host Resource Groups and Launch Templates, you can set up EC2 Auto Scaling Group for mac1.metal and leave the automated instance provisioning to the service.

## Combining services to get real power
So how does all that work? Let’s review the basic scheme that illustrates the interconnection between mentioned services:

{{< figure src="general-scheme_compressed.png" alt="Services interconnection" >}}

### 1️⃣ License Configuration
First, you need to create a License Configuration so that the Host resource group can allocate the hots.

Go to AWS License Manager -> Customer managed licenses -> Create customer-managed license.

Specify **Sockets** as the Licence type. You may skip setting the Number of Sockets. However, the actual limit of mac1.metal instances per account is regulated by Service Quota. The default number of mac instances allowed per account is 3. Therefore, consider [increasing](https://docs.aws.amazon.com/servicequotas/latest/userguide/request-quota-increase.html) this to a more significant number.

{{< figure src="license-configuration_compressed.png" alt="Licence configuration values" >}}

### 2️⃣ Host resource group
Second, create the Host resource group: AWS License Manager -> Host resource groups -> Create host resource group.

When creating the Host resource group, check “Allocate hosts automatically” and “Release hosts automatically” but leave “Recover hosts automatically” unchecked. Dedicated Host does [not support host recovery](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/dedicated-hosts-recovery.html#dedicated-hosts-recovery-instances) for mac1.metal.
However, Auto Scaling Group will maintain the desired number of instances if one fails the health check (which assumes the case of host failure as well).

Also, I recommend specifying “mac1” as an allowed Instance family for the sake of transparent resource management: only this instance type is permitted to allocate hosts in the group.

{{< figure src="host-resource-group_compressed.png" alt="Host resource group configuration values" >}}

Optionally, you may specify the license association here (the Host group will pick any compatible license) or select the license you created on step one. 

### 3️⃣ Launch Template
Create Launch Template: EC2 -> Launch templates -> Create launch template.

I will skip the description of all Launch Template parameters (here is a nice [tutorial](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-launch-templates.html)), if you don’t mind, and keep focus only on the relevant to the current case.

Specify mac1.metal as the Instance type. Later, in Advanced details: find the **Tenancy** parameter and set it to “Dedicated host”; for **Target host by** select “Host resource group”, and once selected the new parameter **Tenancy host resource group** will appear where you should choose your host group; select your license in **License configurations** parameter.

{{< figure src="launch-template_compressed.png" alt="Launch Template configuration values" >}}

### 4️⃣ Auto Scaling Group
Finally, create the Auto Scaling Group: EC2 -> Auto Scaling groups -> Create Auto Scaling group.

The vital thing to note here — is the mac1.metal instance type availability. First of all, as of October 2021, it’s available in us-east-1 and [7 more regions](https://aws.amazon.com/about-aws/whats-new/2021/10/amazon-ec2-mac-instances-additional-regions/). However, not every Availability Zone in the region supports it. So you must figure out which AZ supports the needed instance type.

There is no documentation for that, but there is an AWS CLI command that can tell: [describe-instance-type-offerings — AWS CLI 2.3.0 Command Reference](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/ec2/describe-instance-type-offerings.html)

Here is an example for the us-east-1 region:
```shell
> aws ec2 describe-instance-type-offerings --location-type availability-zone-id --filters Name=instance-type,Values=mac1.metal --region us-east-1 --output text

INSTANCETYPEOFFERINGS	mac1.metal	use1-az6	availability-zone-id
INSTANCETYPEOFFERINGS	mac1.metal	use1-az4	availability-zone-id
```

Keep that nuance in mind when selecting a subnet for the mac1.metal instances.

## What about Infrastructure as Code?
Of course, I suggest describing all that as a code. I prefer Terraform, and fortunately, the AWS provider supports the needed resources. Except one 🙃.
As of October 2021, resources supported :
- [aws_servicequotas_service_quota](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/servicequotas_service_quota)
- [aws_licensemanager_license_configuration](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/licensemanager_license_configuration)
- [aws_launch_template](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/launch_template)
- [aws_autoscaling_group](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/autoscaling_group)

The Host resource group is not yet supported by the provider, unfortunately. However, we can use CloudFormation in Terraform to overcome that: describe the Host resource group as [aws_cloudformation_stack](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudformation_stack) Terraform resource using CloudFormation template from a file.

Here is how it looks like:
```hcl
resource "aws_licensemanager_license_configuration" "this" {
  name                     = local.full_name
  license_counting_type    = "Socket"
}

resource "aws_cloudformation_stack" "this" {
  name          = local.full_name # the name of CloudFormation stack
  template_body = file("${path.module}/resource-group-cf-stack-template.json")
  parameters = {
    GroupName = local.full_name # the name for the Host group, passed to CloudFormation template
  }
  on_failure = "DELETE"
}
```

And the next code snippet explains the CloudFromation template (which is the `resource-group-cf-stack-template.json` file in the code snippet above)

{{< collapse summary="Click to expand the code snippet" >}}
```json
{
  "Parameters" : {
    "GroupName" : {
      "Type" : "String",
      "Description" : "The name of Host Group"
    }
  },
  "Resources" : {
    "DedicatedHostGroup": {
      "Type": "AWS::ResourceGroups::Group",
      "Properties": {
        "Name": { "Ref": "GroupName" },
        "Configuration": [
          {
            "Type": "AWS::ResourceGroups::Generic",
            "Parameters": [
              {
                "Name": "allowed-resource-types",
                "Values": ["AWS::EC2::Host"]
              },
              {
                "Name": "deletion-protection",
                "Values": ["UNLESS_EMPTY"]
              }
            ]
          },
          {
            "Type": "AWS::EC2::HostManagement",
            "Parameters": [
              {
                "Name": "allowed-host-families",
                "Values": ["mac1"]
              },
              {
                "Name": "auto-allocate-host",
                "Values": ["true"]
              },
              {
                "Name": "auto-release-host",
                "Values": ["true"]
              },
              {
                "Name": "any-host-based-license-configuration",
                "Values": ["true"]
              }
            ]
          }
        ]
      }
    }
  },
  "Outputs" : {
    "ResourceGroupARN" : {
      "Description": "ResourceGroupARN",
      "Value" : { "Fn::GetAtt" : ["DedicatedHostGroup", "Arn"] }
    }
  }
}
```
{{< /collapse >}}

The `aws_cloudformation_stack` resource will export the `DedicatedHostGroup` attribute (see the code of CloudFromation template), which you will use later in the Launch Template resource. 

### Pro tips
If you manage an AWS Organization, I have good news: Host groups and Licenses are supported by [Resource Access Manager](https://docs.aws.amazon.com/ram/latest/userguide/shareable.html) service. Hence, you can host all mac instances in one account and share them with other accounts — it might be helpful for costs allocation, for example. Also, check out [my blog about AWS RAM](https://serhii.vasylenko.info/2021/09/25/aws-resource-access-manager-multi-account-resource-governance/) if you are very new to this service.

To solve the “which AZ supports mac metal” puzzle, you can leverage the [aws_ec2_instance_type_offerings](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ec2_instance_type_offerings) and [aws_subnet_ids](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/subnet_ids) data sources.

## What about costs?
License Manager is a [free of charge service](https://aws.amazon.com/license-manager/pricing/), as well as [Auto Scaling](https://aws.amazon.com/autoscaling/pricing/), and [Launch Template](https://aws.amazon.com/about-aws/whats-new/2017/11/introducing-launch-templates-for-amazon-ec2-instances/). So it’s all about the price for mac1.metal Dedicated Host which is [$1.083 per hour](https://aws.amazon.com/ec2/dedicated-hosts/pricing/) as of October 2021. Please note that the minimum allocation time for that type of host is 24 hours. I hope AWS will change that to 1-hour minimum someday (fingers crossed).

## Oh. So. ASG.
Considering the “hidden” (undocumented) nature of the described setup, I suggest treating it as rather testing than production-ready. However, my tests show that everything works pretty well: hosts are allocated, instances are spawned, and the monthly bill grows.
The Auto Scaling for mac1.metal opens new possibilities for CI/CD: you can combine that with your favorite tool (GitLab, Jenkins, whatsoever) using AWS Lambda and provision new instances when your development/testing environments need that. Or you can use other cool ASG stuff, such as Lifecycle hooks, to create even more custom scenarios.

I suppose and, frankly, hope that AWS will officially announce all this in the nearest future. Along with that, I am looking forward to the announcement of Monterey-based AMIs and maybe even M1 chip-based instances (will it be mac2.metal?).