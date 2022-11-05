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

FROM node:18-alpine AS downloader
WORKDIR /app
COPY package.json .
COPY --from=build_downloader /app/build .
COPY --from=deps /app/node_modules ./node_modules
ARG uid=node
USER $uid

FROM node:18-alpine AS app
WORKDIR /app
COPY package.json .
COPY --from=build_app /app/build .
COPY --from=deps /app/node_modules ./node_modules
ARG uid=node
USER $uid
