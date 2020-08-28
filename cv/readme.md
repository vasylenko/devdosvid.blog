Build html version of cv:

```
docker run --rm --volume \"$(pwd)/cv:/data\" pandoc/latex --standalone -H head.html --from markdown --to html5 -o cv.html cv.md
```

More info:

mszep.github.io/pandoc_resume/ 

elipapa.github.io/markdown-cv/