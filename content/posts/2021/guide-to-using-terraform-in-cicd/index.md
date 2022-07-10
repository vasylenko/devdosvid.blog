---
canonicalURL: https://spacelift.io/blog/terraform-in-ci-cd
ShowCanonicalLink: true
title: "Guide to Using Terraform in CI/CD"
date: 2021-11-24T22:20:45+02:00
description: How to configure, how to run, and what to mind for when using Terraform in CI/CD
summary: How to configure, how to run, and what to mind for when using Terraform in CI/CD
cover:
    image: cover-image.png
    relative: true
tags: ["terraform", "cli", "automation"]
categories: [Terraform]
showtoc: false
series: ["Terraform Proficiency"]
---

Terraform by itself automates a lot of things: it creates, changes, and versions your cloud resources. Although many teams run Terraform locally (sometimes with wrapper scripts), running Terraform in CI/CD can boost the organization's performance and ensure consistent deployments.

In this article, I would like to review different approaches to integrating Terraform into generic deployment pipelines.

# Where to store the Terraform code
Storing Terraform code in the same repository as the application code or maintaining a separate repository for the infrastructure?

This question has no strict and clear answer, but here are some insights that may help you decide:
- The Terraform and application code coupled together represent one unit, so it's simple to maintain by one team;
- Conversely, if you have a dedicated team that manages infrastructure (e.g., platform team), a separate repository for infrastructure is more convenient because it's a standalone project in that case.
- When infrastructure code is stored with the application, sometimes you have to deal with additional rules for the pipeline to separate triggers for these code parts. But sometimes (e.g., serverless apps) changes to either part (app/infra) should trigger the deployment.

{{< attention >}}

There is no right or wrong approach, but whichever you choose, remember to follow the **Don’t Repeat Yourself (DRY)** principle: make the infrastructure code modular by logically grouping resources into higher abstractions and reusing these modules.

{{< /attention >}}
# Preparing Terraform execution environment
Running Terraform locally generally means that all dependencies are already in-place: you have the binary installed and present in the user's `PATH` and perhaps even some providers already stored in the `.terraform` directory. 

But when you shift Terraform runs from your local machine to stateless pipelines, this is not the case. However, you can still have a pre-built environment — this will speed up the pipeline execution and provide control over the process.

Docker image with a Terraform binary is one of the popular solutions that address this. Once created, you can execute Terraform within a container context with configuration files mounted as a Docker volume.

