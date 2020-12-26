---
layout: post
title: Terraform CLI shortcuts
image: /assets/posts/2020-08-25-terraform-cli-shortcuts/cover.jpg
description: A bunch of small tools I use to simplify Terraform workflow
date: 2020-08-25
tags: [terraform, cli, automation]
category: [Howto]
---
Here is some CLI shortcuts I use day-to-day to simplify and speed-up my Terraform workflow.
Requirements --- bash-compatible interpreter, because aliases and functions described below will work with bash, zsh and ohmyzsh. 

In order to use any of described aliases of functions, you need to place it in your `~/.bashrc` or `~/.zshrc` file (or any other configuration file you have for your shell).

Then just source this file, for example: `source ~/.zshrc`

## Function: list outputs and variables of given module
You need to provide the path to module directory, and this function will list all declared variables and outputs module has. It comes very useful when you don't remember them all and just need to take a quick look.

{% highlight bash %}
## TerraForm MOdule Explained
function tfmoe {
  echo -e "\nOutputs:"
  grep -r "output \".*\"" $1 |awk '{print "\t",$2}' |tr -d '"'
  echo -e "\nVariables:"
  grep -r "variable \".*\"" $1 |awk '{print "\t",$2}' |tr -d '"'
}
{% endhighlight %}

Example usage:
```terminal
user@localhost $: tfmoe ./module_alb

Outputs:
	 alb_arn

Variables:
	 acm_certificate_arn
	 lb_name
	 alb_sg_list
	 subnets_id_list
	 tags
```

## Function: pre-fill module directory with configuration files
You need to provide a path to the module directory and this function will create a bunch of empty 'default' .tf files in it.
```shell
#TerraForm MOdule Initialize
function tfmoi {
  touch $1/variables.tf
  touch $1/outputs.tf
  touch $1/versions.tf
  touch $1/main.tf
}
```

Example usage:
```terminal
user@localhost $: mkdir ./module_foo && temoi $_

user@localhost $: ls ./module_foo
main.tf      outputs.tf   variables.tf versions.tf
```


## Aliases
The purpose of these aliases is just to keep you from typing long commands when you want to do a simple action.
```shell
alias tf='terraform'

alias tfv='terraform validate'

alias tfi='terraform init'

alias tfp='terraform plan' 
```

This one is useful because it makes format tool to go in-depth (recursively) through directories.
```shell
alias tfm='terraform fmt -recursive'
```

Example usage:
```terminal
user@localhost $: tfm 
module_ecs_cluster/ecs.tf
module_alb/alb.tf
```