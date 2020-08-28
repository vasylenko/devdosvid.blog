---
layout: post
title: 🤔 Terraform explained for managers
summary: For those who want to understand the engineering team better and speak on the same technical language - terraform explained.
date: 2020-05-02
tags: [terraform, devops, education, experience]
---
![](/assets/posts/2020-05-02-Terraform-explained-for-managers.png)

As a team leader, I have to speak with my teammates on the same language — technical language...

For example, I have a good technical background, yet sometimes I have a feeling that my teammates see that I don’t understand them when we discuss some project or a task in-depth. Moreover, I know they are right. Of course, there are plenty of managers who do not have a technical background and they perform great. And some might say that technical skills are not the priority for a manager.

But I think that +1 to skills is always better than +0. Of course, it is a question of time and personal interests, one way or another.

This is why I decided to share my experience and explain Terraform in one blog post. 

The language of this article will be ‘techie’ but not too much. This is because I want to highlight the main parts the Terraform consists of. Although, this is not technical documentation (I hope). Code examples will be based on AWS cloud configuration, although in-depth knowledge of AWS is not required to understand them.

### A few words about “Infrastructure as Code”
IaC is when you describe and manage your infrastructure as… (guess what?) …code. Literally.

In a nutshell that means you can define all the elements (servers, networks, storage, etc.) and resources (memory, cpu, etc) of your infrastructure via configuration files in the version control system (Git, SVN, etc.), and manage it in a way similar to how you manage the source code of the applications: branches, releases, and all that stuff.

And the main idea behind the IaC approach is that it manages the state of things and must be the single source of truth (configuration truth) for your infrastructure. You define the state via the code (at first) and then IaC tool (Terraform, for example) applies this state on the infrastructure: all that is missing according to the code will be created, all that differs from the code will be changed and all that exists in the infrastructure but is not described via code — will be destroyed.

### Why and when do you need the Terraform for a project?
Terraform is a specific tool, hence like any other tool it has its particular application area. There is no strict definition of project kind that needs Terraform (surprise!) but in general, you need to consider using Terraform if you answer ‘yes’ to one of the following questions:

 - Do you have multiple logical elements of the same kind (in plural) in your infrastructure, i.e. several web servers, several application servers, several database servers?
 - Do you have numerous environments (or workspaces) where you run your applications, i.e. development, staging, QA, production?
 - Do you spend some significant amount of time managing the changes in the environment(s) where you run your applications?

### How does it work?
Terraform works with the source code of configuration, and interprets the code into real resources inside on-premise or cloud platforms.

Terraform supports a lot of platforms: from major cloud providers such as AWS, Azure, GCP, DigitalOcean, to more modest platforms such as OVH, 1&1, Hetzner, and others. It also supports infrastructure software such as Docker, Kubernetes, Chef, and even databases and monitoring software. This is why Terraform is so popular — it is a real Swiss knife in the operations world.

So to create, change, or destroy the infrastructure Terraform needs the source code. The **source code** is a set of configuration files that defines your infrastructure state. The code uses its own syntax but it looks very user friendly. Here is an example: the following configuration block describes the virtual server (EC2 instance) in AWS

```yaml
resource "aws_instance" “web_server” {
  ami           = "ami-a1b2c3d4"
  instance_type = "t3.micro"
  }
```

Terraform can automatically detect the dependencies between resources described in the code, and also allows you to add custom dependencies when needed.

When you apply the code first time, Terraform creates a so-called “**state file**” that works as a mapping of your code to real resources created in the hosting platform. With each next “apply” action Terraform will use it to compare the code changes with the sate file to decide what should be done (and in what order) against real infrastructure. 

One of the important functions of the state file is a description of dependencies between the resources. For example (some technical nuances are omitted for purpose of simplicity): if you have a server created inside some network and that network is going to be changed, then Terraform will know that server setting should be changed as well or server should be re-created inside the updated network.

### What is inside?

Terraform configuration code consists of several elements: providers, resources, modules, input variables, output values, local values, expressions, functions.

**Provider** is an entity that defines what exactly is possible to do with cloud or on-premises infrastructure platform you manage via Terraform.

**Resource** is the most important part of the configuration code. This is where the definition of infrastructure objects happens. Resources are the main building blocks of the whole code.

