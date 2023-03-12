FROM node:18-alpine AS base
RUN corepack enable pnpm
WORKDIR /app
COPY pnpm-lock.yaml .

FROM base as deps
RUN pnpm fetch --prod
COPY package.json .
RUN pnpm install --offline --prod --ignore-scripts

FROM base AS build
RUN pnpm fetch
COPY package.json .
RUN pnpm install --offline --ignore-scripts
ARG base_url=
ENV BASE_URL=$base_url
COPY . .
RUN pnpm build

FROM alpine:3.16 AS app
RUN apk add --update nodejs-current
WORKDIR /app
COPY package.json .
COPY --from=build /app/build .
COPY --from=deps /app/node_modules ./node_modules
COPY migrations migrations
