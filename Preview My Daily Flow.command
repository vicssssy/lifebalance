#!/bin/zsh

set -e

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

PROJECT_DIR="${0:A:h}"
APP_PORT=8080

while lsof -nP -iTCP:"$APP_PORT" -sTCP:LISTEN >/dev/null 2>&1; do
  APP_PORT=$((APP_PORT + 1))
  if [ "$APP_PORT" -gt 8090 ]; then
    echo "No free app port was found between 8080 and 8090."
    read "REPLY?Press Return to close..."
    exit 1
  fi
done

APP_URL="http://127.0.0.1:${APP_PORT}/today"

cd "$PROJECT_DIR"
clear 2>/dev/null || true

echo "My Daily Flow — Cloudflare D1 local preview"
echo "The app opens directly without sign-in and uses a private local D1 workspace."
echo ""

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js is required to run this app."
  echo "Install it from https://nodejs.org and open this file again."
  echo ""
  read "REPLY?Press Return to close..."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Preparing the app for the first launch..."
  if command -v bun >/dev/null 2>&1; then
    bun install --frozen-lockfile
  else
    npm install \
      --userconfig=/dev/null \
      --registry=https://registry.npmjs.org/ \
      --no-package-lock
  fi
  echo ""
fi

echo "Starting My Daily Flow..."
echo "Building the app..."
npm run build
echo "Preparing the local D1 database..."
./node_modules/.bin/wrangler d1 migrations apply lifebalance-db --local
./node_modules/.bin/wrangler dev --local --ip 127.0.0.1 --port "$APP_PORT" &
SERVER_PID=$!

cleanup() {
  if kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

for attempt in {1..60}; do
  if curl --silent --fail "$APP_URL" >/dev/null 2>&1; then
    open "$APP_URL"
    echo ""
    echo "App opened in your browser:"
    echo "$APP_URL"
    echo ""
    echo "Keep this window open while viewing the app."
    echo "Press Control+C here when you are finished."
    wait "$SERVER_PID"
    exit $?
  fi

  if ! kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    echo ""
    echo "The app could not start. Review the message above."
    read "REPLY?Press Return to close..."
    exit 1
  fi

  sleep 1
done

echo ""
echo "The app took too long to start."
read "REPLY?Press Return to close..."
exit 1
