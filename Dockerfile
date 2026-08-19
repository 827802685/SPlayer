# ── Build Stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk update && apk add --no-cache git

WORKDIR /app

COPY package*.json ./
RUN npm install pnpm -g
RUN pnpm install --frozen-lockfile

COPY . .
RUN [ ! -e ".env" ] && cp .env.example .env || true
RUN pnpm run build

# ── Production Stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS app

# Install system dependencies
RUN apk update && apk add --no-cache nginx supervisor curl ca-certificates && \
    rm -rf /var/cache/apk/* && \
    update-ca-certificates

# Install global Node.js dependencies for the backend
RUN npm install -g crypto-js express cors express-rate-limit

WORKDIR /app

# Copy built frontend
COPY --from=builder /app/out/renderer /usr/share/nginx/html

# Copy backend server
COPY server/ /app/server/

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Configure supervisor to manage both nginx and the Node backend
RUN mkdir -p /etc/supervisor.d && \
    cat > /etc/supervisor.d/nginx.ini <<'EOF'
[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
stdout_logfile=/var/log/nginx.out.log
stderr_logfile=/var/log/nginx.err.log
priority=10
EOF

RUN cat > /etc/supervisor.d/splayer.ini <<'EOF'
[program:splayer]
command=node /app/server/index.js 3000
directory=/app
autostart=true
autorestart=true
stdout_logfile=/var/log/splayer.out.log
stderr_logfile=/var/log/splayer.err.log
stdout_logfile_maxbytes=10MB
stderr_logfile_maxbytes=10MB
priority=20
EOF

EXPOSE 7899

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV LOG_LEVEL=warn
ENV SESSION_TTL_MS=86400000
ENV MAX_SESSIONS=10000

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor.d/"]
