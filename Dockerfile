# Stage 1: Build
FROM node:18-alpine AS build
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el código fuente
COPY . .

# Build de producción (ignorando errores de TypeScript)
RUN npm run build -- --mode production || npm run build:force

# Stage 2: Production
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

RUN rm -rf ./*

# Para Vite usa /app/dist
COPY --from=build /app/dist .

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]