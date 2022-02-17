#!/bin/zsh
git submodule update --init --recursive
git submodule update --remote --merge
bindip=$(ipconfig getifaddr en0)
hugo server --baseURL http://${bindip} --buildDrafts --buildFuture --environment development --gc --noHTTPCache --bind ${bindip} --quiet