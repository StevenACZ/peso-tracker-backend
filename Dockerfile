FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Puerto expuesto
EXPOSE 3000

# Comando para arrancar el backend
CMD ["node", "src/index.js"]
