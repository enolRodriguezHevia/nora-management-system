FROM node:18-alpine

WORKDIR /app

# Instalar OpenSSL para Prisma
RUN apk add --no-cache openssl

# Instalar dependencias
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar código fuente
COPY . .

# Generar cliente Prisma
RUN npx prisma generate

# Exponer puerto
EXPOSE 3001

# Script de arranque: migrar + seed + servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node src/index.js"]
