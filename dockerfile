###############################################
# Multi-stage build: build client and server   #
# Runtime: Nginx serves client on :2600 and    #
# proxies Socket.IO (/socket) to Node on 2500  #
###############################################

# ---------- Builder ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package.json .
# If you have a lockfile, uncomment and copy it too for reproducible builds
# COPY package-lock.json ./

RUN npm install

# Copy source
COPY . .

# Ensure .env exists for build (webpack/Node scripts expect it)
# Default to /socket for Socket.IO path — can be overridden at build time
ENV REACT_APP_SOCKETIO_PATH=/socket \
	NODE_ENV=production

# If .env is missing, create it from example
RUN [ -f .env ] || cp .env.example .env

# Build client (webpack) and server/shared (swc)
RUN npm run build


# ---------- Runtime ----------
FROM node:20-alpine AS runtime

WORKDIR /app

# Install Nginx and envsubst
RUN apk add --no-cache nginx gettext

# Install only runtime node deps (no dev)
COPY package.json .
# COPY package-lock.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy built artifacts
COPY --from=builder /app/dist /app/dist

# Nginx web root for SPA
RUN mkdir -p /usr/share/nginx/html
COPY --from=builder /app/dist/client /usr/share/nginx/html

# Nginx config template and entrypoint
COPY docker/nginx.conf.template /etc/nginx/nginx.conf.template
COPY docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
	&& mkdir -p /var/cache/nginx /var/run/nginx

# Default envs (can be overridden at runtime)
ENV REACT_APP_SOCKETIO_PATH=/socket \
	NODE_ENV=production

EXPOSE 2600

# Start Node backend (2500) and Nginx (2600)
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

