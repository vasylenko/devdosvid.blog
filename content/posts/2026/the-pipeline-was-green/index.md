---
title: "The Pipeline Was Green: AI Agents and CI Trust"
slug: "the-pipeline-was-green"
date: 2026-04-10T22:03:53+02:00
summary: An AI agent upgraded a Helm chart, the pipeline said green, and QA was broken for three days. The first instinct was to lock everything down. The better answer was harder to accept.
description: "AI agent in CI/CD: our pipeline said green, the agent trusted it, and it broke QA for three days. The problem wasn't the agent — it was our false signals."
cover:
    image: cover.png
    relative: true
    alt: "A green spotlight on a tripod standing on cracked red ground"
keywords: ["AI agent in CI/CD", "AI agents in pipelines", "trusting AI agents", "Renovate Claude Code", "CI signal trustworthiness", "AI for DevOps", "platform engineering", "AI automation", "Helm chart upgrade", "Kubernetes operator", "AI-friendly repository", "engineering leadership"]
series: ["Engineering Leadership"]
---

Late December, two days before Christmas break. Half the company is already gone. The other half is trying to close out whatever they can before the end of the year.

I open Argo CD because I'm working with the QA cluster that day. A few projects marked red. Not unusual -- QA has its moments. Shit happens.

Then a message shows up in a different Slack channel. A developer asking his own team: "Hey, does anyone know what's happening with QA? Since Friday night, all our services are down."

Since Friday night. It's been days.

I go back to Argo CD. Hit refresh. Watch a few red dots turn into a wall of red -- every application in the cluster, failing.

On Friday evening, an AI-powered automation -- Renovate paired with Claude Code -- had patched the External Secrets Operator Helm chart from an early 0.x to 1.x. A major version bump. New API version, incompatible Custom Resource Definitions. Every service that consumed secrets from AWS, which was most of them, couldn't deploy.

The Terraform plan was green. The apply was green. The PR was closed. Nobody told anyone.

I spent the next seven hours before Christmas break untangling the damage. I tried rolling back. I tried manually migrating the resources. Neither worked -- the change was too widespread. Eventually, I had to recreate the chart from scratch and clean up its remnants from across the cluster, heavily leaning on Claude Code to help diagnose what I was dealing with, because honestly, I hadn't worked with Helm charts at this depth before.

> [!NOTE] But the broken cluster wasn't the real problem. The real problem was that every signal in our system said: "safe."

## The Signal That Lied

Here's what the pipeline saw: a Helm chart update. Terraform plan -- green. Terraform apply on QA -- green. The CI applied the change as part of the PR pipeline -- no merge required. The PR was closed afterward, discarded like a test run. But the change had already landed. QA was already broken.

Here's what the pipeline didn't see: that jumping from an early 0.x to 1.x changes the Custom Resource Definitions. That every service consuming secrets through this operator would break. That "QA" in our team's vocabulary means something closer to "production" -- it's the environment where all development happens, where every team deploys their backend services, where breaking something means blocking the entire engineering organization. This is a production environment for the team that owns it -- the Platform team.

From the outside -- from somebody who doesn't know our internals -- the green pipeline looked fine. It's just QA, right?

Same green. Two completely different meanings.

## The First Instinct

Our first reaction was natural. Lock it down. Restrict contributors. Protect the repos. Nobody touches platform infrastructure without explicit approval.

This is what most organizations do when AI-assisted automation causes an incident. Add mandatory peer review for AI-generated changes. Scope permissions down. Layer compliance checks on top. It's the responsible-sounding answer -- and it's what we were discussing with the team in the first few hours.

Then I had a thirty-minute call with the security engineer who had run the automation.

He walked me through how he'd set it up: the Renovate and Claude Code combination, his vision for automating security patches at scale, and what he expected it to do. He wasn't defensive. He was genuinely surprised it had caused damage. From his perspective, the automation had worked exactly as intended. The pipeline was green. No errors. No warnings. He hadn't checked the Terraform plan job logs because -- why would he? The job passed.

I sat there listening and realized I was looking at a mirror. The frustration I'd been carrying for three days was aimed at the wrong target. He had done everything our process told him to do. He ran the automation. The CI gave him a green light. He moved on. If I were in his position -- without years of context about how the Platform treats QA, without the instinct to read Terraform plan logs even when the job is green -- I would have done the same thing.

But this distinction -- that green means "technically possible," not "safe" -- lived entirely inside our team's heads. It wasn't written down. It wasn't encoded in the pipeline. There was nothing for the automation or the engineer to read that would have surfaced the risk.

