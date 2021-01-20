---
layout: post
title: AWS CloudShell
subtitle: Simple utility to make AWS Console experience better
description: "Updates from AWS re:Invent"
date: 2020-12-16
image: /assets/posts/2020-12-16-aws-cloudshell.png
tags: [aws]
category: [Review]
---

A simple but cool announcement from AWS — [AWS CloudShell](https://aws.amazon.com/cloudshell/).
A tool for ad-hoc AWS management via CLI directly in your browser.

I like when AWS releases something simple to understand and yet powerful.\
So it is not another [DevOps Guru](https://aws.amazon.com/devops-guru/), believe me :)

- Yes, this is similar to the shells that GCE and Azure have.
- No, you can’t access your instances from it, so it’s not a jump server (bastion host).
- Yes, it has AWS CLI and other tools pre-installed. Even Python and Node.js.
- No, you can’t (well, you can, but should not) use it as an alternative to the day-to-day console on your laptop.
- Yes, you can manage all resources from that shell as much as your IAM permissions allow you (even with SSO, which is pretty cool).
- No, it does not support Docker.
- Yes, you have 1 GB of permanent storage and the ability to transfer files in and out.

##### More Yes and No’s here:
[https://docs.aws.amazon.com/cloudshell/latest/userguide/faq-list.html](https://docs.aws.amazon.com/cloudshell/latest/userguide/faq-list.html)

[https://aws.amazon.com/cloudshell/faqs/](https://aws.amazon.com/cloudshell/faqs/) 