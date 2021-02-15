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
# What is it and how it works
You select needed files and/or folders, then right click on them, then click on Services menu item and select TinyPNG.

Then magic happens.

Magic: 

    A shell script that takes each selected file (or a file from selected folder) and sends it to TinyPNG image optimizer with a web request.
    Once processed, TinyPNG replies with the link, so the script could use it to download the file and store it near the original one.  

![](/assets/posts/2021-02-14-image-compression-with-tinypng-from-macos-contextual-menu/context_menu_full_compressed.gif)

# Creating Quick Action Workflow
![](/assets/posts/2021-02-14-image-compression-with-tinypng-from-macos-contextual-menu/quick_action_compressed.png)

# Workflow settings
**Workflow receives current** `files and folders` **in** `Finder`

**Shell** `/bin/zsh`

**Pass input** `as arguments`

Click the **Option** button at the bottom of the Action window and **Uncheck** `Show this action when the workflow runs` 

![](/assets/posts/2021-02-14-image-compression-with-tinypng-from-macos-contextual-menu/run_shell_script_compressed.png)

Put the following script into the **Run Shell Script** window, replacing *YOUR_API_KEY_HERE* string (second line of the script) with your valid API key obtained from TinyPNG 

```shell
export PATH="$PATH:/usr/local/bin"
APIKEY=YOUR_API_KEY_HERE
tinypng () {
	file_name="$1:t:r"
	file_ext="$1:t:e"
	file_dir="$1:h"
	compressed_url="$(curl -D - -o /dev/null --user api:$APIKEY --data-binary @"$1" https://api.tinify.com/shrink|grep location|cut -d ' ' -f 2|sed 's/\r//')"
	curl -o "${file_dir}/${file_name}_compressed.${file_ext}" "$compressed_url"
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

TODO:
explain why grep
explain why cut
explain why sed ( problem example: +./tinypng.sh:12> curl --output 1.png $'https://api.tinify.com/output/4m5jdajjrhweuqbdjdu7x669xda8zb79\C-M' )
explain why not with jq: because does not require you to install anything