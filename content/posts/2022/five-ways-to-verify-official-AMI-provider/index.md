---
title: "Five ways to get the verified official EC2 AMI"
date: 2022-07-24T15:21:05+02:00
summary: ~112 or ~22 words
description: How to find the verified official AMI of the needed OS among thousands available in AWS ~112 or ~22 words
cover:
    image: cover-image.png
    relative: true
tags: []
categories: []
draft: true
---

EC2 AMI catalog consists of more than 160k public AMIs. It is a mix of Images created by users, published by vendors, and provided by AWS.

So how to make sure that AMI comes from a verified vendor or it's an official AMI published by AWS? How to find the trusted one among them all?

{{<figure src="who-is-ami-owner.png" caption="Find the ~~Waldo~~ verified AMI owner">}}

On AWS it's typical that some thing or an action can be made or done in several ways. Some ways are official, some of them works better than others, and some you can use just for fun ([check](https://www.lastweekinaws.com/blog/the-17-ways-to-run-containers-on-aws/) [that](https://www.lastweekinaws.com/blog/17-more-ways-to-run-containers-on-aws/)).

In this article, I want to describe five ways to get the official and verified AMI for your next EC2 Instance launch.

## EC2 Launch Wizard and AMI Catalog

When you're launching an EC2 Instance from a Management Console, you can apply the "Verified Provider" filter for the Community AMIs tab to make sure you get an AMI from a verified provider. The "Verified provider" labels means that an AMI is owned by Amazon verified account.

In the following example I am sure that the Ubuntu 20.04 AMI comes from the verified source:

{{<figure src="verified-ami-in-ami-catalog.png" caption="Verified AMI in the AMI Catalog">}}

In past, you had to compare the AMI Owner ID with the publicly shared list of verified Owner IDs for every region. Not a rocket science, but takes time. So now it's much simpler thanks to the "Verified Provider" label.

This feature also works great when you creating a Launch Template. The Launch Template creation wizard seamlessly guides you from itself to the AMI Catalog (where you can search and pick the AMI) and back again.

## EC2 AMI browser

There is another interface in the Management Console that acts an the AMI browser. It does not have any fancy name except for the "AMIs page", but you know about it: it looks like a list of AMIs and you can see it when you click on the "AMIs" menu item on the left side of the EC2 page menu.

The AMI page allows to leverage the API filters to narrow down the search, and the "Owner alias" is the one you need to make sure that an AMI comes from the trusted owner.

Here is how it looks for my search of the official Amazon Linux 2 AMI:

{{<figure src="verified-amazon-linux-2-ami-in-ami-browser-ec2-console.png" caption="Official Amazon Linux 2 AMI">}}

AMIs shared by verified sources have ‘amazon’ (for AWS) or ‘aws-marketplace’ (for AWS partners) as the value for owner-alias.

## Terraform

Finding the official AMI with Terraform is simple as well. 

For example, here is how you can find the same Amazon Linux 2 AMI by specifying the `amazon` as the value for the `owner` argument of the [aws_ami data source](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ami):

{{<figure src="verified-official-amazon-linux-2-ami-terraform-datasource.png" caption="Finding the official Amazon Linux 2 AMI with Terraform">}}

## AWS CLI

{{<figure src="verified-official-amazon-linux-2-ami-in-aws-cli.png" caption="Find the verified AMI with AWS CLI">}}

## AWS Systems Manager Parameter Store

{{<figure src="verified-official-amazon-eks-optimized-ami-aws-cli.png" caption="Get the latest EKS optimized AMI from SSM">}}

https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-store-finding-public-parameters.html



ami-amazon-linux-latest
ami-windows-latest
ami-macos-latest
bottlerocket
canonical
debian
freebsd

marketplace for the rest