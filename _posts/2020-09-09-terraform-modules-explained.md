---
layout: post
title: What are terraform Modules and how do they work?
subtitle: Explanation of Terraform modules and their main concepts. In English.
summary: Explanation of Terraform modules and their main concepts. In English.
date: 2020-09-09
image: /assets/posts/2020-09-09-terraform-modules-explained/cover.jpg
canonical_url: 'https://www.freecodecamp.org/news/terraform-modules-explained/'
tags: [terraform, explained]
---
Surprisingly, a lot of beginners skip over Terraform modules for the sake of simplicity, or so they think. Later, they find themselves going through hundreds of lines of configuration code.

I assume you already know some basics about Terraform or even tried to use it in some way before reading the article.

Please note: I do not use real code examples with some specific provider like AWS or Google intentionally, just for the sake of simplicity.

## Terraform modules
You already write modules even if you think you don’t.

Even when you don't create a module intentionally, if you use Terraform, you are already writing a module – a so-called "root" module.

Any number of Terraform configuration files `(.tf)` in a directory (even one) forms a module.

### What does the module do?
A Terraform module allows you to create logical abstraction on the top of some resource set. In other words, a module allows you to group resources together and reuse this group later, possibly many times.

Let's assume we have a virtual server with some features hosted in the cloud. What set of resources might describe that server? For example:
– the virtual machine itself (created from some image)
– an attached block device of specified size (for additional storage)
– a static public IP mapped to the server's virtual network interface
– a set of firewall rules to be attached to the server
– something else... (i.e. another block device, additional network interface, etc)

![](/assets/posts/2020-09-09-terraform-modules-explained/1.png)

Now let's assume that you need to create this server with a set of resources many times. This is where modules are really helpful – you don't want to repeat the same configuration code over and over again, do you?

Here is an example that illustrates how our "server" module might be called.
"To call a module" means to use it in the configuration file.

Here we create 5 instances of the "server" using single set of configurations (in the module):

```
module "server" {
    
    count         = 5
    
    source        = "./module_server"
    some_variable = some_value
}
```

### Modules organisation: child and root
Of course, you would probably want to create more than one module. Here are some common examples:
- for a network (i.e. VPC)
- for a static content hosting (i.e. buckets)
- for a load balancer and it's related resources
- for a logging configuration
- and whatever else you consider a distinct logical component of the infrastructure

Let's say we have two different modules: a "server" module and a "network" module. The module called "network" is where we define and configure our virtual network and place servers in it:

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

Once we have some custom modules, we can refer to them as "child" modules. And the configuration file where we call child modules relates to the root module.

![](/assets/posts/2020-09-09-terraform-modules-explained/2.png)

A child module can be sourced from a number of places:

- local paths
- official Terraform Registry (if you're familiar with other registries, i.e. Docker Registry then you already understand the idea)
- Git repository (a custom one or GitHub/BitBucket)
- HTTP URL to .zip archive with module

But how can you pass resources details between modules?

In our example, the servers should be created in a network. So how can we tell the "server" module to create VMs in a network which was created in a module called "network"?

This is where **encapsulation** comes in.

## Module encapsulation
Encapsulation in Terraform consists of two basic concepts: module scope and explicit resources exposure.

### Module Scope
All resource instances, names, and therefore, resource visibility, are isolated in a module's scope. For example, module "A" can't see and does not know about resources in module "B" by default.

Resource visibility, sometimes called resource isolation, ensures that resources will have unique names within a module's namespace. For example, with our 5 instances of the "server" module:
```
module.server[0].resource_type.resource_name
module.server[1].resource_type.resource_name
module.server[2].resource_type.resource_name
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

In this case, the naming or address of resources would be as follows:

```
module.server-alpha.resource_type.resource_name

module.server-beta.resource_type.resource_name
```

### Explicit resources exposure

If you want to access some details for the resources in another module, you'll need to explicitly configure that.

By default, our module "server" doesn't know about the network that was created in the "network" module.

![](/assets/posts/2020-09-09-terraform-modules-explained/3.png)

So we must declare an `output` value in the "network" module to export its resource, or an attribute of a resource, to other modules.

The module "server" must declare a `variable` to be used later as the input.

![](/assets/posts/2020-09-09-terraform-modules-explained/4.png)

This explicit declaration of the output is the way to expose some resource (or information about it) outside — to the scope of the 'root' module, hence to make it available for other modules.

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

This example configuration would create 5 instances of the same server, with all the necessary resources, in the network we created with as a separate module.

### Wrap up
Now you should understand what modules are and what do they do.

If you're at the beginning of your Terraform journey, here are some suggestions for the next steps.

I encourage you to take this short tutorial from HashiCorp, the creators of Terraform, about modules:  ["Organize Configuration"](https://learn.hashicorp.com/collections/terraform/modules)

Also, there is a great comprehensive study guide which covers everything from beginner to advanced concepts about Terraform: ["Study Guide - Terraform Associate Certification"](https://learn.hashicorp.com/tutorials/terraform/associate-study?in=terraform/certification)

The modular code structure makes your configuration more flexible and yet easy to be understood by others. The latter is especially useful in teamwork.

----------------------------
###### This article was originaly published on FreeCodeCamp paltform by me, but I still want to keep it here for the record. Canonical link to original publication was properly set in the page headers. 