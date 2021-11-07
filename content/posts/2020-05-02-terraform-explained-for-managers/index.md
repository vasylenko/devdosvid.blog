---
date: "2020-05-02T00:00:00Z"
description: For those who want to understand the engineering team better and speak on the same technical language — terraform explained.
tags: ["terraform", "tutorials"]
categories: [Tutorials]
title: Terraform explained for managers
url: /2020/05/02/Terraform-explained-for-managers.html
cover:
    image: cover-image.png
images: ["2020-05-02-terraform-explained-for-managers.png"]
---

For example, I have a good technical background, yet sometimes I felt that my teammates saw that I didn’t understand them when discussing a project or a task in-depth. Moreover, I knew they were right. But, of course, plenty of managers do not have a technical background, and they perform great.

Some might say that technical skills are not the priority for a manager. But I think that +1 to skills is always better than nothing. It is a question of time and personal interests, one way or another.

That is why I decided to share my experience and explain Terraform in one blog post.

The language of this article will be ‘techie’ but not too much: I want to highlight the main parts the Terraform consists of. Although this is not technical documentation (I hope), code examples will be based on AWS cloud configuration, but in-depth knowledge of AWS is not required to understand them.

## A few words about “Infrastructure as Code"
IaC is when you describe and manage your infrastructure as… (guess what?) …code, literally.

In a nutshell, that means you can define all the elements (servers, networks, storage, etc.) and resources (memory, CPU, etc.) of your infrastructure in configuration files, and manage it in a way similar to how you handle the source code of the applications: branches, releases, and all that stuff.

And the main idea behind the IaC approach is that it manages the state of things and must remain the single source of truth (configuration truth) for your infrastructure.

First, you define the state via the code. Then IaC tool (Terraform, for example) applies this state to the infrastructure: all that is missing according to the code will be created, all that differs from the code will be changed, and all that exists in the infrastructure but is not described via code — will be destroyed.

## Why and when do you need the Terraform for a project?
Terraform is a specific tool, hence like any other tool, it has its particular application area. There is no strict definition of project kind that needs Terraform (surprise!), but in general, you need to consider using Terraform if you answer ‘yes’ to one of the following questions:

- Do you have multiple logical elements of the same kind (in plural) in your infrastructure, i.e., several web servers, several application servers, several database servers?
- Do you have numerous environments (or workspaces) where you run your applications, i.e., development, staging, QA, production?
- Do you spend a significant amount of time managing the changes in the environment(s) where you run your applications?

## How does it work?
Terraform works with the source code of configuration and interprets the code into real objects inside on-premise or cloud platforms.

{{< figure src="how-it-works-optimized.png" width=800 alt="How Terraform works" caption="How Terraform works in a nutshell" >}}

Terraform supports many platforms: cloud providers such as AWS, Azure, GCP, DigitalOcean, and other platforms such as OVH, 1&1, Hetzner, etc. It also supports infrastructure software such as Docker, Kubernetes, Chef, and even databases and monitoring software. That is why Terraform is so popular — it is an actual Swiss knife in the operations world.

So to create, change, or destroy the infrastructure, Terraform needs the source code. 

The **source code** is a set of configuration files that defines your infrastructure state. The code uses its syntax, but it looks very user-friendly. Here is an example: the following configuration block describes the virtual server (EC2 instance) in AWS.

```hcl
resource "aws_instance" "web_server" {
  ami           = "ami-a1b2c3d4"
  instance_type = "t3.micro"
  }
```

Terraform can automatically detect the dependencies between resources described in the code and also allows you to add custom dependencies when needed.

When you apply the code the first time, Terraform creates a so-called “**state file**," which Terraform uses to map your code to resources created in the hosting platform. Terraform will use each subsequent “apply" action to compare the code changes with the sate file to decide what should be done (and in what order) against real infrastructure.

One of the essential functions of the state file is the management of dependencies between the resources. For example (some technical nuances are omitted for simplicity): if you have a server created inside some network and you are going to change the network configuration in Terraform code, Terraform will know it should change that server configuration, or the server should be re-created inside the updated network.

## What does Terraform consist of:

Terraform configuration code consists of several elements: providers, resources, modules, input variables, output values, local values, expressions, functions.

### Provider
**Provider** is an entity that defines what exactly is possible to do with the cloud or on-premises infrastructure platform you manage via Terraform.

It translates your code into proper API calls to the hosting provider, transforming your configuration into real object: servers, networks, databases, and so on.

### Resource
**Resource** is the essential part of the configuration code. That is where the definition of infrastructure objects happens.

