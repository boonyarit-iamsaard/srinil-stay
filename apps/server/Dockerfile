FROM docker.io/node:24-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN corepack enable

FROM base AS prune

COPY . .

RUN pnpm dlx turbo@2.9.16 prune server --docker

FROM base AS build

COPY --from=prune /app/out/json/ .
COPY --from=prune /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile

COPY --from=prune /app/out/full/ .

RUN pnpm turbo run build --filter=server
RUN pnpm --filter server deploy --prod --legacy /prod/server
RUN cp -R apps/server/dist /prod/server/dist

FROM docker.io/node:24-alpine AS runtime

ENV NODE_ENV="production"

WORKDIR /app

COPY --from=build /prod/server ./

EXPOSE 4000

CMD ["node", "dist/index.mjs"]
