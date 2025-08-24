#!/bin/sh
set -e

# Allow overriding socket path via env
: "${REACT_APP_SOCKETIO_PATH:=/socket}"

# Render nginx config from template
envsubst '${REACT_APP_SOCKETIO_PATH}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Start backend server in background
# It listens on 2500 as defined in dist/server/main.js
node /app/dist/server/main.js &

# Start nginx in foreground (PID 1)
exec nginx -g 'daemon off;'