Resources are the main building blocks of the whole code. A resource can represent some object in the hosting provider (example: server) or the part of a compound object (example: attachable storage for a server)

Every resource has a type and local name. For example, here is how EC2 instance configuration may look like:
```hcl
resource "aws_instance" "web_server" {
  ami           = "ami-a1b2c3d4"
  instance_type = "t3.micro"
  }
```
The `aws_instance` is a resource type, and `web_server` is the local resource name. Later, when Terraform applies this code, it will create an EC2 instance with some particular ID in AWS.

Once created, Terraform will store the ID in the state file with mapping information that logically connects it with `web_server`.

The `ami`, `instance_type`, and `private_ip` are the arguments with values that define the actual state of the resource. However, there are many value types, depending on the particular argument and particular resource type, so I will not focus on them here.

### Modules

{{< figure src="module-example.png" width=800 alt="Terraform module" caption="Terraform module" >}}

**Modules** is the kind of logical containers or groups for resources you define and use together. The purpose of modules is the grouping of resources and the possibility of reusing the same code with different variables.

Let’s get back to the example with the EC2 instance and say you need to have a static public IP address with it. In such a case, here is how the module for web server may look like:


```hcl
resource "aws_instance" "web_server" {
  ami           = "ami-a1b2c3d4"
  instance_type = "t3.micro"
  }
resource "aws_eip" "web_server_public_ip" {
  instance      = "${aws_instance.web_server.id}"
  }
```

Having these two resources together allows us to think of it as a stand-alone unit you can reuse later, for example, in our development, staging, and production environments. And not by copying and pasting it, but via reference to the module defined only once.

Please note: we specified an instance argument inside the `aws_eip` resource to reference another resource details (the ID of an instance). It is possible because of the way how Terraform treats dependencies. For example, when it detects the dependency (or you define it explicitly), Terraform creates the leading resource first. Only after the resource is created and available Terraform will create the dependent one.

The modules is a kind of standalone topic in Terraform. There is [a separate article in my blog](https://serhii.vasylenko.info/2020/09/09/terraform-modules-explained.html) that explains what modules are and how do they work.

### Variables
**Input variables** work as parameters for the modules so module code could be reusable. Let’s look at the previous example: it has some hardcoded values — instance image ID and instance type. Here is how you can make it more abstract and reusable:

```hcl
variable "image_id" {
  type          = string
  }
variable "instance_type" {
  type          = string
  }
resource "aws_instance" "web_server" {
  ami           = var.image_id
  instance_type = var.instance_type
  }
```

Values for the variables then can be passed either via CLI and environment variables (if you have only the one, so-called root module) or via explicit values in the block where you call a module, for example:

```hcl
module "web_server_production" {
  source        = "./modules/web_server"
  image_id      = "ami-a1b2c3d4"
  instance_type = "m5.large"
  }
module "web_server_development" {
  source        = "./modules/web_server"
  image_id      = "ami-a2b3c4d5"
  instance_type = "t3.micro"
 }
```
**Output values** are similar to the "return" of a function in development language. You can use them for dependencies management (for example, when a module requires something from another module) and print specific values at the end of Terraform work (for example, to be used for notification in the CI/CD process).

**Local values**, **expressions**, **functions** — three more things that augment the capabilities of Terraform and make it more similar to a programming language (which is excellent, by the way).

The local values are used inside modules for extended data manipulations.

The expressions are used to set the values (for many things), such as the value of some argument in resource configuration. For example, they used either to refer something (just as we referenced instance ID ` "${aws_instance.web_server.id}" ` in the example above) or to compute the value within your configuration.

The functions in Terraform are built-in jobs you can call to transform and combine values. For example, the `tolist()` function converts its argument to a list value.

## And this is it?

Yes, in short words — this is what Terraform is. Not rocket science if it's about to manage a small infrastructure, but it gets more complicated with bigger infrastructure. Like any other engineering tool, though.

## Okay, what next?

If you read down to this point, then it means it is worth "get your hands dirty" and to try building your Infrastructure with Terraform. There are plenty of courses and books (and the "Terraform up and running" is one of the most popular). Still, my learning path started from the following: [Official guide from Hashicorp](https://learn.hashicorp.com/terraform) — comprehensive and free guide from Terraform developers. Just pick your favorite cloud (AWS, Azure, GCP) and go through the topics.

Another thing worth your attention is [A Comprehensive Guide to Terraform](https://blog.gruntwork.io/a-comprehensive-guide-to-terraform-b3d32832baca).

Once you finish this guide, I suggest jumping into the more real-world things and describing the infrastructure of the most common project you work with.

Your hands-on experience is the best way to learn Terraform!
