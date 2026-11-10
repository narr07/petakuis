FROM oven/bun:1.3.14-alpine
WORKDIR /app

COPY package.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

RUN bun install
WORKDIR /app/apps/web
RUN bun run build

EXPOSE 3000
CMD ["bun", ".output/server/index.mjs"]
