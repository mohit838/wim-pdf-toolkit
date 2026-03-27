FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG APP_DEV=true
ARG NEXT_PUBLIC_APP_DEV=true
ARG DEV_INTERNAL_API_ORIGIN="http://localhost:8000"
ARG PROD_INTERNAL_API_ORIGIN="http://pdf-toolkit-backend:8000"
ARG NEXT_PUBLIC_DEV_SITE_ORIGIN="http://localhost:3000"
ARG NEXT_PUBLIC_PROD_SITE_ORIGIN="https://app.example.com"
ENV APP_DEV=${APP_DEV}
ENV NEXT_PUBLIC_APP_DEV=${NEXT_PUBLIC_APP_DEV}
ENV DEV_INTERNAL_API_ORIGIN=${DEV_INTERNAL_API_ORIGIN}
ENV PROD_INTERNAL_API_ORIGIN=${PROD_INTERNAL_API_ORIGIN}
ENV NEXT_PUBLIC_DEV_SITE_ORIGIN=${NEXT_PUBLIC_DEV_SITE_ORIGIN}
ENV NEXT_PUBLIC_PROD_SITE_ORIGIN=${NEXT_PUBLIC_PROD_SITE_ORIGIN}

RUN pnpm build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
