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
