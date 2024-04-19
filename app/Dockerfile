FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base as prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    --mount=source=package.json,target=package.json \
    --mount=source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    pnpm i --prod --frozen-lockfile

FROM base as build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    --mount=source=package.json,target=package.json \
    --mount=source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    pnpm i --frozen-lockfile

RUN --mount=source=package.json,target=package.json \
    --mount=source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=source=postcss.config.js,target=postcss.config.js \
    --mount=source=svelte.config.js,target=svelte.config.js \
    --mount=source=tailwind.config.ts,target=tailwind.config.ts \
    --mount=source=vite.config.ts,target=vite.config.ts \
    --mount=source=tsconfig.json,target=tsconfig.json \
    --mount=source=static,target=static \
    --mount=source=src,target=src \
    pnpm build

# FROM node:20-slim
FROM node:20
WORKDIR /app
COPY --from=build /app/build build/
COPY --from=prod-deps /app/node_modules node_modules/
COPY package.json .
EXPOSE 3000
ENV NODE_ENV=production
CMD [ "node", "build" ]
