[![Website](https://github.com/vasylenko/serhii.vasylenko.info/actions/workflows/website.yaml/badge.svg?branch=main)](https://github.com/vasylenko/serhii.vasylenko.info/actions/workflows/website.yaml)
### Personal blog powered by Jekyll

Slightly modified Jekyll theme (see links below) with automatic build and deployment to Github Pages.

Build and deploy are automated by Github Actions – [.github/workflows/website.yaml](.github/workflows/website.yaml).

Once website is built, its file go to `gh-pages` branch which is configured for Github Pages.

### Markdown CV with rendering to HTML

Base directory – [cv](cv).

"source code" for the CV is a Markdown file which is rendered by pandoc utility. Font, layout and other customizations are made in .css file, as ususally. There are no customizations to renderigng.

Build and deploy are automated by Github Actions – [.github/workflows/cv.yaml](.github/workflows/cv.yaml).

Deploy goes to the same gh-pages branch.

### Technologies used: 

- Jekyll static website generator - https://jekyllrb.com
- Source theme - Chirpy https://github.com/cotes2020/jekyll-theme-chirpy/
- Pandoc document converter - https://pandoc.org and https://hub.docker.com/r/pandoc/latex
- Github Pages and Github Actions