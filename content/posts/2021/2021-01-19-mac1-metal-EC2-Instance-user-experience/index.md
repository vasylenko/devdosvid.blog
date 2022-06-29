---
date: "2021-01-19T00:00:00Z"
title: mac1.metal EC2 Instance — user experience
description: An overview of one-month user experience with the new mac1.metal EC2 Instances from AWS
images: ["2021-01-19-mac1-metal-EC2-Instance-user-experience.jpg"]
cover:
  image: 2021-01-19-mac1-metal-EC2-Instance-user-experience.jpg
tags: ["aws", "macos", "ec2"]
categories: [Amazon Web Services]
url: /2021/01/19/mac1-metal-EC2-Instance-user-experience.html
series: ["mac1.metal at AWS"]
---

This is the review of Mac Metal EC2 instances — a new EC2 instance type that enables macOS workloads on AWS.   

{{<updatenotice>}}
**Updated in June 2022**: new information added about the offering — more cool stuff 🤩
{{</updatenotice>}}

AWS announced EC2 macOS-based instances on November 30th, 2020, and after more than a month of tests, I would like to share some findings and impressions about it.

First of all, the things you can easily find, but it's still worth saying:
- The new instance family types are **mac1.metal** and **mac2.metal**.

  The `mac1.metal` instances on Intel-based CPUs have been available since 30 November 2020

  The `mac2.metal` powered by M1 Apple Silicon processors are in [preview (accessible by request)](https://pages.awscloud.com/M1MacPreview.html) and should become generally available in late 2022.

- The Instance must be placed onto a [Dedicated Host](https://aws.amazon.com/ec2/dedicated-hosts/) because these are physical Apple Mac minis in fact.
- AWS has integrated the [Nitro System](https://aws.amazon.com/ec2/nitro/) to make Macs work as EC2 instances and connect them many other services.

- You don't pay anything for the Instance itself, but you pay for the Dedicated Host leasing, and the minimum lease time is 24 hours.

  So even the launch of the "mac1.metal" Instance for "just one second" costs $26 at a minimum — mind that. Prices are provided for the cheapest region — North Virginia.

## EC2 Mac Instance Prices (June 2022)
On-demand pricing:
- mac1.metal costs $1.083 per hour or about $780 per month
- mac2.metal costs $0.65 per hour or about $470 per month

You can use [Savings Plans](https://aws.amazon.com/savingsplans/compute-pricing/) to save up to 44% off On Demand pricing.

## Supported Operating Systems (June 2022)

- macOS Catalina (version 10.15)

- macOS Mojave (version 10.14)

- macOS Big Sur (version 11)

- macOS Monterey (version 12)

## What can it do

Here is a list of some features that the "mac1.metal" instance has:
- It lives in your VPC because it is an EC2 Instance, so you can access many other services.
- It supports the new gp3 EBS type (and other types as well).
- It supports SSM Agent and Session Manager.
- It has several AWS tools pre-installed: AWS CLI, SSM Agent, EFS Utils, and more.
- It has pre-installed Enhanced Network Interface drivers. My test upload/download to S3 was about 300GB/s.
- It can report CPU metrics to CloudWatch.
- It supports [AutoScaling](https://devdosvid.blog/2021/10/24/auto-scaling-group-for-your-macos-ec2-instances-fleet/) 🚀

## What can't it do

- It can't recognize the attached EBS if you connected it while the instance was running — you must reboot the instance to make it visible.
- It does not recognize the live resize of EBS either — you must reboot the instance so resize change can take effect.
- And the same relates to the Elastic Network Interfaces — attach and reboot the instance to apply it.
- It does not support several services that rely on additional custom software, such as "EC2 Instance Connect" and "AWS Inspect." But I think that AWS will add macOS distros for those soon.

## Launching the Instance

{{<figure src="launch.png" width="400" height="200">}}

Jeff Bar [published](https://aws.amazon.com/blogs/aws/new-use-mac-instances-to-build-test-macos-ios-ipados-tvos-and-watchos-apps/) an excellent how-to about kickstart of the "mac1.metal", so I will focus on things he did not mention.

Once you allocated the Dedicated Host and launched an Instance on it, the underlying system connects the EBS with a root file system to the Mac Mini.

It is an AMI with 32G EBS (as per Jan'21) with macOS pre-installed.

That means two things:

- The built-it physical SSD is still there and still yours to use; however, AWS does not manage or support the Apple hardware's internal SSD. So you may treat it as the Instance Store but with less guarantee of data safety.

- You must resize the disk manually (if you specified the EBS size to be more than 32G) [^1].

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

When you click on the "Terminate" item in the Instance actions menu, the complex Instance scrubbing process begins.

AWS wants to ensure that anyone who uses the Host (Mac mini) after you will get your data stored neither on disks (including the physical SSD mentioned earlier) nor inside memory or NVRAM, nor anywhere else.

They do not share the details of this scrubbing process, but it takes more than an hour to complete.

When scrubbing is started, the Dedicated Host transitions to the Pending state.

Dedicated Host transitions to Available state once scrubbing is finished. But you must wait for another 10-15 minutes to be able to release it finally.

I don't know why they set the Available state value earlier than the Host is available for operations, but this is how it works now (Jan'21).

Therefore, you can launch the next Instance on the same Host not earlier than ~1,5 hours after you terminated the previous. That doesn't seem very pleasant in the first couple of weeks, but you will get used to it. 😄

And again: you can release the "mac1.metal" Dedicated Host not earlier than 24 hours after it was allocated. So plan your tests wisely.

## Legal things

I could not find it on a documentation page, but A Cloud Guru folks [say](https://acloudguru.com/blog/engineering/what-you-need-to-know-about-awss-new-ec2-mac-instances) that you must use new Instances solely for developer services, and you must agree to all of the EULAs.

Sounds reasonable to me, but that could be written somewhere in the docs still, at least. Please let me know if you found it there.

## Some more cool stuff to check:

[EC2 macOS Init](https://github.com/aws/ec2-macos-init) launch daemon, which is used to initialize Mac instances.
[EC2 macOS Homebrew Tap](https://github.com/aws/homebrew-aws) (Third-Party Repository) with several management tools which come pre-installed into macOS AMI from AWS.


Indeed it is powerful, and it has its trade-offs, such as price and some technical constraints. But it is a real MacOS device natively integrated into the AWS environment. So I guess it worth to be tried!

Thanks for reading this! Stay tuned for more user experience feedback about baking custom AMI's, automated software provisioning with Ansible, and other adventures with mac1.metal!


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