ARG GO_VER
FROM alpine:latest as builder
ARG HUGO_VERSION
WORKDIR /hugo
RUN arch=$(uname -m) && \
    if [ "$arch" = "aarch64" ] || [ "$arch" = "arm64" ]; then \
    wget -q -c "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-arm64.tar.gz" -O hugo.tar.gz; \
    else \
    wget -q -c "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz" -O hugo.tar.gz; \
    fi
RUN tar -xzf hugo.tar.gz

FROM golang:${GO_VER}-alpine
ARG GO_VER
ARG HUGO_VERSION
COPY --from=builder /hugo/hugo /
WORKDIR /site
ENTRYPOINT ["/hugo"]

LABEL org.opencontainers.image.source=https://github.com/vasylenko/devdosvid.blog
LABEL org.opencontainers.image.description="Official Hugo v${HUGO_VERSION} binary in Golang v${GO_VER} Image to run or build a hugo website."
LABEL org.opencontainers.image.licenses=MIT