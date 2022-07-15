---
date: "2020-09-15T00:00:00Z"
description: Summary of a learning path to HashiCorp Certified — Terraform Associate
summary: Summary of a learning path to HashiCorp Certified — Terraform Associate
cover:
    image: cover-image.png
    relative: true
description: Summary of a learning path to HashiCorp Certified — Terraform Associate
tags: ["terraform", "certification", "terraform associate exam", "hashicorp certification"]
categories: [Terraform]
title: Terraform Certification Tips
aliases: ["/2020/09/15/terraform-certification-tips.html"]
---
I successfully passed the "HashiCorp Certified — Terraform Associate" exam last Friday and decided to share some advice for exam preparation.

## Make yourself a plan
Make a list of things you are going to go through: links to the study materials, practice tasks, some labs, some articles on relative blogs (Medium, Dev.to, etc.).
It should look at a "todo" or "check"-list. It may seem silly at first glance, but the list with checkboxes does its "cognitive magic". When you go point by point, marking items as "done", you feel the progress and this motivates you to keep going further.
For example, you can make a plan from the resources I outlined below in this article. 

I encourage you to explore the Internet for something by yourself as well. Who knows, perhaps you will find some learning course that fits you better. And that is great! However, when you find it, take extra 5-10 minutes to go through its curriculum and create a list with lessons. 

It feels so nice to cross out items off the todo list, believe me 😄
{{<figure src="todo-list.jpg">}}

## Go through the official Study Guide
Despite your findings on the Internet, I strongly suggest going through the official study guide

[Study Guide - Terraform Associate Certification](https://learn.hashicorp.com/tutorials/terraform/associate-study)

It took me about 20 hours to complete it (including practice tasks based on topics in the guide), and it was the core of my studying. I did not buy or search for some third-party course intentionally because I did have some Terraform experience before starting the preparation. But give the official guide a chance even if you found some course. It is well-made and matches real exam questions very precisely.

Also, there is an official [Exam Review](https://learn.hashicorp.com/tutorials/terraform/associate-review). Someone might find this even better because it is a direct mapping of each exam objective to HashiCorp's documentation and training.

## Take additional tutorials
Here is a list of additional tutorials and materials I suggest adding into your learning program:

#### Official guides / documentation:
  - [Automate Terraform](https://learn.hashicorp.com/collections/terraform/automation)
  - [Collaborate using Terraform Cloud](https://learn.hashicorp.com/collections/terraform/cloud)
  - [Terraform tutorials](https://learn.hashicorp.com/collections/terraform/0-13)
  - [Reuse Configuration with Modules](https://learn.hashicorp.com/collections/terraform/modules)
  - [A Practitioner’s Guide to Using HashiCorp Terraform Cloud with GitHub](https://www.hashicorp.com/resources/a-practitioner-s-guide-to-using-hashicorp-terraform-cloud-with-github)
  - [Enforce Policy with Sentinel](https://learn.hashicorp.com/collections/terraform/policy)

#### Third-party articles and guides:
* [Using the terraform console to debug interpolation syntax](https://prefetch.net/blog/2020/04/27/using-the-terraform-console-to-debug-interpolation-syntax/)
* [YouTube playlist with exam-like questions review](https://www.youtube.com/playlist?list=PL5VXZTK6spA2HF5Kf0rI9RDRHF9Hopffr)

## Find yourself some practice
#### Mockup a project
You can greatly improve your practice by mocking some real business cases.

If you already work in some company you can set up the project you're working with using Terraform. If you don’t have a real project or afraid to accidentally violate NDA, try this open-source demo project: [Real World Example Apps](https://github.com/gothinkster/realworld).

It is a collection of different codebases for front-end and back-end used to build the same project. Just find the combination that suits your experience better and try to build the infrastructure for it using Terraform.

{{<figure src="real-world-demo.jpg">}}

#### Answer forum topics
Last but not least advice — try to answer some questions on the official [Terraform forum](https://discuss.hashicorp.com/c/terraform-core/).

This is a nice way to test your knowledge, help others, and develop the community around Terraform. Just register there, look for the latest topics, and have fun!

{{<figure src="tf-forum.jpg">}}

🍀 I sincerely wish you exciting preparation and a successful exam! 🍀