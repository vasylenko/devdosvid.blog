---
layout: post
title: Terraform Modules explained
subtitle: This article will help Terraform newcomers adopt the "modules" concept easier
summary: Explanation of Terraform modules idea and main concepts
date: 2020-09-5
img: /assets/posts/2020-09-10-terraform-modules-explained/cover.png
tags: [terraform, explained]
---
Surprisingly, a lot of Terraform beginners skip module usage for the sake of simplicity (as they think…) then find themselves browsing through hundreds-lines-of-code configurations.

I assume you already know some basics about Terraform or even tried to use it in some way before reading the article.

Please note: I do not use real code examples with some specific provider (i.e. AWS or Google) intentionally — for the sake of simplicity. 

### You already write modules even if you think you don’t
Even when you don’t write modules intentionally, you write a module — a so-called "root" module.
Any number of Terraform configuration files `(.tf)`  in a directory (even one) forms a module.

### What does the module do?
A terraform module allows you to create logical abstraction on the top of some resources set. In other words: to group resources and reuse this group later, and many times.

Let's assume we have a virtual server with some features in some cloud hosting. What set of resources might describe that server? For example:
– a virtual machine itself (created from some image)
– an attached block device of specified size (for additional storage)
– a static public IP mapped to the server's virtual network interface
– a set of firewall rules to be attached to the server
– something else... (i.e. another block device, additional network interface, etc)

![](/assets/posts/2020-09-10-terraform-modules-explained/1.png)

Now assume that you need to create this server with a set of resources many times. This is why you need a module: you don't want to repeat the same configuration code over and over again, don't you?

Here is an example that illustrates how our "server" module might be called.
"To call a module" means to use it in the configuration file.

Here we create 5 instances of the "server" using single set of configurations (in the module).

```
module "server" {
    
    count         = 5
    
    source        = "./module_server"
    some_variable = some_value
}
```

### Modules organisation: child and root
Of course, you would probably want to create more than one module, for example:
- for a network (i.e. VPC)
- for a static content hosting (i.e. buckets)
- for a load balancer and it's related resources
- for a logging configuration
- and whatever else you consider a distinct logical component of the infrastructure

Let's say we have two different modules: a "server" module and a "network" module. The module called "network" is where we define and configure our virtual network (to place servers in it)

```
module "server" {
    source        = "./module_server"
    some_variable = some_value
}

module "network" {  
    source              = "./module_network"
    some_other_variable = some_other_value
}
```

From now on, once we have some custom modules, we call them "child" modules.
And the configuration file where we call child modules relates to the root module.

![](/assets/posts/2020-09-10-terraform-modules-explained/2.png)

A child module can be sourced from numerous places:

- local paths
- official Terraform Registry (if you're familiar with other registries, i.e. Docker Registry then you already understand the idea)
- Git repository (a custom one or GitHub/BitBucket)
- HTTP URL to .zip archive with module

But how can you pass resources details between modules? In our example, the servers should be created in a network, so how can we tell the module "server" to create VMs in a network which was created in a module "network"?

... this is where **Encapsulation** takes place.

### Module encapsulation effects
Encapsulation in Terraform consists of two basic concepts:

> Concept #1. All resources instances, their names, and therefore resources visibility, are isolated in a module scope: module "A" can't see and does not know about resources in module "B" by default.

Resources visibility (isolation) ensures that resources will have unique names within a module namespace in the following way (for our example with 5 instances of "server" module):
```
module.server[0].resource_type.resource_name
module.server[1].resource_type.resource_name
module.server[2].resource_type.resource_name
...
```

On the other hand, we could create two instances of the same module with different names:
```
module "server-alpha" {    
    source        = "./module_server"
    some_variable = some_value
}
module "server-beta" {
    source        = "./module_server"
    some_variable = some_value
}
```
In this case, the naming (addresses of resources) would be as follows:
```
module.server-alpha.resource_type.resource_name

module.server-beta.resource_type.resource_name
```
> Concept #2. If you need to access some resources details (configured in one module) from another module, you need to explicitly configure that.

By default, our module "server" doesn't know about the network which was created in module "network".

![](/assets/posts/2020-09-10-terraform-modules-explained/3.png)

So we must declare a so-called `output` value in a module "network" to export its certain resource (or an attribute of a resource) to other modules.
The module "server" must declare a `variable` to be used later as the input.

![](/assets/posts/2020-09-10-terraform-modules-explained/4.png)

Next, when we call the child module "server"  in the root module, we should assign the output from the "network" module to the variable of the "server" module:

```
network_id = module.network.network_id
```

Here is how the final code for calling our child modules will look like in result:

```
module "server" {
    count         = 5
    source        = "./module_server"
    some_variable = some_value
    network_id    = module.network.network_id
}

module "network" {  
    source              = "./module_network"
    some_other_variable = some_other_value
}
```

This example configuration would created 5 instances of the same server (with all needed resources) in the network we created with separate module.

### Wrap up
Now you understand what modules are and what do they do.
If you're at the beginning of your Terraform journey, here are some suggestions for the next steps.

I encourage you to take a short tutorial from Terraform about modules — ["Organize Configuration"](https://learn.hashicorp.com/collections/terraform/modules)

Also, there is a great comprehensive Study Guide which leads you from the very beginning to in-depth knowledge about Terraform — ["Study Guide - Terraform Associate Certification"](https://learn.hashicorp.com/tutorials/terraform/associate-study?in=terraform/certification)