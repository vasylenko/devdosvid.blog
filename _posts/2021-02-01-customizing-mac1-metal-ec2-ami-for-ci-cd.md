---
layout: post
title: Customizing mac1.metal EC2 AMI for CI/CD — new guts, more glory
subtitle: My journey with the AWS macOS "mac1.metal" Instances continues, and it's time to describe software provisioning and system configuration
description: How to build mac1.metal Instance AMI for CI/CD using Ansible and Packer
date: 2021-02-01
tags: [aws, ansible, packer, automation, devops]
category: [Howto]
---

I guess macOS was designed for a user, not for the ops or engineers, so perhaps this is why its customization and usage in CI are not trivial (compared to something Linux-based). A smart guess, huh?
# Configuration management solutions
Native Apple's Mobile device management (a.k.a MDM) and Jamf is probably the most potent combination for macOS customization. But as much as it's right, it is a cumbersome combination, and Jamf is not free.

Then we have Ansible, Chef, Puppet, SaltStack — they all are good with Linux, but what about macOS?

I tried to search for use cases of mentioned CM tools with OS X and concluded that most of the time, they all wrap the execution of native command-line utilities of macOS.

And if you search for the 'macos' word in Chef supermarket or Puppet Forge, you won't be impressed by the number of actively maintained packages. Although, here is a motivating article about using Chef "automating-macos-provisioning-with-chef." if you prefer it. I could not find something similar (and fresh) for Puppet, so I am sorry Puppet fans.

That is why I decided to follow the KISS principle and chose Ansible. It's easy to write and read the configuration, it allows to group tasks and to add execution logic ~~, and it feels more DevOps executing shell commands inside Ansible tasks instead of shell script; I know you know that 😂~~

Here I should clarify that Ansible Galaxy does not have many management packages for macOS, either. But thankfully, it has the basics:
- [homebrew](https://docs.ansible.com/ansible/latest/collections/community/general/homebrew_module.html#ansible-collections-community-general-homebrew-module) with [homebrew_cask](https://docs.ansible.com/ansible/latest/collections/community/general/homebrew_cask_module.html#ansible-collections-community-general-homebrew-cask-module) and [homebrew_tap](https://docs.ansible.com/ansible/latest/collections/community/general/homebrew_tap_module.html#ansible-collections-community-general-homebrew-tap-module) — to install software
- [launchd](https://docs.ansible.com/ansible/latest/collections/community/general/launchd_module.html#ansible-collections-community-general-launchd-module) — to manage services
- [osx_defaults](https://docs.ansible.com/ansible/latest/collections/community/general/osx_defaults_module.html#ansible-collections-community-general-osx-defaults-module) — to manage some user settings (not all!)

I used Ansible to build the macOS AMI for CI/CD, so here are some tips for such a case.

_I intentionally hardcoded some values in code examples for the sake of simplicity and easy reading. You would probably want to parametrize them._

### Xcode installation
The following tasks will help you to automate the basics.

```yaml
- name: Install Xcode
      shell: "xip --expand Xcode.xip"
      args:
        chdir: /Applications

- name: Accept License Agreement
  shell: "/Applications/Xcode.app/Contents/Developer/usr/bin/xcodebuild -license accept"

- name: Accept License Agreement
  shell: "/Applications/Xcode.app/Contents/Developer/usr/bin/xcodebuild -runFirstLaunch"

- name: Switch into newly installed Xcode
  shell: "xcode-select --switch /Applications/Xcode.app/Contents/Developer"
```

### Software installation with Brew
```yaml
- name: Install common build software
  community.general.homebrew:
    name: "{{ item }}"
    state: latest
  loop:
    - swiftlint
    - swiftformat
    - wget

```

### ScreenSharing (remote desktop) configuration
```yaml
- name: Turn On Remote Management
  shell: "./kickstart -activate -configure -allowAccessFor -specifiedUsers"
  args:
    chdir: /System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Resources/

- name: Enable Remote Management for CI user
  shell: "./kickstart -configure -users ec2-user -access -on -privs -all"
  args:
    chdir: /System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Resources/
```
I will not bother you with the code blocks a lot; I am sure you already got the idea. Shell rules, yes.
# Building AMI
[Packer by HashiCorp](https://www.packer.io/docs/builders/amazon/ebs), of course. I would love to compare Packer with EC2 Image Builder, but it [does not support macOS](https://docs.aws.amazon.com/imagebuilder/latest/userguide/what-is-image-builder.html#image-builder-os) yet (as of Feb'21).

Packer configuration is straightforward (I believe they made it with the Unix philosophy in hearts), so I want to highlight the things specific to the "mac1.metal" use case.

### Timeouts
As I mentioned in [my earlier review](https://dev.to/svasylenko/mac1-metal-ec2-instance-user-experience-j08), the launching and destroying time of the "mac1.metal" Instance is significantly bigger than Linux. That is why I suggest raising the polling parameters for the builder, for example:

```json
"aws_polling" : {
        "delay_seconds": 30,
        "max_attempts": 60
      }
```

And it would be best if you also increased the SSH timeout:

```json
"ssh_timeout": "1h"
```

Fortunately, Packer's AMI builder does not require an explicit definition for the ID of Dedicated Host, so you can just specify the same subnet where you allocated the Host, assuming you did it with the enabled "Auto placement" parameter.

```json
"tenancy": "host",
"subnet_id": "your-subnet-id"
```

### Provisioning
Packer has [Ansible Provisioner](https://www.packer.io/docs/provisioners/ansible) that I used for the AMI.  Its documentation is also very clean and simple. But it is still worth mentioning that if you want to parametrize the Ansible playbook, then the following configuration directives will be handy:

``` json
      "extra_arguments": [
        "--extra-vars",
        "your-variable-foo=your-value-bar]"
      ],
      "ansible_env_vars": [
        "ANSIBLE_PYTHON_INTERPRETER=auto_legacy_silent",
        "ANSIBLE_OTHER_ENV_VARIABLE=other_value"
      ]
```

Configuration at launch
If you're familiar with AWS, you probably know what the Instance `user data` is. A group of AWS developers made something similar for the macOS: [EC2 macOS Init](https://github.com/aws/ec2-macos-init).

It is an excellent tool, and these folks did a great job (_or should I use the "amazing" word if we're talking about macOS?_)! 