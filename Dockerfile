FROM node:18-alpine AS base
RUN corepack enable pnpm
WORKDIR /app
COPY pnpm-lock.yaml .

FROM base as deps
COPY package.json .
RUN pnpm fetch --prod
RUN pnpm install --offline --prod --ignore-scripts

FROM base AS prebuild
RUN pnpm fetch
COPY . .
RUN pnpm install --offline --ignore-scripts

FROM prebuild as build_downloader
RUN pnpm build:downloader

FROM prebuild as build_app
ARG base_url=
ENV BASE_URL=$base_url
RUN pnpm build
RUN pnpm migrate

FROM alpine:3.16 AS downloader
RUN apk add --update nodejs-current
WORKDIR /app
COPY package.json .
COPY --from=build_downloader /app/build .
COPY --from=deps /app/node_modules ./node_modules

FROM alpine:3.16 AS app
RUN apk add --update nodejs-current
WORKDIR /app
COPY package.json .
COPY --from=build_app /app/build .
COPY --from=deps /app/node_modules ./node_modules
