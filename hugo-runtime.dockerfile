# Must be before the first FROM to be available in FROM instructions
ARG GO_VERSION=1.25
FROM alpine:3.23 AS builder
ARG HUGO_VERSION
ARG TARGETARCH
WORKDIR /hugo
RUN wget -q -c \
    "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-${TARGETARCH}.tar.gz" \
    -O hugo.tar.gz
RUN tar -xzf hugo.tar.gz

FROM golang:${GO_VERSION}
ARG HUGO_VERSION
ARG GO_VERSION
COPY --from=builder /hugo/hugo /
WORKDIR /site
ENTRYPOINT ["/hugo"]

LABEL org.opencontainers.image.source=https://github.com/vasylenko/devdosvid.blog
LABEL org.opencontainers.image.description="Official Hugo v${HUGO_VERSION} binary in Golang v${GO_VERSION} Image to run or build a hugo website."
LABEL org.opencontainers.image.licenses=MIT
