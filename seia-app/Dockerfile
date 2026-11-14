# ==============================================================================
# SEIA Frontend (seia-app) - Dockerfile Multi-Stage con Node.js 20 Alpine
# ==============================================================================

# Etapa 1: Instalación de dependencias (deps)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# Etapa 2: Construcción de la aplicación Next.js en modo standalone (builder)
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Argumentos de compilación (build args) para variables públicas de Next.js
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_SUPABASE_URL=https://ypbcxctawmwfovusbive.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable___a9Pc74iqkqGOwpgdE-7Q_GOp0PKX8

# Variables de entorno expuestas durante npm run build
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_TELEMETRY_DISABLED=1

RUN mkdir -p public
RUN npm run build

# Etapa 3: Imagen ligera de ejecución en producción (runner)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copiar artefactos generados por output: 'standalone'
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
