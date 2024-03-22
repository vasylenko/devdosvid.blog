FROM alpine:latest as builder
WORKDIR /hugo
ARG HUGO_VERSION
RUN wget -q -c \
    "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_Linux-64bit.tar.gz" \
    -O hugo.tag.gz
RUN tar -xzf hugo.tag.gz

FROM golang:1.22
COPY --from=builder /hugo/hugo /
WORKDIR /site
ENTRYPOINT ["/hugo"]

# docker run -v "$(pwd)":/site --expose 8080 -p 8080:8080 my-hugo server --bind 0.0.0.0 -p 8080 --baseURL http://127.0.0.1 --buildDrafts --buildFuture --environment development --gc --noHTTPCache --disableFastRender