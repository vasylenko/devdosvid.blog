If you forgot how to build html version of your cv, here you are:

```
docker run --rm --volume \"$(pwd)/cv:/data\" pandoc/latex --standalone -H head.html --from markdown --to html5 -o cv.html cv.md
```