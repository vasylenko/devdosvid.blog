#!/bin/zsh
git submodule update --init --recursive
git submodule update --remote --merge

bindip=$(ipconfig getifaddr en0)
site_env=development

for arg in "$@"
do
case $arg in
    localhost)
    bindip=localhost
    shift
    ;;
    production)
    site_env=production
    shift
    ;;
    development)
    site_env=development
    shift
    ;;
    *)
    # unknown option
    echo -e "Unknown option $arg"
    exit 2
    ;;
esac
done
hugo server  --bind ${bindip} --baseURL http://${bindip} --buildDrafts --buildFuture --environment $site_env --gc --noHTTPCache --quiet