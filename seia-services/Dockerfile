# ==============================================================================
# SEIA Backend (seia-services) - Dockerfile con Node.js 22 Alpine
# (Requerido por @supabase/supabase-js para soporte nativo de WebSocket)
# ==============================================================================
FROM node:22-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar manifiestos de paquetes e instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar configuración TypeScript y código fuente
COPY tsconfig.json ./
COPY src ./src

# Copiar artefactos de especificación OpenSpec y contratos OpenAPI para Swagger UI (/api-docs)
COPY openspec ./openspec
COPY openapi.json ./openapi.json
COPY openapi.yaml ./openapi.yaml

# Compilar el proyecto TypeScript a JavaScript en ./dist
RUN npm run build

# Variables de entorno por defecto y puerto expuesto
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Comando de inicio del servidor Express compilado
CMD ["node", "dist/index.js"]
