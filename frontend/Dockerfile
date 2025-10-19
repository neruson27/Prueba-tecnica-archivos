FROM node:14-slim

WORKDIR /usr/src/app

# Instalar pm2 y una versión de serve compatible con CJS globalmente
RUN npm install -g pm2 serve@13

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Usar el archivo de configuración de ecosystem para iniciar el servicio
CMD ["pm2-runtime", "start", "ecosystem.config.js"]