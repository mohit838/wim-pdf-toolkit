FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json ./
RUN pnpm install --no-frozen-lockfile

COPY tsconfig.json tsup.config.ts prisma.config.ts ./
COPY src ./src
COPY prisma ./prisma

RUN pnpm build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4100

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json ./
RUN pnpm install --prod --no-frozen-lockfile

COPY --from=build /app/dist ./dist
COPY src/defaults ./src/defaults

EXPOSE 4100

CMD ["node", "dist/server.js"]
