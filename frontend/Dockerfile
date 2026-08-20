FROM node:22 AS test

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

FROM test AS build

RUN npm run build

FROM nginx:alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template

# The official nginx image's docker-entrypoint.sh runs envsubst on every
# *.template file under /etc/nginx/templates/ at container startup, using
# only the container's actual env vars as substitution candidates (nginx's
# own $uri/$document_root etc. are untouched since they aren't env vars).
# NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx makes the result land at
# /etc/nginx/nginx.conf, replacing the file this Dockerfile used to COPY
# directly. BACKEND_SERVICE picks which Kubernetes Service (staging
# "backend" vs production "backend-prod") the frontend proxies /api/ to;
# staging/local keep working via this default, production overrides it
# in frontend/manifests/production/deployment.yaml.
ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx
ENV BACKEND_SERVICE=backend

RUN chmod -R 777 /var/cache/nginx \
    && chmod -R 777 /var/run \
    && chmod -R 777 /usr/share/nginx/html \
    && chmod -R 777 /etc/nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]