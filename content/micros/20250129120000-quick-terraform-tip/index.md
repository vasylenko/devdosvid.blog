---
title: "Quick Terraform Tip"
date: 2025-01-29T12:00:00+02:00
type: "micro"
draft: false
tags: ["terraform", "tips"]
---

💡 **Quick Terraform tip**: Use `terraform plan -out=plan.tfplan` to save your plan, then `terraform apply plan.tfplan` to execute exactly what you reviewed.

This prevents surprises when someone else makes changes between your plan and apply commands. Especially useful in CI/CD pipelines!

```bash
terraform plan -out=plan.tfplan
terraform apply plan.tfplan
```

Simple but powerful for safer deployments. 🚀