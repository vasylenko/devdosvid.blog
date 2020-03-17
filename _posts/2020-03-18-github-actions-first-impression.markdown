---
layout: post
title: Github Actions - First impression
date: 2020-03-18 00:30:20 +0200
description: My first meet with github actions... in action. # Add post description (optional)
img:  posts/github-actions-logo.png # Add image post (optional)
fig-caption: # Add figcaption (optional)
tags: [github, automation, review]
---

## Wow!
Although Github Actions service is generally available since November 13, 2020, and there are about 243,000,000 results for "github actions" in Google search already, I have just reached it... :turtle:

It's half past midnight, it took me about 35 commits to make my first github automation work, but it finally works and this blog post was built and published automatically!

## Actions everywhere
One of the most (or maybe the most one) powerful things in Actions is ... Actions! Github made a simple but genius thing: they turned well-known snippets we do with pipelines into the marketplace of well-made (sometimes not) simple and complex applications you can use in your automation workflow. https://github.com/marketplace?type=actions
So now you can either re-invent your wheel or re-use someone else's code to make the needed workflow. 

As for me, in the beginning, I was going to use two actions for building a jekyll website and pushing it to gh-pages branch - there are a lot of actions available for such purpose. But then I decided to hack my brains a bit, and here is what I got in the result - looks not such elegant as it may look with actions but it is much simpler by design:

For build:
```yaml
{% raw %}
- name: Step#3 - build
run: |
    docker run \
    --user 1001 \
    -v $(pwd):/src \
    -w /src \
    ruby:2.6.4 \
    /bin/bash -c 'bundle install && bundle exec jekyll build --verbose --destination "_site"'
{% endraw %}
````
For push:
```yaml
{% raw %}
- name: Step#3 - push to gh-pages
run: |
    git config user.name "$GITHUB_ACTOR"
    git config user.email "${GITHUB_ACTOR}@bots.github.com"
    git add -A 
    git commit -a -m "updated GitHub Pages"
    git remote set-url origin "https://x-access-token:${{secrets.DEPLOY_TOKEN}}@github.com/vasylenko/serhii.vasylenko.info.git"
    git push --force-with-lease origin gh-pages
{% endraw %}
```



## Old good things made better
As usual, there are steps, where you make something; the steps form a job, which you can run in parallel with other jobs or conditionally; and the jobs form your workflow. But a lot of common things have been introduced with some sweet additions:

- you can also specify different environments for your jobs in the same workflow;
- you can use environment variables with a different visibility scope: either workflow, or job, or step;
- you can use cache for dependencies and reuse it between workflow runs while keeping workflow directory clean;
- you can trigger a workflow by repo events and have a quite complex conditional logic or filters (if needed), external webhooks and by a schedule;
- you can pass artifacts between jobs inside a workflow with ease - Github provides simple actions for this, so you don't need to dance around temporary directories or files;
- and much more

## Small disappointment 
There is no option to restart the workflow manually or restart its job. Also, there is no sandbox or any other way for testing - you have to commit to the repo each time when you need to check one or another change in the workflow.

I hope Github will figure out something to save us from this mess in the workflow events log:
![github actions events](/assets/img/posts/github-actions-events.png "github actions events"){:width="600px"}