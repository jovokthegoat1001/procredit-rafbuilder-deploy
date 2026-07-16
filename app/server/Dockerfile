# Backend (Express API) — deployed to Railway, also used by docker-compose for local testing.
# Build context is app/server/.
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Install production deps first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# App source (see .dockerignore — node_modules and .env are excluded).
COPY . .

# Railway injects PORT at runtime; default to 8787 for local runs.
ENV PORT=8787
EXPOSE 8787

# Lightweight healthcheck against the API (Railway also probes the port).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8787)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "index.js"]
