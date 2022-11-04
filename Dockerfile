FROM node:18-alpine AS base
RUN corepack enable pnpm
WORKDIR /app
COPY pnpm-lock.yaml .

FROM base AS build
RUN pnpm fetch
COPY . .
RUN pnpm install --offline --ignore-scripts
ARG base_url=
ENV BASE_URL=$base_url
RUN pnpm build

FROM base as app
RUN pnpm fetch --prod
COPY --from=build /app/package.json .
COPY --from=build /app/build .
RUN pnpm install --offline --prod --ignore-scripts
