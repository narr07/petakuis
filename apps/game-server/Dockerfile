FROM oven/bun:1.3.14-alpine
WORKDIR /app

# Semua package.json workspace ikut disalin supaya bun.lock cocok (--frozen-lockfile).
COPY package.json bun.lock ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
COPY apps/game-server/package.json apps/game-server/
RUN bun install --frozen-lockfile --ignore-scripts

COPY packages/shared packages/shared
COPY apps/game-server apps/game-server

WORKDIR /app/apps/game-server
ENV NODE_ENV=production
EXPOSE 3001
CMD ["bun", "src/index.ts"]
