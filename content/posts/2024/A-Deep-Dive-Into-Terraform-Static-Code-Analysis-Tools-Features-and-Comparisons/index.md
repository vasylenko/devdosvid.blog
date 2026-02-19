---
title: "A Deep Dive Into Terraform Static Code Analysis Tools: Features and Comparisons"
date: 2024-04-16T21:14:15+02:00
summary: "Explore key features and comparisons of top Terraform static code analysis tools to enhance security and compliance in your infrastructure management."
description: "Explore key features and comparisons of top Terraform static code analysis tools to enhance security and compliance in your infrastructure management."
cover:
    image: cover-image.png
    relative: true
    alt: "Terraform Static Code Analysis Tools"
tags: [terraform,security,compliance,infrastructure-as-code,static-code-analysis]
categories: [Terraform]
series: ["Terraform Proficiency"]
---

Many teams employ Terraform by HashiCorp to efficiently manage their infrastructure, leveraging its ability to automate the lifecycle of complex environments. Yet, integrating security scanning into Terraform pipelines often remains overlooked, exposing these environments to potential security risks and compliance issues.

This article explores several prominent static code analyzers that support Terraform code and focus on its security scanning. This comparison will guide teams in choosing the right tool to enhance their security measures within Terraform workflows, ensuring safer and more compliant infrastructure management.

Here are the tools we'll be reviewing: **KICS**, **tfsec**, **Trivy**, **Terrascan**, **Checkov**, and **Semgrep OSS**.

While many of these tools also support other platforms and technologies, **this review will concentrate exclusively on their functionality with Terraform.** 

## Why use Static Code Analysis for Terraform
Static code analysis tools are necessary to enhance the security of Terraform-managed infrastructures. Unlike linters, these tools focus not on syntax errors or coding style but delve deeply into the code to identify security vulnerabilities and potential compliance issues without running the actual code. This proactive approach to security helps safeguard the infrastructure from potential threats before deployment.

### Key Benefits
- Early Detection: Identifies security vulnerabilities and misconfigurations early in development, preventing them from reaching production. 
- Compliance Assurance: Ensures Terraform code complies with industry standards and internal security policies.
- Automated Security Integration: Seamlessly integrates with CI/CD pipelines, automating security checks to maintain a continuous focus on security.
- Actionable Insights: Delivers detailed vulnerability reports, facilitating swift and effective resolution.
- Scalability: Effectively handles increasing project complexity and size, maintaining rigorous security standards without additional manual effort.

### Expected Features
- **Policy Coverage**: The tool should offer comprehensive scanning capabilities to detect security vulnerabilities specific to Infrastructure as Code.
- **Customizable Security Policies**: It must allow users to define and adjust security policies and severity levels to align with specific project needs or compliance requirements. 
- **Seamless Integration**: The analyzer should integrate effortlessly with existing CI/CD tools and version control systems, facilitating a smooth workflow. 
- **Detailed Reporting**: Clear and actionable reports are crucial. The tool should prioritize issues based on severity and provide practical steps for remediation. 
- **Scanning Customization**: Users should be able to tailor the scanning process to focus on particular aspects of the codebase, enabling targeted and efficient security assessments.

With a clear understanding of the necessary features in a static code analyzer, which tools on the market best fulfill these criteria?

Let's take a closer look at some leading options!

## Meet the Static Code Analyzers for Terraform
Following on what makes a static code analyzer robust, let's dive into some open-source tools that exemplify these essential features.

I picked six tools for my review. I know there are more on the market, but I focused on **open-source, free-to-use** tools and those that provide at least >100 out-of-the-box scanning policies for Terraform.

