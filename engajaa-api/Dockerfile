# ── Stage 1: build completo (gera Prisma Client) ─────────────────────────────
FROM node:20-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate

# ── Stage 2: imagem de produção ───────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src ./src
COPY --from=build /app/package*.json ./

EXPOSE 3002

# Aplica migrations e sobe a API
CMD ["sh", "-c", "npx prisma migrate deploy && node src/app.js"]
