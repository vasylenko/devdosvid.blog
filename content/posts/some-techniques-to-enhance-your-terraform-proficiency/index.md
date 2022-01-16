---
title: "Some Techniques to Enhance Your Terraform Proficiency"
date: 2022-01-16T01:59:51+02:00
description: Learn what cool things Terraform can do with its built-in functionality
cover:
    image: cover-image.png
    relative: true
tags: [terraform, experience, guide]
categories: [Terraform]
---
Terraform built-in functionality is very feature-rich: functions, expressions,  and meta-arguments provide many ways to shape the code and fit it to a particular use case. I want to share a few valuable practices to boost your Terraform expertise in this blog.

{{<attention>}}
Some code examples in this article will work with Terraform version 0.15 and onwards. But if you're still using 0.14 or lower, here's another motivation for you to upgrade.
{{</attention>}}

## Conditional resources creation
{{< figure src="condiitonal-resource-creation.png" >}}
Let's start from the most popular one (although, still may be new for somebody): whether to create a resource depending on some fact, e.g., the value of a variable. Terraform meta-argument `count` helps to describe that kind of logic.

Here is how it may look like:
```terraform
data "aws_ssm_parameter" "ami_id" {
  count    = var.ami_channel == "" ? 0 : 1

  name     = local.ami_channels[var.ami_channel]
}
```

The notation `var.ami_channel == "" ? 0 : 1` is called *conditional expression* and means the following: if my variable is empty (`var.ami_channel == ""` — hence, true) then set the count to 0, otherwise set to 1.

```shell
condition ? true_val : false_val
```

In this illustration, I want to get the AMI ID from the SSM Parameter only if the AMI channel (e.g., beta or alpha) is specified. Otherwise, providing that the `ami_channel` variable is an empty string by default (""), the data source should not be created.

When following this method, keep in mind that the resource address will contain the index identifier. So when I need to use the value of the SSM parameter from our example, I need to reference it the following way:
```terraform
ami_id = data.aws_ssm_parameter.ami_id[0].value
```

The `count` meta-argument can also be used when you need to conditionally create a Terraform module.
```terraform
module "bucket" {
  count             = var.create_bucket == true ? 1 : 0
  source            = "./modules/s3_bucket"

  name              = "my-unique-bucket"
  ...
}
```

The `var.create_bucket == true ? 1 : 0`  expression can be written even shorter: `var.create_bucket ? 1 : 0`  because the `create_bucket` variable has boolean type, apparently.

But what if you need to produce more than one instance of a resource or module? And still be able to avoid their creation.

Another meta-argument — `for_each` — will do the trick.

For example, this is how it looks for a module:
```terraform
module "bucket" {
  for_each          = var.bucket_names == [] ? [] : var.bucket_names
  source            = "./modules/s3_bucket"
  
  name              = "${each.key}"
  enable_encryption = true
  ...
}
```

In this illustration, I also used a conditional expression that makes Terraform iterate through the set of values of `var.bucket_names` if it's not empty and create several modules. Otherwise, do not iterate at all and do not create anything.

The same can be done for the resources. For example, when you need to create an arbitrary number of security group rules, e.g., to allowlist some IPs for your bastion host:

```terraform
resource "aws_security_group_rule" "allowlist" {
  for_each           = var.cidr_blocks == [] ? [] : var.cidr_blocks
  type               = "ingress"
  from_port          = 22
  to_port            = 22
  protocol           = "tcp"
  cidr_blocks        = [each.value]
  security_group_id  = aws_security_group.bastion.id
}
```

And just like with the `count` meta-argument, with the  `for_each`, resource addresses will have the identifier named by the values provided to `for_each`.
For example, here is how I would reference a resource created in the module with `for_each` described earlier:
```terraform
bucket_name = module.bucket["photos"].name
```

## Conditional resource arguments (attributes) setting
{{< figure src="conditional-resource-argument.png" >}}

Now let's go deeper and see how resource arguments can be conditionally set (or not).
First, let's review the conditional argument value setting with the `null` data type:
```terraform
resource "aws_launch_template" "this" {
  name     = "my-launch-template"
  ...
  key_name = var.use_default_keypair ? var.keypair_name : null
  ...
```
Here I want to skip the usage of the EC2 Key Pair for the Launch Template in some instances and Terraform allows me to write the conditional expression that will set the `null` value for the argument. It means the *absence* or *omission* and Terraform would behave the same as if you did not specify the argument at all.

Dynamic blocks are another case where conditional creation suits best. Take a look at the following piece of CloudFront resource code where I want to either describe the configuration for the custom error response or omit that completely:
```terraform
resource "aws_cloudfront_distribution" "cdn" {
  enabled = true
  ...
  dynamic "custom_error_response" {
    for_each = var.custom_error_response == null ? [] : [var.custom_error_response]
    iterator = cer
    content {
      error_code            = lookup(cer.value, "error_code", null)
      error_caching_min_ttl = lookup(cer.value, "error_caching_min_ttl", null)
      response_code         = lookup(cer.value, "response_code", null)
      response_page_path    = lookup(cer.value, "response_page_path", null)
    }
  }
  ...
}
```

The `custom_error_response` variable is `null` by default, but it has the `object` type, and users can assign the variable with the required nested specifications if needed. And when they do it, Terraform will add the `custom_error_response` block to the resource configuration. Otherwise, it will be omitted entirely.

## Convert types with ease
{{< figure src="types-converstion.png" >}}
Ok, let's move to the less conditional things now 😅

Terraform has several type conversion functions: `tobool()`, `tolist()`,`tomap()`, `tonumber()`, `toset()`, and `tostring()`. Their purpose is to convert the input values to the compatible types.

