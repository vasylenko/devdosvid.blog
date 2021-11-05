#!/bin/zsh
if [[ $# -ne 1 || $# > 1 ]]; then
  echo "Usage example: $0 new-post-name"
  exit 1
fi
hugo new --kind post-bundle posts/$1