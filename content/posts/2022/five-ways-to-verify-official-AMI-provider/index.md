---
title: "Five ways to get the verified official EC2 AMI"
date: 2022-07-24T15:21:05+02:00
summary: How to find the AMI you cat trust among thousands available in AWS
description: How to find the verified official AMI of the needed OS among thousands available in AWS ~112 or ~22 words
cover:
    image: cover-image.png
    relative: true
tags: []
categories: []
draft: true
---

EC2 AMI catalog consists of more than 160k public AMIs. It is a mix of Images created by users, published by vendors, and provided by AWS.

So how to make sure that an AMI comes from the verified vendor or that is an official AMI published by AWS?

How to find the trusted AMI among them all when you're about to launch an EC2 Instance?

{{<figure src="who-is-ami-owner.png" caption="Find the ~~Waldo~~ verified AMI owner">}}

On AWS it's typical that some thing or an action can be made or done in several ways — that's awesome. Some ways are official, some of them work better than others, and some you can use just for fun ([check](https://www.lastweekinaws.com/blog/the-17-ways-to-run-containers-on-aws/) [that](https://www.lastweekinaws.com/blog/17-more-ways-to-run-containers-on-aws/)).

In this article, I will describe five ways of getting the official and verified AMI for your next EC2 Instance launch.

## Use EC2 Launch Wizard and AMI Catalog to get the official AMI

When you're launching an EC2 Instance from a Management Console, you can apply the "Verified Provider" filter for the Community AMIs tab to make sure you get an AMI from a verified provider. The "Verified provider" labels means that an AMI is owned by Amazon verified account.

In the following example I am sure that the Ubuntu 20.04 AMI comes from the verified source:

{{<figure src="verified-ami-in-ami-catalog.png" caption="Verified AMI in the AMI Catalog">}}

In past, you had to compare the AMI Owner ID with the publicly shared list of verified Owner IDs for every region. Not a rocket science, but takes time. So now it's much simpler thanks to the "Verified Provider" label.

This feature also works great when you creating a Launch Template. The Launch Template creation wizard seamlessly guides you from itself to the AMI Catalog (where you can search and pick the AMI) and back again.

## Look for verified AMIs on the AMI page

There is another interface in the Management Console that acts as the AMI browser. It does not have any fancy name except for the "AMIs page", but you probably already know about it: it looks like a list of AMIs and you can see it when you click on the "AMIs" menu item on the left side of the EC2 page menu.

The AMI page allows to leverage the API filters to narrow down the search, and the "Owner alias" filter is the one you need to make sure that an AMI comes from a trusted owner.

Here is how it looks for my search of the official Amazon Linux 2 AMI:

{{<figure src="verified-amazon-linux-2-ami-in-ami-browser-ec2-console.png" caption="Official Amazon Linux 2 AMI">}}

AMIs shared by verified sources have `amazon` (for AWS) or `aws-marketplace` (for AWS partners) as the value for the Owner alias filter.

## Find the EC2 AMI with Terraform

Finding the official AMI with Terraform is simple as well — the [aws_ami data source](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ami) does the job. 

For example, here is how you can find the same Amazon Linux 2 AMI by specifying the `amazon` as the value for the `owner` argument of the data source:

{{<figure src="verified-official-amazon-linux-2-ami-terraform-datasource.png" caption="Finding the official Amazon Linux 2 AMI with Terraform">}}

Compare that with the filters on the AMI page — looks similar, right? This is because the way how Terraform works: it translates your code into API calls and sends them to AWS API endpoints. 

If you're very new to Terraform, I suggest reading this article to understand the basic concepts: [Terraform explained in English]({{< ref "/posts/2020/2020-05-02-terraform-explained-for-managers/index.md">}})

## Find the verified AMI using Describe Images EC2 CLI

Sometimes you might need to get the AMI from CLI to pass it along as an argument downstream of the pipeline.

This can be done with the **ec2 describe-images** command of the AWS CLI
{{<figure src="verified-official-amazon-linux-2-ami-in-aws-cli.png" caption="Find the verified AMI with AWS CLI">}}

The API filters I mentioned before also works here — use them to narrow your search.

## Find the trusted AMI using SSM Public parameters

Another way that involves AWS CLI is the **ssm get-parameter** command:
{{<figure src="verified-official-amazon-eks-optimized-ami-aws-cli.png" caption="Get the latest EKS optimized AMI from SSM">}}

It also reveals one useful feature of the Systems Manager — the Public parameters.

Systems Manager Public parameters is a way how AWS distributes some widely used artifacts related to their services. 

For example, you can find official AMIs for many distributives there: Amazon Linux, Windows, MacOS, Bottlerocket, Ubuntu, Debian, and FreeBSD.

Read more at the [Finding public parameters](https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-store-finding-public-parameters.html
) documentation page if you want to know more. 