For example, suppose I need to pass the set to the `for_each` (it accepts only sets and maps types of value), but I got the list as an input; let's say I got it as an output from another module. In such a case, I would do something like this:
```terraform
for_each = toset(var.remote_access_ports)
```

However, I can make my code cleaner and avoid the explicit conversion — I just need to define the value type in the configuration block of the `my_list` variable. Terraform will do the conversion automatically when the value is assigned.

```terraform
variable "remote_access_ports" {
  description = "Ports for remote access"
  type        = set(string)
}
```

While Terraform can do a lot of implicit conversions for you, explicit type conversions are practical during values normalization or when you need to calculate some complex value for a variable. For example, the Local Values, known as `locals`, are the most suitable place for doing that.

By the way, although there is a `tolist()` function, there is no such thing as the `tostring()` function. But what if you need to convert the list to string in Terraform?

The `one()` function can help here: it takes a list, set, or tuple value with either zero or one element and returns either `null` or that one element in the form of string.

It's useful in cases when a resource created using conditional expression is represented as either a zero- or one-element list, and you need to get a single value which may be either `null` or `string`, for example:
```terraform
resource "aws_kms_key" "main" {
  count               = var.ebs_encrypted ? 1 : 0

  enable_key_rotation = true
  tags                = var.tags
}

resource "aws_kms_alias" "main" {
  count         = var.ebs_encrypted ? 1 : 0

  name          = "alias/encrypt-ebs"
  target_key_id = one(aws_kms_key.main[*]key_id)
}

```

## Write YAML or JSON as Terraform code (HCL)
{{< figure src="write-yaml-json-as-terraform-code.png" >}}
Sometimes you need to supply JSON or YAML files to the services you manage with Terraform. For example, if you want to create something with CloudFormation using Terraform (and I am not kidding). Sometimes the AWS Terraform provider does not support the needed resource, and you want to maintain the whole infrastructure code using only one tool.

Instead of maintaining another file in JSON or YAML format, you can embed JSON or YAML code management into HCL by taking benefit of the  `jsonencode()` or `yamlencode()`  functions.

The attractiveness of this approach is that you can reference other Terraform resources or their attributes right in the code of your object, and you have more freedom in terms of the code syntax and its formatting comparable to native JSON or YAML.

Here is how it looks like:
```terraform
locals {
	some_string = "ult"
  myjson_object = jsonencode({
    "Hashicorp Products": {
      Terra: "form"
      Con:   "sul"
      Vag:   "rant"
      Va:    local.some_string
    }
  })
}
```

The value of the `myjson_object` local variable would look like this:
```json
{
  "Hashicorp Products": {
    "Con": "sul",
    "Terra": "form",
    "Va": "ult",
    "Vag": "rant"
  }
}
```

And here is a piece of real-world example:
```terraform
locals {
  cf_template_body = jsonencode({
    Resources : {
      DedicatedHostGroup : {
        Type : "AWS::ResourceGroups::Group"
        Properties : {
          Name : var.service_name
          Configuration : [
            {
              Type : "AWS::EC2::HostManagement"
              Parameters : [
                {
                  Name : "auto-allocate-host"
                  Values : [var.auto_allocate_host]
                },
			...
			...
```

## Templatize stuff
{{< figure src="templatize-stuff.png" >}}
The last case in this blog but not the least by its efficacy — render source file content as a template in Terraform.

Let's review the following scenario: you launch an EC2 instance and want to supply it with a bash script (via the user-data parameter) for some additional configuration at launch.

Suppose we have the following bash script `instance-init.sh` that sets the hostname and registers our instance in a monitoring system:
```bash
#!/bin/bash

hostname example.com
bash /opt/system-init/register-monitoring.sh
```

But what if you want to set a different hostname per instance, and some instances should not be registered in the monitoring system?

In such a case, here is how the script file content will look:
```gotemplate
#!/bin/bash

hostname ${system_hostname}
%{ if register_monitoring }
bash /opt/system-init/register-monitoring.sh
%{endif}
```

And when you supply this file as an argument for the EC2 instance resource in Terraform, you will use the `templatefile()` function to make the magic happen:
```terraform
resource "aws_instance" "web" {
  ami           = var.my_ami_id
  instance_type = var.instance_type
  ...
  user_data = templatefile("${path.module}/instance-init.tftpl", {
    system_hostname     = var.system_hostname
    register_monitoring = var.add_to_monitoring
  })
  ...
}
```
And of course, you can create a template from any file type. The only requirement here is that the template file must exist on the disk at the beginning of the Terraform execution.

## Key takeaways
Terraform is far beyond the standard resource management operations. With the power of built-in functions, you can write more versatile code and reusable Terraform modules.

✅ Use [conditional expressions](https://www.terraform.io/language/expressions/conditionals) with [count](https://www.terraform.io/language/meta-arguments/count) and [for_each](https://www.terraform.io/language/meta-arguments/for_each) meta-arguments, when the creation of a resource depends on some context or user input.

✅ Take advantage of [implicit type conversion](https://www.terraform.io/language/expressions/types#type-conversion) when working with input variables and their values to keep your code cleaner.

✅ Embed YAML and JSON-based objects right into your Terraform code using built-in [encoding](https://www.terraform.io/language/functions/jsonencode) [functions](https://www.terraform.io/language/functions/yamlencode).

✅ And when you need to pass some files to the managed service, you can treat them as [templates](https://www.terraform.io/language/functions/templatefile) and make them multipurpose.

Thank you for reading down to this point! 🤗

If you have some favorite Terraform tricks — I would love to know!
