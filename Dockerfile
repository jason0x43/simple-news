FROM node:18-alpine AS base
WORKDIR /app
RUN npm i --location=global pnpm

FROM base AS dev
ENV NODE_ENV development
COPY package.json pnpm-lock.yaml ./
RUN pnpm fetch
ADD . ./
RUN pnpm install --offline --ignore-scripts

FROM dev AS build
ENV NODE_ENV production
RUN pnpm build

FROM base AS prod
COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-lock.yaml ./
COPY --from=build /app/build ./
ENV NODE_ENV production
RUN pnpm fetch --prod
RUN pnpm install --offline --prod --ignore-scripts
CMD ["node", "./index.js"]
