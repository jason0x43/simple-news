FROM node:20 AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /src
WORKDIR /src
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm i --frozen-lockfile
RUN pnpm run -r build
RUN pnpm deploy --filter=@jason0x43/simple-news-app --prod /build/app
RUN pnpm deploy --filter=@jason0x43/simple-news-server --prod /build/server

FROM node:20-slim as app
LABEL org.opencontainers.image.source=https://github.com/jason0x43/simple-news
LABEL org.opencontainers.image.description="A simple RSS news reader"
LABEL org.opencontainers.image.licenses="MIT"
COPY --from=build /build/app /app
WORKDIR /app
EXPOSE 3000
ENV NODE_ENV=production
CMD [ "node", "." ]

FROM node:20-slim as server
LABEL org.opencontainers.image.source=https://github.com/jason0x43/simple-news
LABEL org.opencontainers.image.description="A simple RSS news reader"
LABEL org.opencontainers.image.licenses="MIT"
COPY --from=build /build/server /server
WORKDIR /server
EXPOSE 3000
ENV NODE_ENV=production
CMD [ "node", "." ]