You can use the official [image from Hashicorp](https://hub.docker.com/r/hashicorp/terraform/), but sometimes it makes sense to maintain your own Docker images with additional tools you may need. For instance, you can bake the `tfsec` tool into the image to use it for security inspection and have it ready inside the Docker container without the need to install it every time.

Here is an example of a Dockerfile that builds an image with a custom Terraform version (you can override it as a build argument) and a `tfsec` tool. This example also shows how to verify the installed Terraform binary to make sure it's signed by HashiCorp before we run it. 

```dockerfile
FROM alpine:3.14
ARG TERRAFORM_VERSION=1.0.11
ARG TFSEC_VERSION=0.59.0
RUN apk add --no-cache --virtual .sig-check gnupg
RUN wget -O /usr/bin/tfsec https://github.com/aquasecurity/tfsec/releases/download/v${TFSEC_VERSION}/tfsec-linux-amd64 \
    && chmod +x /usr/bin/tfsec
RUN cd /tmp \
    && wget "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip" \
    && wget https://keybase.io/hashicorp/pgp_keys.asc \
    && gpg --import pgp_keys.asc \
    && gpg --fingerprint --list-signatures "HashiCorp Security" | grep -q "C874 011F 0AB4 0511 0D02  1055 3436 5D94 72D7 468F" || exit 1 \
    && gpg --fingerprint --list-signatures "HashiCorp Security" | grep -q "34365D9472D7468F" || exit 1 \
    && wget https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_SHA256SUMS \
    && wget https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_SHA256SUMS.sig \
    && gpg --verify terraform_${TERRAFORM_VERSION}_SHA256SUMS.sig terraform_${TERRAFORM_VERSION}_SHA256SUMS || exit 1 \
    && sha256sum -c terraform_${TERRAFORM_VERSION}_SHA256SUMS 2>&1 | grep -q "terraform_${TERRAFORM_VERSION}_linux_amd64.zip: OK" || exit 1 \
    && unzip terraform_${TERRAFORM_VERSION}_linux_amd64.zip -d /bin \
    && rm -rf /tmp/* && apk del .sig-check
```
But the main functionality of Terraform is delivered by provider plugins. It takes time to download the provider: for example, the AWS provider is about 250MB, and in a large scale, with hundreds of Terraform runs per day, this makes a difference.

There are two common ways to deal with it: either use a shared cache available to your pipeline workloads or bake provider binaries into the runtime environment (i.e., Docker image).

The critical element for both approaches is the configuration of the plugin cache directory path. By default, Terraform looks for plugins and downloads them in the `.terraform` directory, which is local to the main project directory. But you can override this, and you can leverage the `TF_PLUGIN_CACHE_DIR` environment variable to do that.

If supported by your CI/CD tool, the shared cache can significantly reduce the operational burden because all your pipeline runtime environments can use it to get the needed provider versions.

So all you have to do is to maintain the provider versions in the shared cache and instruct Terraform to use it:
- Mount the cache directory to the pipeline runtime (i.e., docker container) and specify its internal path
- Set the value of the `TF_PLUGIN_CACHE_DIR` environment variable accordingly

On the other hand, you can bake the provider binaries into the Docker image and inject the value for the `TF_PLUGIN_CACHE_DIR` environment variable right into the Dockerfile.

{{< attention >}}
This approach takes more operational effort **but makes the Terraform environment self-sufficient and stateless**. It also allows you to set strict boundaries around permitted provider versions as a security measure.
{{< /attention >}}
# Planning and Applying changes
Now let's review the ways to automate planning and applying of changes. Although `terraform apply` can do both, it's sometimes useful to separate these actions. 

## Initialization
CI/CD pipelines generally run in stateless environments. Thus, every subsequent run of Terraform looks like a fresh start, so the project needs to be initialized before other actions can be performed.

The usage of the `init` command in CI/CD slightly differs from its common local usage:
```shell
> terraform init -input=false
```

The `-input=false` option prevents Terraform CLI from asking for user actions (it will throw an error if the input was required).

_Also, there is `-no-color` option that prevents the usage of color codes in a shell, so the output will look much cleaner if your CI/CD logging system cannot render the terminal formatting._

Another option of the init command that is useful in CI — is the `-backend-config`. That option allows you to override the backend configuration in your code or define it if you prefer to use partial configuration, thus creating more uniform pipelines.

For example, here is how you can use the same code with different roles in different environments on AWS:
```shell
> terraform init -input=false \
-backend-config="role_arn=arn:aws:iam::012345678901:role/QADeploymentAutomation"
```

Terraform `init` produces two artifacts:
- `.terraform` directory, which Terraform uses to manage cached provider plugins and modules, and record backend information
- `.terraform.lock.hcl` file, which Terraform uses to track provider dependencies 

They both must be present in the project directory to successfully run the subsequent plan and apply commands.

However, I suggest checking in `.terraform.lock.hcl` to your repository as suggested by HashiCorp ([Dependency Lock File](https://www.terraform.io/docs/language/dependency-lock.html)): this way you will be able to control dependencies more thoroughly, and you will not worry about transferring this file between build stages.

## Plan
The  `terraform plan` command helps you validate the changes manually. However, there are ways to use it in automation as well.

By default, Terraform prints the plan output in a human-friendly format but also supports machine-readable JSON. With additional command-line options, you can extend your CI experience.

For example, you can use your validation conditions to decide whether to apply the changes automatically; or you can parse the plan details and integrate the summary into a Pull Request description. Let’s review a simple example that illustrates it. 

First, you need to save the plan output to the file:
```shell
> terraform plan -input=false -compact-warnings -out=plan.file
```
The main point here is the `-out` option — it tells Terraform to save its output into a binary plan file, and we will talk about it in the next paragraph. 

The `-compact-warnings` option suppresses the warning-level messages produced by Terraform. 

Also, the `plan` command has the `-detailed-exitcode` option that returns detailed exit codes when the command exits. For example, you can leverage this in a script that wraps Terraform and adds more conditional logic to its execution, because CIs will generally fail the pipeline on a command’s non-zero exit code. However, that may add complexity to the pipeline logic.

So if you need to get detailed info about the plan, I suggest parsing the plan output.

When you have a plan file, you can read it in JSON format and parse it. Here is a code snippet that illustrates that:
```shell
> terraform show -json plan.file| jq -r '([.resource_changes[]?.change.actions?]|flatten)|{"create":(map(select(.=="create"))|length),"update":(map(select(.=="update"))|length),"delete":(map(select(.=="delete"))|length)}'
{
  "create": 1,
  "update": 0,
  "delete": 0
}
```

Another way to see the information about changes, is to run the `plan` command with `-json` option and parse its output to stdout (available starting from Terraform 1.0.5):
```shell
> terraform plan -json|jq 'select( .type == "change_summary")|."@message"'
"Plan: 1 to add, 0 to change, 0 to destroy."
```
{{< attention >}}
This technique can make your Pull Request messages more informative and improve your collaboration with teammates.
{{< /attention >}}
You can write a custom script/function that sends a Pull Request comment to VCS using its API. Or you can try the existing features of your VCS: with GitHub Actions, you can use the [Terraform PR Commenter](https://github.com/marketplace/actions/terraform-pr-commenter) or similar action to achieve that; for GitLab, there is a built-in functionality that integrates plan results into the Merge Request — [Terraform integration in Merge Requests](https://docs.gitlab.com/ee/user/infrastructure/iac/mr_integration.html). 

You can find more information about the specification of the JSON output here — [Terraform JSON Output Format](https://www.terraform.io/docs/internals/json-format.html).

## Apply
When the plan file is ready, and the proposed changes are expected and approved, it's time to `apply` them.

Here is how the `apply` command may look like in automation:
```shell
terraform apply -input=false -compact-warnings plan.file
```

Here, the `plan.file` is the file we got from the previous plan step.

Alternatively, you might want to omit the planning phase at all. In that case, the following command will apply the configuration immediately, without the need for a plan:
```shell
terraform apply -input=false -compact-warnings -auto-approve
```

Here, the `-auto-approve` option tells Terraform to create the plan implicitly and skip the interactive approval of that plan before applying.

Whichever way you choose, keep in mind the destructive nature of the apply command. Hence, the fully automated apply of configuration generally works well with environments that tolerate unexpected downtimes, such as development or testing. Whereas plan review is recommended for production-grade environments, and in that case, the `apply` job is configured for a manual trigger.

# Dealing with stateless environments
If you run `init`, `plan`, and `apply` commands in different environments, you need to care for some artifacts produced by Terraform:
- The `.terraform` directory with information about modules, providers, and the state file (even in the case of remote state).
- The `.terraform.lock.hcl` file — the dependency lock file which Terraform uses to check the integrity of provider versions used for the project. If your VCS does not track it, you'll need to pass that file to the `plan` and `apply` commands to make them work after `init`.
- The output file of the `plan` command is essential for the `apply` command, so treat it as a vital artifact. This file includes a full copy of the project configuration, the state, and variables passed to the `plan` command (if any). Therefore, mind the security precautions because sensitive information may be present there.

There is one shortcut, though. You can execute the `init` and `plan` commands within the same step/stage and transfer the artifacts only once — to the `apply` execution.

# Using the command-line and environments variables
Last but not least, a few words about ways to maximize the advantage of variables when running Terraform in CI.

There are two common ways how you can pass values for the variables used in the configuration:
1. Using a `-var-file` option with the variable definitions file — a filename ending in `.tfvars` or `.tfvars.json`. For example:
    ```shell
    terraform apply -var-file=development.tfvars -input=false -no-color -compact-warnings -auto-approve
    ```
    Also, Terraform can automatically load the variables from files named exactly `terraform.tfvars` or `terraform.tfvars.json`: with that approach, you don’t need to specify the tfvar file as a command option explicitly.
2. Using environment variables with the prefix `TF_VAR_`. Implicitly, Terraform always looks for the environment variables (within its process context) with that prefix, so the same "instance_type" variables from the example above can be passed as follows:
    ```shell
    export TF_VAR_instance_type=t3.nano
    terraform -input=false -no-color -compact-warnings -auto-approve
    ```

The latter method is widely used in CI because modern CI/CD tools support the management of the environment variables for automation jobs.

Please refer to the following official documentation if you want to know more about variables — [Terraform Input Variables](https://www.terraform.io/docs/language/values/variables.html).

Along with that, Terraform supports several configuration parameters in the form of environment variables. These parameters are optional; however, they can simplify the automation management and streamline its code.

- `TF_INPUT` — when set to "false" or "0", this tells Terraform to behave the same way as with the `-input=false` flag;
- `TF_CLI_ARGS` — can contain a set of command-line options that will be passed to one or another Terraform command. Therefore, the following notation can simplify the execution of `apply` and `plan` commands by unifying their options for CI:
    ```shell
    export TF_CLI_ARGS="-input=false -no-color -compact-warnings"
    terraform plan ...
    terraform apply ...
    ```
    You can advantage this even more when using this variable as the environment configuration of stages or jobs in a CI/CD tool.
- `TF_IN_AUTOMATION`  — when set to any non-empty value (e.g., "true"), Terraform stops suggesting commands run after the one you execute, hence producing less output. 

# Key takeaways

There are two primary outcomes from automating Terraform executions: consistent results and integrating with the code or project management solutions. Although the exact implementation of Terraform in CI may vary per project or team, try to aim the following goals when working on it:
- Ease of code management
- A secure and controlled execution environment
- Coherent runs of init, plan, apply phases
- Leveraging of built-in Terraform capabilities


##### I originally wrote this article for the Spacelift.io technical blog. But I decided to keep it here as well, for the history. The canonical link to their blog has been set accordingly. 