**KICS** (stands for "Keeping Infrastructure as Code Secure"): \
Owner/Maintainer: Checkmarx\
Age: First released on GitHub on November 30th, 2020\
License: [Apache License 2.0](https://github.com/Checkmarx/kics/blob/master/LICENSE)

**tfsec**\
Owner/Maintainer: Aqua Security (acquired in 2021)\
Age: First released on GitHub on March 5th, 2019\
License: [MIT License](https://github.com/aquasecurity/tfsec/blob/master/LICENSE)
{{<attention>}}tfsec project is no longer actively maintained in favor of the Trivy tool. But because many people still use it and it's quite famous, I added tfsec to this comparison.\
However, I recommend against using it for new projects.{{</attention>}}

**Trivy**\
Owner/Maintainer: Aqua Security\
Age: First released on GitHub on May 7th, 2019\
License: [Apache License 2.0](https://github.com/aquasecurity/trivy/blob/main/LICENSE)\
_backward-compatible with tfsec_

**Terrascan**\
Owner/Maintainer: Tenable (acquired in 2022)\
Age: First release on GitHub on November 28th, 2017\
License: [Apache License 2.0](https://github.com/tenable/terrascan/blob/master/LICENSE)

**Checkov**\
Owner/Maintainer: Prisma Cloud by Palo Alto Networks (acquired in 2021)\
Age: First released on GitHub on March 31st, 2021\
License: [Apache License 2.0](https://github.com/bridgecrewio/checkov/blob/main/LICENSE)

**Semgrep OSS**\
Owner/Maintainer: Semgrep\
Age: First release on GitHub on February 6th, 2020\
License: [GNU Lesser General Public License v2.1](https://github.com/semgrep/semgrep/blob/develop/LICENSE)

These tools are essential in enhancing Terraform's security posture and reflect a strong collaboration between open-source communities and enterprise backing. This blend ensures that the tools are not only accessible but also robustly maintained and up-to-date.

Let’s explore how these tools stack up regarding features and usability.

## Comparing Out-of-the-Box Policies and Terraform Providers
Understanding the number and variety of default policies each tool offers is crucial for those just beginning to explore security automation for Terraform.

The extent of out-of-the-box policies can significantly ease the integration process of static analysis by providing immediate and comprehensive insights into potential security and compliance issues. Similarly, the number of supported Terraform Providers also plays a critical role.

In this chapter, we delve into these foundational features across observed tools, helping you pinpoint which one could best satisfy your requirements for robust, ready-to-use security scanning.

| Tool        | Policies | Supported Terraform Providers                                                               |
|-------------|----------|---------------------------------------------------------------------------------------------|
| **KICS**       | 663      | aws, azure, gcp, kubernetes, alicloud, databricks, github, nifcloud                         |
| **tfsec**      | 154      | aws, azure, gcp, digitalocean, kubernetes, cloudstack, github, openstack, oracle            |
| **Trivy**      | 322      | aws, azure, gcp, digitalocean, cloudstack, github, oracle, openstack                        |
| **Terrascan**  | 790      | aws, azure, gcp, digitalocean, kubernetes, docker, github                                   |
| **Checkov**    | 2110     | aws, azure, gcp, digitalocean, kubernetes, github, gitlab, ibm, linode, openstack, alicloud |
| **Semgrep OSS** | 362      | aws, azure, gcp                                                                             |

As you can see, all tools support the "Big Three" cloud service Terraform providers—AWS, Azure, and GCP—for managing resources on these popular platforms.

With over 2000 out-of-the-box policies, Checkov significantly stands out from the competition. This tool also leads in the total number of supported Terraform providers.

While the default policies provide a strong foundation for security scanning, the ability to tailor these policies is just as crucial. Next, we'll explore how each tool accommodates custom policy capabilities, allowing you to fine-tune the policies to fit your project's specific requirements.

## Custom Policy Capabilities

Default policies serve as the foundation, but the nuances of each project demand the extension of this base.

Here, we delve into how each tool enables you to add custom policies, thus enhancing and refining the provided defaults.

While all six tools support adding custom policies to their default set, they differ in terminology: 'policy' is the common term, whereas KICS refers to them as 'queries,' and Semgrep calls them 'rules.'

Regarding policy syntax:

**OPA Rego** syntax is used by [KICS](https://docs.kics.io/latest/creating-queries/), [Trivy](https://aquasecurity.github.io/trivy/v0.50/docs/scanner/misconfiguration/custom/), [tfsec](https://aquasecurity.github.io/tfsec/latest/guides/rego/rego/), and [Terrascan](https://runterrascan.io/docs/policies/policies/).  It's a powerful language widely adopted in the industry, though there's a learning curve that could pay dividends for future projects.

**YAML** syntax is used by [Checkov](https://www.checkov.io/3.Custom%20Policies/Custom%20Policies%20Overview.html) and [Semgrep](https://semgrep.dev/docs/writing-rules/rule-syntax/). This offers a familiar and straightforward start, with Checkov also allowing policies to be written in Python, albeit with some constraints. With YAML, the ease of use is balanced against the limitations set by the tool's capabilities.

Understanding these differences will guide you to a tool that matches your security requirements, your team's expertise, and the scope of your infrastructure projects.

To illustrate, here is an example of a KICS Rego policy checking for default RDS instance ports:
```text
package Cx

import data.generic.common as common_lib
import data.generic.terraform as tf_lib

CxPolicy[result] {
	db := input.document[i].resource.aws_db_instance[name]

	enginePort := common_lib.engines[e]

	db.engine == e
	db.port == enginePort

	result := {
		"documentId": input.document[i].id,
		"resourceType": "aws_db_instance",
		"resourceName": tf_lib.get_resource_name(db, name),
		"searchKey": sprintf("aws_db_instance[%s].port", [name]),
		"issueType": "IncorrectValue",
		"keyExpectedValue": sprintf("aws_db_instance[%s].port should not be set to %d", [name, enginePort]),
		"keyActualValue": sprintf("aws_db_instance[%s].port is set to %d", [name, enginePort]),
		"searchLine": common_lib.build_search_line(["resource", "aws_db_instance", name, "port"], []),
	}
}
```

And an example of a Checkov YAML policy forbidding specific EC2 instance types:
```yaml
---
metadata:
 name: "Org's compute instances should not be p5.48xlarge or p4d.24xlarge"
 id: "ACME_AWS_FORBIDDEN_EC2_TYPES"
 category: "NETWORKING"
definition:
 or:
 - cond_type: "attribute"
   resource_types:
    - "aws_instance"
   attribute: "instance_type"
   operator: "not_equals"
   value: "p5.48xlarge"
 - cond_type: "attribute"
   resource_types:
   - "aws_instance"
   attribute: "instance_type"
   operator: "not_equals"
   value: "p4d.24xlarge"
```

With the ability to tailor policies to our specific needs, we'll next explore each tool's capacity to integrate broadly, determining how well they play with the rest of our tech stack.

## Integration Capabilities
Integration capabilities are the cornerstone of efficient DevOps practices.

This section will evaluate how each static code analyzer enhances your tech stack through seamless integration with other systems and technologies.

We will assess each tool against four key integration points that are vital for development workflows:
- **Docker Image**: Ensures easy deployment across any container-supported environment.
- **IDE Plugins**: Facilitates real-time feedback and improves code quality directly within the developer's workspace.
- **CI/CD Systems**: Supports direct integration through plugins or extensions, eliminating the need for manual downloads or CLI setups.
- **Pre-commit Hook**: Provides an early security checkpoint by scanning code before it is committed, catching errors at the initial stages.

| Tool        | Docker Image | IDE Plugins                   | CI/CD Systems                                                                      | Hook |
|-------------|--------------|-------------------------------|------------------------------------------------------------------------------------|------|
| **KICS**       | ✅           | VSCode                        | Github Actions, GitLab, Terraform Cloud, Codefresh                                 | ✅    |
| **tfsec**      | ✅           | VSCode, JetBrains, Vim        | Github Actions                                                                     | ❌    |
| **Trivy**      | ✅           | VSCode, JetBrains, Vim        | Azure DevOps, GitHub Actions, Buildkite, Dagger, Semaphore, CircleCI, Concourse CI | ❌    |
| **Terrascan**  | ✅           | VSCode                        | GitHub Actions, Atlantis                                                           | ✅    |
| **Checkov**    | ✅           | VSCode, JetBrains             | GitHub Actions, GitLab                                                                   | ✅    |
| **Semgrep OSS** | ✅           | VSCode, JetBrains, Emacs, Vim | GitLab                                                                             | ✅    |

In addition to the table above, here are a few noteworthy features of some tools:
- Checkov supports OpenAI integration to suggest remediations. But be careful because AI tends to hallucinate.
- KICS supports applying auto-remediation for some of its out-of-the-box policies. This also applies to custom policies, where you can define remediations and apply them automatically.
- Terrascan is the only one that provides the VSCode extension to create and test custom policies written in Rego.
- GitLab uses KICS as its default built-in IaC scanner — available out of the box with "[Infrastructure as Code scanning](https://docs.gitlab.com/ee/user/application_security/iac_scanning/)". However, there's also [GitLab CI Component](https://gitlab.com/guided-explorations/ci-cd-plugin-extensions/checkov-iac-sast) available for Checkov.

Having covered the integration capabilities, let’s now focus on the output formats each tool provides.

## Output Formats Provided
Output formats extend the utility of static code analysis, facilitating integration with the CI/CD feedback loop and enabling its use as an artifact in subsequent CI jobs.

This chapter examines the variety of formats each tool supports for this purpose.

Each tool offers a range of output formats tailored to different needs.

**For GitLab users**: For teams leveraging GitLab's security scanning, KICS, Checkov, and Semgrep OSS are equipped with compatible output formats, facilitating smooth GitLab integration.

**For GitHub users**: SARIF's adoption as an industry standard, particularly by GitHub for code scanning, makes it a must-have. All tools assessed offer SARIF support, ensuring interoperability and broad utility.

**JUnit Reports**: The availability of JUnit output is crucial for capturing test results in a format recognizable by various CI systems. Trivy, Terrascan, Checkov, and Semgrep OSS support this, enabling clear visualization of test outcomes and enhancing the feedback loop within CI pipelines.

Beyond these, each tool supports additional formats, enriching their application and versatility. Here's the full breakdown of the output formats, complementing the standard CLI output:

| Tool        | Supported Output Formats                                                                  |
|-------------|-------------------------------------------------------------------------------------------|
| **KICS**       | ASFF, CSV, Code Climate, CycloneDX, GItLab SAST, HTML, JSON, JUnit, PDF, SARIF, SonarQube |
| **tfsec**      | Checkstyle, CSV, HTML, JSON, JUnit, Markdown, SARIF                                       |
| **Trivy**      | ASFF, Cosign, CycloneDX, JSON, SARIF, SPDX                                                |
| **Terrascan**  | JSON, JUnit, SARIF, XML, YAML                                                             |
| **Checkov**    | CSV, CycloneDX, GItLab SAST, JSON, JUnit, SARIF, SPDX                                     |
| **Semgrep OSS** | Emacs, GitLab SAST, JSON, JUnit, SARIF, Vim                                               |

Moving from output formats to operational adaptability, let's investigate the customization options for scanner settings. This important feature allows each tool to align with varied project demands.

## Customizing Scanner Settings
This chapter moves beyond the default scanner settings and delves into scanner settings' customizability, ensuring that tools can be calibrated for any development environment or security requirement.

I will evaluate each tool against criteria that define a tool's adaptability and user-friendliness:

* **Targeted Scans**: Select specific directories for scanning or exclusion to focus on pertinent areas and skip irrelevant ones.
* **In-Code Ignore Policies**: Enable ignore directives within code to skip checks when exceptions apply selectively.
* **Severity Thresholds**: Set reporting to include only findings above a chosen severity level, concentrating on the most impactful issues.
* **Configuration File**: Employ configuration files for consistency and collaboration, enabling a 'configuration as code' approach.
* **TF Variables Interpolation**: Interpret and evaluate Terraform variables for an accurate security assessment of IaC.
* **Module Scanning**: For complete coverage, scans should include both local and remote (public/private) Terraform modules.

Based on these criteria, the following table offers a comparative view of how each tool performs, giving you a clear snapshot of their customization capabilities:

| Tool        | Targeted Scans | Ignore Policies | Min Severity | Config File | Variables Interpolation | Module Scanning |
|-------------|----------------|-----------------|--------------|-------------|-------------------------|-----------------|
| **KICS**       | ✅            | ✅               | ✅            | ✅           | ✅                       | ⁉️️             |
| **tfsec**      | ✅            | ✅               | ✅            | ✅           | ✅                       | ✅               |
| **Trivy**      | ✅            | ✅               | ✅            | ✅           | ✅                       | ✅               |
| **Terrascan**  | ✅            | ✅               | ✅            | ✅           | ✅                       | ✅               |
| **Checkov**    | ✅            | ✅               | ✅            | ✅           | ✅                       | ✅               |
| **Semgrep OSS** | ✅            | ✅               | ✅            | ❌           | ✅                       | ❌               |

Most reviewed tools meet nearly all the criteria set for scanner setting customization, demonstrating their flexibility and advanced capabilities. However, there are notable features worth considering:

* KICS: Provides limited module scanning capabilities, restricted to some public modules from the Terraform registry, and does not cover local or private custom modules.
* Terrascan & Trivy: Both feature server modes that centralize vulnerability databases. This centralization facilitates a unified approach to applying policies and configurations, enhancing consistency and efficiency for teams and reducing the management overhead of diverse policies across multiple projects.
* Semgrep: It doesn't support scanner configuration files; instead, it uses the "config" word to call the rule sets and accepts such configs. Notably, it also does not support the scanning of Terraform modules at all.

## Terraform Security Scanning: The Big Picture and Top Pick

Here's a comprehensive comparison summary to guide your selection of the most suitable Terraform static code analyzer:

| Tool        | Default Policies | Custom Policies | Integration                           | Output Formats                                                    | Customization                                                                                                      |
|-------------|------------------|-----------------|---------------------------------------|-------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| **KICS**       | 663              | OPA Rego        | ✅Docker, ✅IDE, ✅CI/CD, ✅Git Hook   | ASFF, CSV, Code Climate, CycloneDX, GItLab SAST, HTML, JSON, JUnit, PDF, SARIF, SonarQube | ✅Targeted Scans, ✅Ignore Policies, ✅Min Severity, ✅Config File, ✅Variables Interpolation, ❌Module Scanning      |
| **tfsec**      | 154              | OPA Rego        | ✅Docker, ✅IDE, ✅CI/CD, ❌Git Hook   | Checkstyle, CSV, HTML, JSON, JUnit, Markdown, SARIF               | ✅Targeted Scans, ✅Ignore Policies, ✅Min Severity, ✅Config File, ✅Variables Interpolation, ✅Module Scanning      |
| **Trivy**      | 322              | OPA Rego        | ✅Docker, ✅IDE, ✅CI/CD, ❌Git Hook   | ASFF, Cosign, CycloneDX, JSON, SARIF, SPDX                        | ✅Targeted Scans, ✅Ignore Policies, ✅Min Severity, ✅Config File, ✅Variables Interpolation, ✅Module Scanning      |
| **Terrascan**  | 790              | OPA Rego        | ✅Docker, ✅IDE, ✅CI/CD, ✅Git Hook   | JSON, JUnit, SARIF, XML, YAML                                     | ✅Targeted Scans, ✅Ignore Policies, ✅Min Severity, ✅Config File, ✅Variables Interpolation, ✅Module Scanning      |
| **Checkov**    | 2110             | YAML, Python    | ✅Docker, ✅IDE, ✅CI/CD, ✅Git Hook   | CSV, CycloneDX, GItLab SAST, JSON, JUnit, SARIF, SPDX             | ✅Targeted Scans, ✅Ignore Policies, ✅Min Severity, ✅Config File, ✅Variables Interpolation, ✅Module Scanning      |
| **Semgrep OSS** | 362              | YAML            | ✅Docker, ✅IDE, ✅CI/CD, ✅Git Hook   | Emacs, GitLab SAST, JSON, JUnit, SARIF, Vim                       | ✅Targeted Scans, ✅Ignore Policies, ✅Min Severity, ❌Config File, ✅Variables Interpolation, ❌Module Scanning      |

Integrating a Terraform security scanning into your development pipeline is a proven strategy to boost your security posture. These tools detect potential vulnerabilities early and enforce best practices and compliance standards, representing a proactive approach to infrastructure security.

For teams not yet utilizing these tools, **Checkov** is my top recommendation:
- Biggest number of default policies and supported Terraform providers for a quick start.
- Custom policy support in YAML and Python for flexible policy creation.
- Wide integration options with Docker, IDEs, CI/CD systems, and Git Hooks for a smooth workflow.

Please share your favorite tool in the comments below! Also, let me know if I missed a cool product that should have been included in the review.