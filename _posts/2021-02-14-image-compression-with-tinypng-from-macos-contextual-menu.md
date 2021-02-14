---
layout: post
title: Using TinyPNG Image Compression From MacOS Finder Contextual Menu
subtitle: I just wanted to compress one image, but went to far...
description: How to add TinyPNG image compression to your macOS Finder contextual menu
image: 
date: 2021-02-14
tags: [macos, automation, fun]
category: [Technical Blogs]
---
# TL;DR in one picture:

![](/assets/posts/2021-02-14-image-compression-with-tinypng-from-macos-contextual-menu/context_menu_full_compressed.png)

# Creating Quick Action Workflow
![](/assets/posts/2021-02-14-image-compression-with-tinypng-from-macos-contextual-menu/quick_action_compressed.png)

# Workflow settings
**Workflow receives current** `files and folders` **in** `Finder`

**Shell** `/bin/zsh`

**Pass input** `as arguments`

Click the **Option** button at the bottom of the Action window and **Uncheck** `Show this action when the workflow runs` 

![](/assets/posts/2021-02-14-image-compression-with-tinypng-from-macos-contextual-menu/run_shell_script_compressed.png)

You need to have `jq` utility installed to make this script work. You can do it using homebrew, for instance.

This installation should be done only once, you don't need to add this into the script.
```shell
brew install jq
```

```shell
set -e -o pipefail
export PATH="$PATH:/usr/local/bin"
APIKEY=YOUR_API_KEY_HERE
tinypng () {
	file_name="$1:t:r"
	file_ext="$1:t:e"
	file_dir="$1:h"
	compressed_url=$(curl -s -H "Accept: application/json" -H "Content-type: application/json" --user api:$APIKEY --data-binary @"$1" https://api.tinify.com/shrink |jq -r .output.url)
	curl -s --output "${file_dir}/${file_name}_compressed.${file_ext}" "$compressed_url"
}

for f in "$@"
do
	if [ -f "$f" ]; then
		tinypng "$f"
	elif [ -d "$f" ]; then
		find "$f" -name "*.png" -o -name "*.jpeg" -o -name "*.jpg" | while read file_name; do
		tinypng "$file_name"; done
	fi
done
```

I've added the `sleep 1` command for the sake of 