> [!NOTE] This wasn't a careless team breaking another team's things. This was two teams reading the same signal through completely different mental models, with no mechanism to surface the gap.

The Platform's CI gave a false signal of safety. Security's automation trusted it. The disconnect was mutual.

Locking down contributors wouldn't fix a false signal. You'd still have a pipeline that says "safe" when it means "technically possible." You'd just have fewer people triggering it.

{{< subscribe >}}

## We Know How to Build Walls

I'm not against gates. We've built them before, and they work.

A year earlier, when I was on the Security Automation team, we ran a supply chain security project -- defined by our CISO as a top risk. I had to implement security gates across the CI/CD pipeline for every Docker image going to production. Platform, security, and developers co-designed it together.

The first proposal had five gates. We thought it was thorough. The developers we brought into the design review had a different take: "Are you crazy? You want us to wait fifteen extra minutes for all this scanning? Don't do this."

So we iterated. Five gates became three: build-time scan, a Clean Room registry with an admission controller that only allows scanned images into the cluster, and runtime scanning. We pushed it out by default -- no team had to opt in -- but gave every team the freedom to opt out if the scanner was blocking them. We added whitelisting for specific CVEs in developer tooling that wouldn't reach production.

That project worked. The threat was well-defined, the contributors were human, and the people affected were in the room arguing about the design. The "are you crazy?" feedback didn't slow us down -- it made the final version better.

## Why This Is Different

Autonomous AI agents don't join your design session. They don't say "are you crazy?" They read your `CLAUDE.md` or `AGENTS.md` and your CI configuration, and do exactly what those say. If the instructions are incomplete, they fill the gap with their own judgment -- often technically correct but contextually wrong.

The supply chain gates worked because human contributors could push back, ask questions, and iterate. An AI agent that reads a green pipeline and closes a PR doesn't push back. It doesn't ask "is this QA cluster actually critical?" It trusts the signal.

You can't gate your way out of that. More approvals on a process that gives false signals just give you more confident false signals.

AI-assisted contributions at our company aren't hypothetical -- engineers use AI-coding agents and automated patching agents every day. We push AI adoption hard, and for good reason -- it's a force multiplier. But when the signals are wrong, it multiplies that too.

The instinct to lock down makes sense when you can define the threat and put the affected people in a room to argue about the solution. When the contributor is a machine reading your pipeline output as the source of truth, the threat isn't the contributor. It's your own system telling it the wrong thing.

## The Direction, Not the Destination

So instead of closing the door, we decided to redesign the room.

The core idea is clear, even if executing it isn't: treat an AI agent the way you'd treat a newcomer engineer. Someone with deep domain expertise but zero context about your specific project. If your repo isn't legible to that person, it's not legible to an agent either -- they were trained on human-created content, after all.

> [!NOTE] The best AI-friendly repo is first and foremost a human-friendly repo.

Not fewer guardrails -- guardrails that don't require tribal knowledge to understand.

What this looks like in practice:

**1. Write instruction files.** A `CLAUDE.md` or `AGENTS.md` that explains what the repo does, how CI works, and what to never touch. A newcomer's onboarding doc, readable by both humans and agents.

**2. Enforce guardrails as code.** Critical-file protections as scripts that fail hard in CI. Pre-commit hooks for linters and style checks -- the agent picks up the issues and fixes them before pushing. Not documented wishes. Enforcement.

**3. Add an AI code reviewer to CI.** One that reads dependency changelogs before the PR is reviewed. When a Helm chart jumps a major version, the reviewer flags the risk before anyone looks at the Terraform plan output.

**4. Make pipeline output descriptive.** Not just `error` or `passed` -- what happened, what it means, what to do next. The same standard you'd want for a newcomer reading logs for the first time. This is especially important for homegrown software and tools, which are often the first to become tribal knowledge rather than well-documented.

And then there's the naming. Our QA cluster is called "QA," which signals "safe to experiment on" to anyone outside the platform team. But for us, it's production-grade infrastructure. That label is a false signal too -- the same kind of false signal that started this whole mess. The solution -- a separate sandbox cluster where agents can operate with full autonomy and low risk, so that developer QA stays stable. Start restrictive, loosen with evidence. The better the agent proves itself, the more autonomy it earns.

The incident didn't make me less convinced about AI adoption. It made me more convinced -- and more honest about what our repos need to look like for engineers, security teams, and AI agents to all contribute safely.

We're not done. This is a conviction, not a result. The project exists, and the team is working on it. Not everyone agrees on the direction -- some colleagues still think the answer is tighter restrictions, more gates. I think that's solving the wrong problem. The green pipeline didn't lie because we lacked gates. It lied because it was built for one audience and read by another.
