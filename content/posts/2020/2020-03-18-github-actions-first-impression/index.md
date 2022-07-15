---
date: "2020-03-18T00:30:20Z"
description: My first meet with github actions... in action.
summary: My first meet with github actions... in action.
tags: ["github","automation"]
title: Github Actions - First impression
aliases: ["/2020/03/18/github-actions-first-impression.html"]
cover:
    image: cover-image.png
    relative: true
---
Although Github Actions service is generally available since November 13, 2020, and there are about 243,000,000 results for "github actions" in Google search already, I have just reached it...

It's half past midnight, it took me about 35 commits to make my first github automation work, but it finally works and this blog post was built and published automatically!

### Actions everywhere
One of the most (or maybe the most one) powerful things in Actions is ... Actions! Github made a simple but genius thing: they turned well-known snippets (we do with pipelines) into the marketplace of well-made (sometimes not) simple and complex applications you can use in your automation workflow. [https://github.com/marketplace?type=actions](https://github.com/marketplace?type=actions)

So now you can either re-invent your wheel or re-use someone else's code to make the needed automation. 

I decided to automate publications to this blog via Actions in order to have some practice. 

There are two workflows: one for the blog (website), and one for the CV (cv). 

- [actions/checkout@v2](https://github.com/actions/checkout)
- [actions/upload-artifact@v2](https://github.com/actions/upload-artifact)
- [actions/download-artifact@v2](https://github.com/actions/download-artifact)

In both workflows, the build job is performed within a container, which is different per workflow: Ruby for the blog and Pandoc for CV.

Here is how the build job looks like for the blog:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    container:
      image: ruby:2.6.4
      options: 
        --workdir /src 
    steps:
      - name: Checkout
        uses: actions/checkout@v2 

      - name: Build blog
        run: |
          bundle install
          bundle exec jekyll build --verbose --destination _site

      - name: Upload artifacts
        uses: actions/upload-artifact@v2
        with: 
          name: _site
          path: _site
```

As you can see, I run the steps within the Ruby container. This simplifies things related to file permissions and directory mounting because checkout is made inside the container.

The deploy step is performed via shell run command for now, for better clearness (can be replaced to third-party action or custom-made one): it makes a commit to gh-pages branch which is configured for Github Pages.

```yaml
deploy:
    if: github.ref == 'refs/heads/master'
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout gh-pages branch
        uses: actions/checkout@v2
        with:
          ref: 'gh-pages'

      - name: Get the build artifact
        uses: actions/download-artifact@v2
        with:
          name: _site
          path: ./

      - name: Deploy (push) to gh-pages
        run: |
          git config user.name "$GITHUB_ACTOR"
          git config user.email "${GITHUB_ACTOR}@bots.github.com"
          git add -A 
          git commit -a -m "Updated Website"
          git remote set-url origin "https://x-access-token:${{ secrets.DEPLOY_TOKEN }}@github.com/vasylenko/serhii.vasylenko.info.git"
          git push --force-with-lease origin gh-pages
```
{{<figure src="2020-03-18-github-actions-first-impression_github-actions-events.png">}}

### Old good things made better
A lot of common things have been introduced to GitHubActions with some sweet additions:

- you can also specify different environments for your jobs in the same workflow;
- you can use environment variables with a different visibility scope: either workflow, or job, or step;
- you can use cache for dependencies and reuse it between workflow runs while keeping workflow directory clean;
- you can trigger a workflow by repo events and have a quite complex conditional logic or filters (if needed), external webhooks and by a schedule;
- you can pass artifacts between jobs inside a workflow with ease - Github provides simple actions for this, so you don't need to dance around temporary directories or files;
- and much more