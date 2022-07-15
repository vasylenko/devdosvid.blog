---
date: "2021-01-19T00:00:00Z"
title: mac1.metal and mac2.metal EC2 Instances — user experience
description: Apple macOS development ecosystem with the power of AWS Cloud
summary: Apple macOS development ecosystem with the power of AWS Cloud
cover:
  image: cover-image.jpg
  relative: true
tags: ["aws", "macos", "ec2", "mac1.metal", "mac2.metal", "macos ci/cd"]
categories: [Amazon Web Services]
aliases: ["/2021/01/19/mac1-metal-EC2-Instance-user-experience.html"]
series: ["mac1.metal at AWS"]
---

This is the review of EC2 Mac instances, **mac1.metal** and **mac2.metal** — the new EC2 instance types that enables macOS workloads on AWS.   

{{<updatenotice>}}
**Updated in June 2022**: new information added about the offering — more cool stuff 🤩
{{</updatenotice>}}

AWS announced EC2 macOS instances based on the Intel CPU on 30 November 2020.

After a year and a half, the M1 Mac Instances arrived (7 July 2022).

Some basic information about the Mac EC2 first:

- The **mac1.metal** instances are Intel-based

  12 vCPU, 32 GiB RAM | 10 Gbps Network and 8 Gbps EBS bandwidth

- The **mac2.metal** instances are powered by M1 Apple Silicon processors.

  8 vCPU, 16 GiB RAM, 16 core Apple Neural Engine | 10 Gbps Network and 8 Gbps EBS bandwidth

