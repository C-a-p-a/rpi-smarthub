#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Start Flask API server in background
cd "$PROJECT_ROOT/server"
python3 app.py &
FLASK_PID=$!

# Start static file server for frontend
cd "$PROJECT_ROOT/public"
python3 -m http.server 3000 &
HTTP_PID=$!

echo "Started Flask API (PID: $FLASK_PID) on port 5000"
echo "Started HTTP server (PID: $HTTP_PID) on port 3000"
echo "Access dashboard at http://localhost:3000"

# Wait for both processes
wait $FLASK_PID $HTTP_PID
