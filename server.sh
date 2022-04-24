#!/bin/zsh
git submodule update --init --recursive
git submodule update --remote --merge
if [[ $1 == "localhost" ]]
then
    bindip=localhost
else
    bindip=$(ipconfig getifaddr en0)
fi
hugo server  --bind ${bindip} --baseURL http://${bindip} --buildDrafts --buildFuture --environment development --gc --noHTTPCache --quiet