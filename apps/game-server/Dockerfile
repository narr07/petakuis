FROM oven/bun:1.3.14-alpine
WORKDIR /app

COPY package.json ./
COPY packages/shared ./packages/shared
COPY apps/game-server ./apps/game-server

RUN bun install

WORKDIR /app/apps/game-server
EXPOSE 3001
CMD ["bun", "src/index.ts"]
