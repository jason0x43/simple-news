FROM rust:alpine as build

# Install build environment
RUN apk add nodejs npm musl-dev
RUN npm i -g pnpm
RUN cargo install tsync
RUN cargo install sqlx-cli --no-default-features --features sqlite

# Install client dependencies
COPY app/package.json app/pnpm-lock.yaml /build/app/
WORKDIR /build/app
RUN pnpm i

# Create database for building
WORKDIR /build/server
ENV DATABASE_URL sqlite:///build/server/database.db
RUN cargo sqlx database create

# Download server dependencies
COPY server/Cargo.toml server/Cargo.lock /build/server/
WORKDIR /build/server
RUN cargo rm macros
RUN cargo fetch

# Build client
COPY app /build/app
WORKDIR /build/app
RUN pnpm build

# Build server
COPY server /build/server
WORKDIR /build/server
RUN cargo sqlx migrate run
RUN cargo build --release

FROM alpine
LABEL org.opencontainers.image.source=https://github.com/jason0x43/simple-news
LABEL org.opencontainers.image.description="A simple RSS news reader"
LABEL org.opencontainers.image.licenses="MIT"
COPY --from=build /build/server/target/release/simple-news /bin/simple-news
ENTRYPOINT ["/bin/simple-news"]
