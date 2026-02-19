#!/bin/zsh

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <post title>"
  echo ""
  echo "Examples:"
  echo "  $0 My Great Blog Post"
  echo "  $0 My Great Blog Post: About AWS!"
  echo "  $0 my-great-blog-post"
  exit 1
fi

title="$*"
year=$(date +%Y)
slug=$(echo "$title" | tr '[:upper:]' '[:lower:]' | tr -cs '[:alnum:]' '-' | sed 's/^-*//;s/-*$//')
path="posts/${year}/${slug}"

/opt/homebrew/bin/hugo new content -k post-bundle "$path"

# Replace Hugo's auto-generated title (derived from slug) with the original input
index_file="content/${path}/index.md"
escaped_title=$(printf '%s' "$title" | sed 's/&/\\&/g')
sed -i '' "s|^title: \".*\"|title: \"${escaped_title}\"|" "$index_file"

echo ""
echo "Post created: ${index_file}"
