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
RUN --mount=source=app/package.json,target=package.json \
    --mount=source=app/pnpm-lock.yaml,target=pnpm-lock.yaml \
    pnpm i
RUN --mount=source=app/index.html,target=index.html \
    --mount=source=app/package.json,target=package.json \
    --mount=source=app/pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=source=app/postcss.config.js,target=postcss.config.js \
    --mount=source=app/public,target=public \
    --mount=source=app/src,target=src \
    --mount=source=app/svelte.config.js,target=svelte.config.js \
    --mount=source=app/tailwind.config.js,target=tailwind.config.js \
    --mount=source=app/tsconfig.json,target=tsconfig.json \
    --mount=source=app/tsconfig.node.json,target=tsconfig.node.json \
    --mount=source=app/vite.config.ts,target=vite.config.ts \
    pnpm build

# Build server
WORKDIR /build/server
ENV DATABASE_URL sqlite:///build/server/database.db
RUN cargo sqlx database create
RUN --mount=source=server/migrations,target=migrations cargo sqlx migrate run
RUN --mount=source=server/Cargo.lock,target=Cargo.lock \
    --mount=source=server/Cargo.toml,target=Cargo.toml \
    --mount=source=server/macros,target=macros \
    --mount=source=server/migrations,target=migrations \
    --mount=source=server/public,target=public \
    --mount=source=server/src,target=src \
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
