# Development image for docker compose (Vite dev server with hot reload).
# Production serves the static `npm run build` output from any static host or CDN.
FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
