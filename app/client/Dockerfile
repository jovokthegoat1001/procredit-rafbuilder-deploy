# Frontend (Vite/React static build) — used by docker-compose for LOCAL testing.
# On Netlify the frontend is built directly from source (see /netlify.toml); this
# image mirrors that split locally: nginx serves the static build and proxies /api
# to the backend container.
# Build context is app/client/.

# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- serve stage ----
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
