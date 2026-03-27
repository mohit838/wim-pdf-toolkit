FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json ./
RUN pnpm install --no-frozen-lockfile

COPY next.config.ts tsconfig.json next-env.d.ts ./
COPY src ./src

ARG APP_DEV=true
ARG NEXT_PUBLIC_APP_DEV=true
ENV APP_DEV=${APP_DEV}
ENV NEXT_PUBLIC_APP_DEV=${NEXT_PUBLIC_APP_DEV}

RUN pnpm build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json ./
RUN pnpm install --prod --no-frozen-lockfile

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
