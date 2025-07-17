# Etapa de construcción
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias (incluidas las de desarrollo)
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Compilar el código TypeScript a JavaScript
RUN npm run build

# Etapa de producción
FROM node:18-alpine

WORKDIR /app

# Copiar solo las dependencias de producción desde la etapa de construcción
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Instalar solo las dependencias de producción
RUN npm ci --only=production

# Copiar los archivos compilados desde la etapa de construcción
COPY --from=builder /app/dist ./dist

# Puerto expuesto
EXPOSE 3000

# Comando para arrancar la aplicación
CMD ["node", "dist/index.js"]
