FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Variable de entorno para la URL de la API (configurable en build time)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Build de producción
RUN npm run build

# ── Servidor de producción con nginx ──────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración nginx para React Router (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
