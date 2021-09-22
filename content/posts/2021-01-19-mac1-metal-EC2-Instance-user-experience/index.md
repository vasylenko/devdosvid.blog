---
date: "2021-01-19T00:00:00Z"
title: mac1.metal EC2 Instance — user experience
description: An overview of one-month user experience with the new mac1.metal EC2 Instances from AWS
images: ["2021-01-19-mac1-metal-EC2-Instance-user-experience.jpg"]
cover:
  image: 2021-01-19-mac1-metal-EC2-Instance-user-experience.jpg
tags: ["aws", "macos", "ec2"]
url: /2021/01/19/mac1-metal-EC2-Instance-user-experience.html
---

## Amazon EC2 Mac Instances

Something cool and powerful with inevitable trade-offs. As everything in this world.

AWS announced EC2 macOS-based instances on the 30th of November 2020, and after more than a month of tests, I would like to share some findings and impressions about it.

First of all, the things you can easily find, but it's still worth to say:
- The new instance family is called `mac1.metal`. Guess we should expect mac2 or mac3; otherwise, why did they put a number in the name?
- They added [AWS Nitro System](https://aws.amazon.com/ec2/nitro/) to integrate them with many AWS services.
- The Instance must be placed onto a [Dedicated Host](https://aws.amazon.com/ec2/dedicated-hosts/). Only one Instance per Host is allowed because the Host is an actual Mac Mini in that case.
- You don't pay anything for the Instance itself, but you pay for the Dedicated Host leasing — $1.083, and the minimum lease time is 24 hours. So the launch of the "mac1.metal" Instance costs $26 at minimum. Prices provided for the cheapest region — North Virginia.
- You can apply [Saving Plans](https://docs.aws.amazon.com/savingsplans/latest/userguide/what-is-savings-plans.html) to save some money.
- Mojave (10.14) and Catalina (10.15) are supported at the moment, with ["support for macOS Big Sur (11.0) coming soon"](https://aws.amazon.com/ec2/instance-types/mac/). I expect it to be in 2021, though.

## What can it do

Here is a list of some features that the "mac1.metal" instance has:
- It lives in your VPC because it is an EC2 Instance so that you can access many other services.
- It supports the new gp3 EBS type (and other types as well).
- It supports SSM Agent and Session Manager.
- It has several AWS tools pre-installed.
- It has pre-installed Enhanced Network Interface drivers. My test upload/download to S3 was about 300GB/s.
- It can report CPU metrics to CloudWatch (if you ever need it, though).

## What can't it do

- It can't be used in Auto Scaling because of a Dedicated Host.
- It can't recognize the attached EBS if you connected it while the Instance was running — you must reboot the Instance to make it visible.
- It does not support several services that rely on additional custom software, such as "EC2 Instance Connect" and "AWS Inspect." But I think that AWS will add macOS distros for those soon.

## Launching the Instance

Jeff Bar [published](https://aws.amazon.com/blogs/aws/new-use-mac-instances-to-build-test-macos-ios-ipados-tvos-and-watchos-apps/) an excellent how-to about kickstart of the "mac1.metal", so I will focus on things he did not mention.

Once you allocated the Dedicated Host and launched an Instance on it, the underlying system connects the EBS with a root file system to the Mac Mini.

It is an AMI with 32G EBS (as per Jan'21) with macOS pre-installed.

That means two things:

- The built-it physical SSD is still there and still yours to use; however, AWS does not manage or support the Apple hardware's internal SSD.
- You must resize the disk manually (if you specified the EBS size to be more than 32G)[1].

The time from the Instance launch till you're able to SSH into it varies between 15 and 20 minutes.

You have the option to access it over SSH with your private key. If you need to set up Screen Sharing, you have to allow it through the "kickstart" command-line utility and setting the user password [2].

## Destroying the Instance

What an easy thing to do, right? Well, it depends.

When you click on the "Terminate" item in the Instance actions menu, the complex Instance scrubbing process begins.

AWS wants to make sure that anyone who uses the Host (Mac mini) after you will get your data stored neither on disks (including physical SSD mentioned earlier), nor inside memory or NVRAM, nor anywhere else. They do not share the info about this scrubbing process's details, but it takes more than an hour to complete.

When scrubbing is started, the Dedicated Host transitions to the Pending state. Dedicated Host transitions to Available state once scrubbing is finished. But you must wait for another 10-15 minutes to be able to release it finally.

I don't know why they set the Available state value earlier than the Host is available for operations, but this is how it works now (Jan'21).

Therefore, you can launch the next Instance on the same Host not earlier than ~1,5 hours after you terminated the previous. That doesn't seem very pleasant in the first couple of weeks, but you will get used to it. 😄

And again: you can release the "mac1.metal" Dedicated Host not earlier than 24 hours after it was allocated. So plan your tests wisely.

## Legal things

I could not find it on a documentation page, but A Cloud Guru folks [say](https://acloudguru.com/blog/engineering/what-you-need-to-know-about-awss-new-ec2-mac-instances) that you must use new Instances solely for developer services, and you must agree to all of the EULAs.

Sounds reasonable to me, but that could be written somewhere in the docs still, at least. Please let me know if you found it there.

## Some more cool stuff to check:

[EC2 macOS Init](https://github.com/aws/ec2-macos-init) launch daemon, which is used to initialize Mac instances.
[EC2 macOS Homebrew Tap](https://github.com/aws/homebrew-aws) (Third-Party Repository) with several management tools which come pre-installed into macOS AMI from AWS.

_______

Indeed it is powerful, and it has its trade-offs, such as price and some technical constraints. But it is a real MacOS device natively integrated into the AWS environment. So I guess it worth to be tried!

Thanks for reading this! Stay tuned for more user experience feedback about baking custom AMI's, automated software provisioning with Ansible, and other adventures with mac1.metal!

_______
**[1] How to resize the EBS at mac1.metal in Terminal**

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


**[2]How to setup Screen Sharing at mac1.metal in Terminal**

The `kickstart` command-line tool resides in `/System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Resources/` so you'll better to cd into that directory for convenience:

```shell
# Turn On Remote Management for a user to be specified later
sudo ./kickstart -activate -configure -allowAccessFor -specifiedUsers

# Enable Remote Management for ec2-user user
sudo ./kickstart -configure -users ec2-user -access -on -privs -all

# Set the user password 
sudo passwd ec2-user
```