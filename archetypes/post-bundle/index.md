---
title: "{{ replace .Name "-" " " | title }}"
slug: "{{ .Name | urlize }}" # keep this unchanged when you modify the title or consult with google guides first
date: {{ .Date }}
summary: ~112 chars or ~22 words
description: ~112 chars or ~22 words
cover:
    image: cover.png
    relative: true
    alt:
draft: true
keywords: []
series: ""
---