- The Instance must be placed onto a [Dedicated Host](https://aws.amazon.com/ec2/dedicated-hosts/) because these are physical Apple Mac minis.

- AWS has integrated the [Nitro System](https://aws.amazon.com/ec2/nitro/) to make Macs work as EC2 instances and connect them with many other services.

  Mac minis are connected to the AWS Nitro via Thunderbolt, just a fun fact.

- You don't pay anything for the Instance itself, but you pay for the Dedicated Host leasing, and the minimum lease time is 24 hours.

## EC2 Mac Instance Prices (June 2022)
On-demand pricing (us-east-1, North Virginia:
- mac1.metal costs 1.083 USD per hour or about 780 USD per month
- mac2.metal costs 0.65 USD per hour or about 470 USD per month

{{<attention>}}
The mac2.metal costs 40% less compared to the mac1.metal
{{</attention>}}

Since the minimal leas time for the mac*.metal dedicated host is 24 hours, the first launch of the Instance is always costly, mind that while testing.

One day of mac1.metal usage costs 26 USD

One day of mac2.metal usage costs 15.6 USD

To save yourself some money, you can use [Savings Plans](https://aws.amazon.com/savingsplans/compute-pricing/), both Instance and Compute, and save up to 44% off On-Demand pricing.

For example, with the one-year commitment, partial 50% upfront payment, and the Instance Savings pricing model, you can get the 20% lower price per hour:

- mac1.metal — 0.867 USD 
- mac2.metal — 0.52 USD 

Feel free to play with the numbers in the [Dedicated Host Pricing Calculator](https://calculator.aws/#/createCalculator/EC2DedicatedHosts)

## Supported Operating Systems (June 2022)

- macOS Mojave 10.14.x (mac1.metal only)
- macOS Catalina 10.15.x (mac1.metal only)
- macOS Big Sur 11.x
- macOS Monterey 12.x

## What can it do

Here is a list of some features that the mac1.metal and mac2.metal instances have:
- It lives in your VPC because it is an EC2 Instance, so you can access many other services.
- For EBS, it supports the attachment of up to 16 volumes for mac1 and 10 for mac2.
- It supports SSM Agent and Session Manager.
- It has several AWS tools pre-installed: AWS CLI, SSM Agent, EFS Utils, and more.
- It has pre-installed Enhanced Network Interface drivers. My test upload/download to S3 was about 300GB/s.
- It can report CPU metrics to CloudWatch.
- It supports [AutoScaling](https://devdosvid.blog/2021/10/24/auto-scaling-group-for-your-macos-ec2-instances-fleet/) 🚀
- And you can share the instances using [AWS Resource Access Manager]({{<ref "/posts/2021/aws-ram-multi-account-resource-organization/index.md">}}).

  For example, you can have a dedicated AWS account used solely as a MacOS-based farm in your organization where instances are shared with other accounts.
- Although there is a local SSD disk available, EC2 Mac can boot only from the EBS

{{<attention>}}
The built-it physical SSD is still there and yours to use: build-cache, temporary storage, etc.

However, AWS does not manage or support the Apple hardware's internal SSD. So there is no guarantee for data persistency.
{{</attention>}}

## What can't it do

- It can't recognize the attached EBS if you connected it while the instance was running — you must reboot the instance to make it visible.
- It does not recognize the live resize of EBS either — you must reboot the instance so resize change can take effect.
- And the same relates to the Elastic Network Interfaces — attach and reboot the instance to apply it.
- It does not support several services that rely on additional custom software, such as "EC2 Instance Connect" and "AWS Inspect." But I think that AWS will add macOS distros for those soon.

As of July 2022, mac2.metal is not supported by Host Resource Groups. Therefore you cannot use mac2.metal Instances in Auto Scaling Groups. But AWS support says they are working on that, so fingers crossed!

## Launching the Instance

{{<figure src="launch.png" width="400" height="200">}}

Jeff Bar [published](https://aws.amazon.com/blogs/aws/new-use-mac-instances-to-build-test-macos-ios-ipados-tvos-and-watchos-apps/) an excellent how-to about kickstart of the "mac1.metal", so I will focus on things he did not mention.

Once you allocated the Dedicated Host and launched an Instance, the underlying system connects the EBS with a root file system to the Mac Mini.

The Mac metal Instances can boot from the EBS-backed macOS AMIs only.

If you specified the EBS size to be more than AMI's default, you need to resize the disk inside the system manually after the boot [^1].

The time from the Instance launch until you can SSH into it varies between 5 and 20 minutes.

You have the option to access it over SSH with your private key. For example, if you need to set up Screen Sharing, you must allow it through the "kickstart" command-line utility and set the user password [^2].

## Customizing the Instance
{{<figure src="customize.png" width="400" height="200">}}
I wrote a separate post about mac1.metal AMI customization and creation, so check it out!

[**Customizing mac1.metal EC2 AMI — new guts, more glory**]({{< ref "/posts/2021/2021-02-01-customizing-mac1-metal-ec2-ami/index.md" >}})

Though, I would like to mention two things here:

1. System updates are disabled by default in the macOS AMIs provided by AWS.

But you can use them with no issues. For example:
  ```shell
  sudo softwareupdate --install --all
  ```

2. It is possible to set a custom screen resolution when connected to the instance using native ScreenSharing or any other VNC-compatible software.

There are many tools, but AWS suggests the [displayplacer](https://github.com/jakehilborn/displayplacer).

## Destroying the Instance
{{<figure src="cleanup.png" width="400" height="200">}}
Such an easy thing to do, right? Well, it depends.

The complex Instance scrubbing process begins when you click on the "Terminate" item in the Instance actions menu.

AWS wants to ensure that anyone who uses the Host (Mac mini) after you will get your data stored neither on disks (including the physical SSD mentioned earlier) nor inside memory or NVRAM, nor anywhere else.

AWS does not share many details of this scrubbing process, but it takes more than an hour to complete.

When scrubbing is started, the Dedicated Host transitions to the Pending state.

Dedicated Host transitions to Available state once scrubbing is finished. But you must wait for another 10-15 minutes to be able to release it finally.

I don't know why they set the Available state value earlier than the Host is available for operations, but this is how it works now (Jan'21).

Therefore, you can launch the next Instance on the same Host no earlier than ~1,5 hours after you terminated the previous one. That doesn't seem very pleasant in the first couple of weeks, but you will get used to it. 😄

And again: you can release the "mac1.metal" Dedicated Host no earlier than 24 hours after it was allocated. So plan your tests wisely.

{{<attention>}}
If the lease time of a host is more than 24 hours, you don’t need to wait for the scrubbing process to finish to release that host.
{{</attention>}}

## Legal things

It is a bit tricky thing, but in short words:

- you are allowed to use the Instances solely for developer purposes
- you must agree to all software EULAs on the system

Here is the license agreement of the macOS Monterey if you want to deal with it like a pro — [link](https://www.apple.com/legal/sla/docs/macOSMonterey.pdf).

## Some more cool stuff to check:

[EC2 macOS Init](https://github.com/aws/ec2-macos-init) launch daemon, which initializes Mac instances.
[EC2 macOS Homebrew Tap](https://github.com/aws/homebrew-aws) (Third-Party Repository) with several management tools which come pre-installed into macOS AMI from AWS.


Indeed it is powerful, and it has its trade-offs, such as price and some technical constraints. But it is an actual macOS device natively integrated into the AWS environment. So I guess it is worth to be tried!

Thanks for reading this! Stay tuned for more user experience feedback about baking custom AMIs, automated software provisioning with Ansible, and other adventures with mac1.metal!


[^1]: **How to resize the EBS at mac1.metal in Terminal**

    Get the identifier of EBS (look for the first one with GUID_partition_scheme):
    `diskutil list physical external`
    
    Or here is a more advanced version to be used in a script:
    
    ```shell
    DISK_ID=$(diskutil list physical external | grep 'GUID_partition_scheme'| tr -s ' ' | cut -d' ' -f6)
    ```
    
    It would probably be `disk0` if you did not attach additional EBS.
    
    Then run the repair job for the disk, using its identifier:
    `diskutil repairDisk disk0`
    
    Advanced version:
    ```shell
    yes | diskutil repairDisk $DISK_ID
    ```
    
    Now get the APFS container identifier (look for Apple_APFS):
    `diskutil list physical external`
    
    Advanced version:
    ```shell
    APFS_ID=$(diskutil list physical external | grep 'Apple_APFS' | tr -s ' ' | cut -d' ' -f8)
    ```
    It would probably be `disk0s2` if you did not attach additional EBS.
    
    
    Finally, resize the APFS container:
    `diskutil apfs resizeContainer disk0s2`
    
    Advanced version
    ```shell
    diskutil apfs resizeContainer $APFS_ID
    ```


[^2]: **How to setup Screen Sharing at mac1.metal in Terminal**

    The `kickstart` command-line tool resides in `/System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Resources/` so you'll better to cd into that directory for convenience:
    
    ```shell
    # Turn On Remote Management for a user to be specified later
    sudo ./kickstart -activate -configure -allowAccessFor -specifiedUsers
    
    # Enable Remote Management for ec2-user user
    sudo ./kickstart -configure -users ec2-user -access -on -privs -all
    
    # Set the user password 
    sudo passwd ec2-user
    ```