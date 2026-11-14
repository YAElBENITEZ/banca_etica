FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
# Copia la compilación generada por Vite
COPY --from=build /app/dist /usr/share/nginx/html

# Reemplaza la configuración predeterminada de Nginx con la nuestra
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]