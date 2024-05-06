FROM rust:bookworm as base

ARG APP_ORG=jason0x43
ARG APP_NAME=simple-news

WORKDIR /build/server

FROM base AS deps
# Install build environment
RUN cargo install sqlx-cli --no-default-features --features postgres

FROM base AS builder
# Build server
RUN --mount=source=Cargo.lock,target=Cargo.lock \
    --mount=source=Cargo.toml,target=Cargo.toml \
    --mount=source=.sqlx,target=.sqlx \
    --mount=source=macros,target=macros \
    --mount=source=migrations,target=migrations \
    --mount=source=public,target=public \
    --mount=source=src,target=src \
    --mount=type=cache,target=/build/server/target/ \
    --mount=type=cache,target=/usr/local/cargo/registry/ \
    <<EOF
set -e
cargo build --locked --release
cp ./target/release/$APP_NAME /build/server
EOF

FROM debian:bookworm-slim as runner
LABEL org.opencontainers.image.source=https://github.com/$APP_ORG/$APP_NAME
LABEL org.opencontainers.image.description="A simple RSS news reader"
LABEL org.opencontainers.image.licenses="MIT"
RUN apt-get update && apt-get install -y extra-runtime-dependencies & rm -rf /var/lib/apt/lists/*
COPY entrypoint.sh /bin/
COPY --from=deps /usr/local/cargo/bin/sqlx /bin/
COPY --from=builder /build/server/$APP_NAME /bin/
ENTRYPOINT ["/bin/entrypoint.sh"]
