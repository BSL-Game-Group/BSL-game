FROM node:22 AS build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build


FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

RUN chmod -R 777 /var/cache/nginx \
    && chmod -R 777 /var/run \
    && chmod -R 777 /usr/share/nginx/html \
    && chmod -R 777 /etc/nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]