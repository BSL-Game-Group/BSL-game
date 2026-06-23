FROM node:22 AS test

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

FROM test AS build

RUN npm run build

FROM nginx:alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]