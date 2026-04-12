---
title: "terraform_data vs null_resource: The Built-in Replacement in Terraform 1.4"
slug: hello-terraform-data-goodbye-null-resource
date: 2023-04-16T01:25:18+02:00
summary: "terraform_data is the native replacement for null_resource starting with Terraform 1.4."
description: "terraform_data replaces null_resource in Terraform 1.4 as a built-in managed resource. See the differences, use cases with triggers_replace and provisioners, plus migration examples."
cover:
    image: cover-image.png
    relative: true
    alt: Native built-in replacement for null_resource with Terraform 1.4
tags: [terraform, null_resource, terraform_data, terraform_1.4, new release, infrastructure as code]
categories: [Terraform]
series: ["Terraform Proficiency"]
---

{{<updatenotice>}}
**Updated in April 2026**: Added the `moved` block migration path (Terraform 1.9+), corrected the deprecation status of null_resource, and added notes about OpenTofu compatibility and Terraform 1.14 `action` blocks.
{{</updatenotice>}}

Terraform version 1.4 brought a range of new features, including improved run output in Terraform Cloud, the ability to use OPA policy results in the CLI, and a built-in alternative to the null resource — terraform_data.

In this blog post, I want to demonstrate and explain the **terraform_data** resource that serves two purposes:
- firstly, it allows arbitrary values to be stored and used afterward to implement lifecycle triggers of other resources
- secondly, it can be used to trigger provisioners when there isn't a more appropriate managed resource available.

For those of you, who are familiar with the null provider, the `terraform_data` resource might look very similar. And you're right!\
Rather than being a separate provider, the terraform_data managed resource now offers the same capabilities as an integrated feature. Pretty cool! \
While the null provider is still available and has not been formally deprecated ([as of April 2026, v3.2.4](https://registry.terraform.io/providers/hashicorp/null/3.2.4/docs)), the `terraform_data` is the recommended replacement for `null_resource`. The null provider registry now includes an official migration guide to `terraform_data`, and the CDKTF prebuilt bindings for null were archived in December 2025.

The  `terraform_data` resource has two optional arguments, **input** and **triggers_replace**, and its configuration looks as follows:

{{< figure src="code-snippet-1.png" caption="terraform data resource arguments" width="800">}}

- The `input` (optional) stores the value that is passed to the resource
- The `triggers_replace` (optional) is a value that triggers resource replacement when changes.

There are two attributes, in addition to the arguments, which are stored in the state: **id** and **output** after the resource is created. Let's take a look:

{{< figure src="code-snippet-2.png" caption="terraform data resource attributes" width="800">}}

- The  `output` attribute is computed based on the value of the `input`
- The `id` is just a unique value of the resource instance in the state (as for any other resource).

## Use case for terraform_data with replace_triggered_by

Let's take a look at the first use case for the terraform_data resource. It is the ability to trigger resource replacement based on the value of the input argument.

A bit of context here: the **replace_triggered_by** argument of the resource lifecycle meta-argument allows you to trigger resource replacement based on another referenced resource or its attribute. 

{{<attention>}}
If you are not yet familiar with the `replace_triggered_by`, you can check [another blog post that explains it](/2022/05/04/new-lifecycle-options-and-refactoring-capabilities-in-terraform-1-1-and-1-2/#trigger-resource-replacement-with-replace_triggered_by).
{{</attention>}}

The replace_triggered_by is a powerful feature, but here is the thing about it: only a resource or its attribute must be specified, and **you cannot use a variable or a local value for replace_triggered_by**.

But with terraform_data, you can indirectly initiate another resource replacement by using either a variable or an expression within a local value for the `input` argument.

Let me give you an example here. Consider the following code:

{{< figure src="code-snippet-3.png" caption="trigger replacement based on input variable" width="800">}}

By modifying the  `revision` variable, the next Terraform plan will suggest a replacement action against aws_instance.webserver:
    
{{< figure src="code-snippet-4.png" caption="terraform_data with replace_triggered_by" width="800">}}

{{< subscribe cta="More Terraform deep-dives and platform engineering insights — subscribe." >}}

## Use case for terraform_data with provisioner

Before we start: HashiCorp suggests (and I also support that) avoiding provisioner usage unless you have no other options left. One of the reasons — additional, implicit, and unobvious dependency that appears in the codebase — the binary, which is called inside the provisioner block, must be present on the machine. \
But let's be real, the provisioner feature is still kicking, and there's always that one unique project that needs it.

Here is the code snippet that demonstrates the usage of the provisioner within the terraform_data resource: 
    
{{< figure src="code-snippet-5.png" caption="terraform_data with provisioner" width="800">}}

In this example, the following happens:
- When resources are created the first time, the provisioner inside `terraform_data` runs
- Sequential plan/apply will trigger another execution of the provisioner only when the private IP of the instance (aws_instance.webserver.private_ip) changes because that will trigger `terraform_data` recreation. At the same time, no changes to the internal IP mean no provisioner execution.

## Migrating from null_resource to terraform_data

Starting with Terraform 1.9, you can use the `moved` block to migrate existing `null_resource` instances to `terraform_data` without destroying and recreating them. This is the smoothest migration path — it preserves state and avoids re-running provisioners.

```terraform
moved {
  from = null_resource.example
  to   = terraform_data.example
}

resource "terraform_data" "example" {
  triggers_replace = var.trigger_value
}
```

After running `terraform apply` with the `moved` block, Terraform updates the state in place. You can remove the `moved` block in a subsequent commit once the migration is applied.

One thing to note when migrating: `null_resource.triggers` is a `map(string)`, while `terraform_data.triggers_replace` accepts any value type. This means some trigger expressions may need adjustment during migration.

{{<attention>}}The `moved` block migration requires Terraform 1.9 or later. OpenTofu supports this starting from version 1.10.0.{{</attention>}}

## A note on Terraform 1.14 action blocks

Terraform 1.14 introduced `action` blocks — provider-defined, non-CRUD operations such as invoking a Lambda function or invalidating a CDN cache. For some use cases where `terraform_data` serves as a provisioner trigger, `action` blocks may offer a cleaner declarative alternative. This feature is still new, but worth keeping an eye on.

____

With its ability to store and use values for lifecycle triggers and provisioners, **terraform_data** is a powerful tool that can enhance your Terraform configuration. It works identically in both Terraform and [OpenTofu](https://opentofu.org/).

Although the null provider still has its place in the Terraform ecosystem, terraform_data is its evolution, and its integration as a feature is certainly something to be excited about. 

Why not give it a try in your next project and see how it can simplify your infrastructure as code workflows? Keep on coding! 🙌