# ── Stage 1: build the React app ─────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci --silent
COPY frontend/ .

# Inject the production API URL pointing to nginx (same origin)
ENV VITE_API_BASE_URL=/api
ENV VITE_OPTIMIZATION_URL=/optimize

RUN npm run build

# ── Stage 2: serve with nginx ─────────────────────────────────
FROM nginx:1.25-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom config
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copy built React app
COPY --from=builder /app/dist /usr/share/nginx/html

# Ensure nginx can write its pid/log files
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
