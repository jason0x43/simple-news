FROM node:18-alpine AS prebuild
RUN corepack enable pnpm
WORKDIR /app
COPY pnpm-lock.yaml .
RUN pnpm fetch
COPY . .
RUN pnpm install --offline --ignore-scripts

FROM prebuild AS build
ARG base_url=
ENV BASE_URL=$base_url
RUN pnpm build

FROM node:18-alpine as prod
RUN corepack enable pnpm
WORKDIR /app
COPY pnpm-lock.yaml .
RUN pnpm fetch --prod
COPY --from=build /app/package.json .
COPY --from=build /app/build .
RUN pnpm install --offline --prod --ignore-scripts