Every resource has a type and local name. For example here is how EC2 instance configuration may look like:
```yaml
resource “aws_instance” “web_server” {
  ami           = “ami-a1b2c3d4”
  instance_type = “t3.micro”
  }
```
The `aws_instance` is a resource type and `web_server` is the resource local name. Later, when Terraform applies this code, it will create an EC2 instance with some particular ID in AWS. Once created, the ID will be stored in the state file with mapping information that logically connects it with `web_server`.

The `ami`, `instance_type` and `private_ip` are the arguments with values which define the actual state of the resource. There are plenty of value types, depending on the particular argument and particular resource type, so I will not focus on them here.

**Modules** are the kind of logical containers or groups for resources you define and use together. The purpose of modules is not only the grouping of resources but it is also the possibility to reuse the same code with different variables.

Let’s get back to the example with EC2 instance and say you need to have a static public IP address with it. In such a case, here is how the module for web server may look like:

```yaml
resource “aws_instance” “web_server” {
  ami           = “ami-a1b2c3d4”
  instance_type = “t3.micro”
  }
resource “aws_eip” “web_server_public_ip” {
  instance      = “${aws_instance.web_server.id}”
  }
```

Having these two resources together allows us to think of it as a stand-alone unit you can reuse later, for example in our development, staging, and production environments. And not by copying and pasting it, but via reference to the module defined only once.

Please note: we specified an instance argument inside the `aws_eip` resource as a reference to another resource details (the ID of an instance). This is possible because of a way how Terraform treats dependencies: when it detects the dependency (or you define it explicitly) it will create the main resource first, and only after it’s created and available it will create the dependent one.

**Input variables** work as parameters for the modules so module code could be reusable. Let’s look at the previous example: it has some hardcoded values — instance image ID and instance type. Here is how you can make it more abstract and reusable:

```yaml
variable “image_id” {
  type          = string
  }
variable “instance_type” {
  type          = string
  }
resource “aws_instance” “web_server” {
  ami           = var.image_id
  instance_type = var.instance_type
  }
```

Values for the variables then can be passed either via CLI and environment variables (if you have only the one, so-called root module) or via explicit values in the block where you call a module, for example:

```yaml
module “web_server_production” {
  source.       = “./modules/web_server”
  image_id      = “ami-a1b2c3d4”
  instance_type = “m5.large”
  }
module “web_server_development” {
  source        = “./modules/web_server”
  image_id      = “ami-a2b3c4d5”
  instance_type = “t3.micro”
 }
```

**Output values** are similar to the “return” of a function in development language. They can be used for dependencies management (for example, when a module require something from another module) and for the printing of the certain values at the end of Terraform work (for example to be used for notification in CI/CD process).

**Local values**, **expressions**, **functions** — three more things that augment the capabilities of Terraform and make it more similar to a programming language (which is great by the way).

The local values are used inside modules for extended data manipulations in it.

The expressions are used to set the values (for many things), for example, to set the value of some argument in resource configuration. They used either to refer something (just as we referenced instance ID `“${aws_instance.web_server.id}”` in the example above) or to compute the value within your configuration.

The functions in Terraform are built-int jobs you can call to transform and combine values. For example, the `tolist()` function converts its argument to a list value.

### And this is it?

Yes, in a very very short words — this is what Terraform is. Not a rocket science if it's about to manage a small infastructure, but gets more complicated with bigger infrastctucture. As any other engineerign tool or development language, actually. 

### Okay, what next?

If you read down to this point (anybody?) then it means it worth “get your hands dirty” and to try building your Infrastructure with Terraform. There are plenty of courses and books (and the “Terraform up and running” is one of the most popular), but my learning path started from the following: [Official guide from Hashicorp](https://learn.hashicorp.com/terraform) — great and free guide from Terraform developers. Just pick your favorite cloud (AWS, Azure, GCP) and go through the topics.

Once you finish this guide, I suggest jumping into the more real-world things and describe the infrastructure of the most common project you work with. For example, here is what I do: [small github project](https://github.com/vasylenko/tf-ecs) – I am trying to describe the Infrastructure for SPA website with services in docker containers at the backend. The variety and complexity of the code are limited only by your fantasy.

Another thing worth your attention is [A Comprehensive Guide to Terraform](https://blog.gruntwork.io/a-comprehensive-guide-to-terraform-b3d32832baca).

And I also encourage you to go through the [collection of blog posts and talks](https://gruntwork.io/static/devops-resources/) they share.