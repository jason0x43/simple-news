FROM rust:bookworm as builder

ARG APP_ORG=jason0x43
ARG APP_NAME=simple-news

# Install build environment
RUN apt-get update && apt-get install -y nodejs npm
RUN npm i -g pnpm
RUN cargo install tsync
RUN cargo install sqlx-cli --no-default-features --features sqlite

# Build client
WORKDIR /build/app
RUN --mount=type=bind,source=app/package.json,target=package.json \
    --mount=type=bind,source=app/pnpm-lock.yaml,target=pnpm-lock.yaml \
    pnpm i
RUN --mount=type=bind,source=app/package.json,target=package.json \
    --mount=type=bind,source=app/pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=bind,source=app/svelte.config.js,target=svelte.config.js \
    --mount=type=bind,source=app/tsconfig.json,target=tsconfig.json \
    --mount=type=bind,source=app/tsconfig.node.json,target=tsconfig.node.json \
    --mount=type=bind,source=app/vite.config.ts,target=vite.config.ts \
    --mount=type=bind,source=app/index.html,target=index.html \
    --mount=type=bind,source=app/public,target=public \
    --mount=type=bind,source=app/src,target=src \
    pnpm build

# Build server
WORKDIR /build/server
ENV DATABASE_URL sqlite:///build/server/database.db
RUN cargo sqlx database create
RUN --mount=type=bind,source=server/migrations,target=migrations \
    cargo sqlx migrate run
RUN --mount=type=bind,source=server/src,target=src \
    --mount=type=bind,source=server/public,target=public \
    --mount=type=bind,source=server/migrations,target=migrations \
    --mount=type=bind,source=server/macros,target=macros \
    --mount=type=bind,source=server/Cargo.toml,target=Cargo.toml \
    --mount=type=bind,source=server/Cargo.lock,target=Cargo.lock \
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
COPY --from=builder /usr/local/cargo/bin/sqlx /bin/
COPY --from=builder /build/server/$APP_NAME /bin/
ENTRYPOINT ["/bin/entrypoint.sh"]
