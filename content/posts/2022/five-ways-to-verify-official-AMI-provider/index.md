---
title: "Five Practical Ways To Get The Verified EC2 AMI"
date: 2022-07-24T15:21:05+02:00
summary: How to find the AMI you cat trust among thousands available in AWS
description: How to find the AMI you cat trust among thousands available in AWS
cover:
    image: cover-image.png
    relative: true
tags: [ami, ec2 ami, official ami, verified ami, aws ssm, aws cli, terraform, ami catalog]
categories: []
draft: true
---

EC2 AMI catalog consists of more than 160k public AMIs — a mix of Images created by users, published by vendors, and provided by AWS.

So how to ensure that an AMI comes from the verified vendor or that is an official AMI published by AWS?

How to find the trusted AMI among them all when you're about to launch an EC2 Instance?

{{<figure src="who-is-ami-owner.png" caption="Find the ~~Waldo~~ verified AMI owner">}}

On AWS, it's typical that something can be made or done in several ways — that's awesome. Some of them work better than others, some methods are official, and some you can use just for fun ([check](https://www.lastweekinaws.com/blog/the-17-ways-to-run-containers-on-aws/) [that](https://www.lastweekinaws.com/blog/17-more-ways-to-run-containers-on-aws/)).

In this article, I will describe five ways of getting the official and verified AMI for your next EC2 Instance launch.

## Use EC2 Launch Wizard and AMI Catalog to get the official AMI

When launching an EC2 Instance from a Management Console, you can apply the "Verified Provider" filter for the Community AMIs tab to ensure you get an AMI from a verified provider. The "Verified provider" label means an AMI is owned by an Amazon verified account.

In the following example, I want to make sure that the Ubuntu 20.04 AMI comes from the verified source:

{{<figure src="verified-ami-in-ami-catalog.png" caption="Verified AMI in the AMI Catalog">}}

In the past, you had to compare the AMI Owner ID with the publicly shared list of verified Owner IDs for every region. Not rocket science, but it takes time. So now it's much more straightforward, thanks to the "Verified Provider" label.

This feature also works great when you are creating a Launch Template. The Launch Template creation wizard seamlessly guides you from itself to the AMI Catalog (where you can search and pick the AMI) and back again.

## Look for verified AMIs on the AMI page

Another interface in the Management Console acts as the AMI browser. It does not have any fancy name except for the "AMIs page", but you probably already know about it: it looks like a list of AMIs, and you can see it when you click on the "AMIs" menu item on the left side of the EC2 page menu.

The AMI page allows you to leverage the API filters to narrow down the search, and the "Owner alias" filter is the one you need to ensure that an AMI comes from a trusted owner.

Here is how it looks for my search of the official Amazon Linux 2 AMI:

{{<figure src="verified-amazon-linux-2-ami-in-ami-browser-ec2-console.png" caption="Official Amazon Linux 2 AMI">}}

AMIs shared by verified sources have `amazon` (for AWS) or `aws-marketplace` (for AWS partners) as the value for the Owner alias filter.

## Find the EC2 AMI with Terraform

Finding the official AMI with Terraform is also simple — the [aws_ami data source](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ami) does the job.

For example, here is how you can find the same Amazon Linux 2 AMI by specifying the `amazon` as the value for the `owner` argument of the data source:

{{<figure src="verified-official-amazon-linux-2-ami-terraform-datasource.png" caption="Finding the official Amazon Linux 2 AMI with Terraform">}}

Compare that with the filters on the AMI page — it looks similar, right? This is because of how Terraform works: it translates your code into API calls and sends them to AWS API endpoints.

If you're very new to Terraform, I suggest reading this article to understand the basic concepts: [Terraform explained in English]({{< ref "/posts/2020/2020-05-02-terraform-explained-for-managers/index.md">}})

## Find the official AWS AMI using Describe Images CLI

Sometimes you might need to get the AMI from CLI to pass it along as an argument downstream of the pipeline.

This can be done with the **ec2 describe-images** command of the AWS CLI
{{<figure src="verified-official-amazon-linux-2-ami-in-aws-cli.png" caption="Find the verified AMI with AWS CLI">}}

The API filters I mentioned before also work here — use them to narrow your search.

## Find the trusted AWS AMI with SSM

Another way that involves AWS CLI is the **ssm get-parameter** command:
{{<figure src="verified-official-amazon-eks-optimized-ami-aws-cli.png" caption="Get the latest EKS optimized AMI from SSM">}}

It reveals one helpful feature of the Systems Manager — the Public parameters.

Systems Manager Public parameters are how AWS distributes some widely used artifacts related to their services.

For example, you can find official AMIs for many distributives there: Amazon Linux, Windows, macOS, Bottlerocket, Ubuntu, Debian, and FreeBSD.

Read more at the [Finding public parameters](https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-store-finding-public-parameters.html
) documentation page if you want to know more.

## Are all verified AMIs good?

The "Verified provider" badge can be earned by a third party only when an AMI developer is registered as a Seller on the AWS Marketplace.

Becoming a Seller there is not trivial and requires some [conditions](https://docs.aws.amazon.com/marketplace/latest/userguide/user-guide-for-sellers.html#seller-requirements-for-publishing-free-products) to be met, and the [registration process](https://docs.aws.amazon.com/marketplace/latest/userguide/seller-registration-process.html) itself also implies submitting the tax and banking information.

Additionally, there are [specific policies and review processes](https://docs.aws.amazon.com/marketplace/latest/userguide/product-and-ami-policies.html) apply to all AMIs submitted to the Marketplace.

So it is okay to trust the third-party vendors with the "Verified" badge on a certain level. However, it is also always good to have additional scans and validation of the software you use. 🪲 😉
