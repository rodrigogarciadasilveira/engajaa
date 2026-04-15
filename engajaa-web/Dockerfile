# ── Stage 1: build do React/Vite ─────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY engajaa-web/package*.json ./
RUN npm ci
COPY engajaa-web/ .

# VITE_API_URL é injetado como build arg pelo Railway
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: nginx servindo os arquivos estáticos ─────────────────────────────
FROM nginx:stable-alpine AS runner
COPY --from=build /app/dist /usr/share/nginx/html
COPY engajaa-web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
