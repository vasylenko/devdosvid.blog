---
title: "Lifecycle and Refactoring Capabilities of Terraform 1.1 and 1.2"
date: 2022-05-04T22:27:47+02:00
description: New features that expand resources management options 
cover:
    image: cover-image.png
    relative: true
tags: []
categories: []
draft: true
---

In this blog, I would like to tell you about new cool features that Terraform 1.1 and 1.2 bring. It feels like Terraform has doubled its speed of delivering the new features after they released the 1.0. 🤩

It's been only a few months since Terraform 1.1 was released with the `moved` block that empowers the code refactoring.

Now Terraform 1.2 is almost [ready](*https://github.com/hashicorp/terraform/releases/tag/v1.2.0-rc1*) (I am writing this blog in early May 2022) to bring three efficient controls to the resource lifecycle.\
There are three new expressions: `precondition`, `postcondition`, and `replace_triggered_by`.

## Terraform Code Refactoring With the Moved Block
Starting from the 1.1 version, Terraform users can use the `moved` block to describe the changes in resource or module addresses (or resources inside a module) in the form of code. \
Once that is described, Terraform performs the movement of the resource within the state during the first apply.

In other words, what this feature gives you, is the ability to document your `terraform state mv` actions, so you and other project or module users don't need to perform them manually.

As your code evolves, a resource or module can have several `moved` blocks associated with it, and Terraform will thoroughly reproduce the whole history of its movement within a state (i.e., renaming).

Let's review some examples that illustrate how it works.

### Moving a resource

In a module, I have a bucket policy that has a generic, meaningless name. It is used in a module that creates a CloudFront distribution with an S3 bucket.

{{< figure src="figure-1.png" caption="An example resource" >}}

It's pretty OK to name a resource like that if you have only a single instance of that kind in your code.

Later, when I need to add another policy to the module, I don't want to name it "that". Instead, I want my policies to have meaningful names now. For example, I could rename the old policy with the `terraform state mv` command, but other users of my module would not know about that.

That is where the `moved` block turns out to be helpful: I can document the name change, and later, everyone else who uses my module will get the same renaming. 

{{< figure src="figure-2.png" caption="Resource address update with the Moved block" >}}

Terraform follows the instructions inside the `module` block to plan and apply changes. Although the resource address update is not counted as a change in the Plan output, Terraform will perform that update during apply.

{{< figure src="figure-3.png" caption="Terraform plan output" >}}

### Moving a module
The same approach can be applied to a module.

Here, I use two modules to create static hosting for a website with a custom TLS certificate.

{{< figure src="figure-4.png" caption="Two modules with generic names" >}}

Again, if I need to add another couple of the CDN+Certificate modules, I would like to have meaningful names in my code so clearly distinguish one from another.

Therefore, I would add two `moved` blocks — one per module call.

And by the way, since I renamed the module (from `cert` to `example_com_cert`), I need to update all references to that module's outputs in the code too.

{{< figure src="figure-5.png" caption="Two modules renamed" >}}

However, there is one nuance: when you rename a module and declare that in the `moved` block, you need to run the `terraform init` before applying the change because Terraform must initialize the module with the new name first.

{{< figure src="figure-6.png" caption="Terraform error: module not installed" >}}

There are some more advanced actions you can make with the `moved` block:
- Implement count and for_each meta-arguments to resources and modules
- Break one module into multiple
  Check the following detailed guide from HashiCorp that explains how to do that — [Refactoring](https://www.terraform.io/language/modules/develop/refactoring)

Introducing the `moved` blocks into your codebase defacto starts the refactoring process for your module users. But the finale of that refactoring happens when you ultimately remove these blocks.

Therefore, here is some advice on how to manage that:

{{<attention>}}
- Keep the `moved` blocks in your code for long. For example, when removing a `moved` block from the code, Terraform does not treat the new object name as a renaming anymore. Instead, Terraform will plan to delete the resource or module with the old name instead of renaming it.

- Keep the complete chains of object renaming (sequence of moves). The whole history of object movement ensures that users with different module versions will get a consistent and predictable behavior of the refactoring.
{{</attention>}}

## Lifecycle expressions: precondition, postcondition, and replace_triggered_by