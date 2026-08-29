#!/bin/zsh

set -e

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

PROJECT_DIR="${0:A:h}"
PREVIEW_PORT=8080

while lsof -nP -iTCP:"$PREVIEW_PORT" -sTCP:LISTEN >/dev/null 2>&1; do
  PREVIEW_PORT=$((PREVIEW_PORT + 1))
  if [ "$PREVIEW_PORT" -gt 8090 ]; then
    echo "No free preview port was found between 8080 and 8090."
    read "REPLY?Press Return to close..."
    exit 1
  fi
done

PREVIEW_URL="http://127.0.0.1:${PREVIEW_PORT}/today"

cd "$PROJECT_DIR"
clear 2>/dev/null || true

echo "My Daily Flow — local preview"
echo "Sign-in is temporarily hidden in this local preview."
echo ""

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js is required to run this preview."
  echo "Install it from https://nodejs.org and open this file again."
  echo ""
  read "REPLY?Press Return to close..."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Preparing the app for the first preview..."
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
VITE_SKIP_AUTH=true npm run dev -- --host 127.0.0.1 --port "$PREVIEW_PORT" --strictPort &
SERVER_PID=$!

cleanup() {
  if kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

for attempt in {1..60}; do
  if curl --silent --fail "$PREVIEW_URL" >/dev/null 2>&1; then
    open "$PREVIEW_URL"
    echo ""
    echo "Preview opened in your browser:"
    echo "$PREVIEW_URL"
    echo ""
    echo "Keep this window open while viewing the app."
    echo "Press Control+C here when you are finished."
    wait "$SERVER_PID"
    exit $?
  fi

  if ! kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    echo ""
    echo "The preview could not start. Review the message above."
    read "REPLY?Press Return to close..."
    exit 1
  fi

  sleep 1
done

echo ""
echo "The preview took too long to start."
read "REPLY?Press Return to close..."
exit 1
