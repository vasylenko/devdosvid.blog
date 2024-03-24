FROM alpine:latest as builder
ARG HUGO_VERSION
WORKDIR /hugo
RUN wget -q -c \
    "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_Linux-64bit.tar.gz" \
    -O hugo.tag.gz
RUN tar -xzf hugo.tag.gz

FROM golang:1.22
ARG HUGO_VERSION
COPY --from=builder /hugo/hugo /
WORKDIR /site
ENTRYPOINT ["/hugo"]

LABEL org.opencontainers.image.source=https://github.com/vasylenko/devdosvid.blog
LABEL org.opencontainers.image.description="Official Hugo v${HUGO_VERSION} binary in Golang v1.22 Image to run or build a hugo website."
LABEL org.opencontainers.image.licenses=MIT