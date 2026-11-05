#!/bin/bash
# =============================================================================
# Next.js Dev Server Auto-Restart Script
# =============================================================================
# Purpose: Automatically restart the Next.js dev server when Turbopack exits
#          silently (common issue with Next.js 16 + Turbopack)
#
# Prerequisites:
#   - nvm installed and configured (or Node.js 20+ in PATH)
#   - Project in /home/smart/Documents/PROJECT/ZANmetropolitano/lms_front
#
# Usage:
#   chmod +x dev-restart.sh
#   ./dev-restart.sh
#
# Press Ctrl+C to stop the script (server will finish its current cycle)
# =============================================================================

echo "================================================================="
echo "Next.js Dev Server Auto-Restart Script"
echo "================================================================="
echo ""
echo "Turbopack instability note: Next.js 16.2.6 Turbopack may exit"
echo "silently after showing 'Ready in X ms'. This script auto-restarts."
echo ""

# Set up nvm if available
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  \. "$NVM_DIR/nvm.sh"
fi

# Use Node.js 20 (required for Next.js 16)
if nvm use 20 2>/dev/null; then
  echo "Using Node.js 20..."
else
  echo "Warning: Node.js 20 not found. Using system Node.js."
  echo "Node version: $(node --version 2>/dev/null || echo 'unknown')"
fi

echo ""
echo "Starting dev server loop..."
echo "------------------------------------------------------------"
echo "Each iteration: rm -rf .next && npx next dev"
echo "Server will restart automatically if it exits silently."
echo "Press Ctrl+C to stop this script (server will finish current cycle)"
echo "------------------------------------------------------------"
echo ""

# Infinite loop to restart the dev server
while true; do
  echo "[$(date)] --- Starting dev server cycle ---"

  # Clean previous build cache
  rm -rf .next

  # Start the dev server in background
  npx next dev > /tmp/next-dev-output.log 2>&1 &
  DEV_PID=$!

  # Wait for the process to exit
  wait $DEV_PID
  EXIT_CODE=$?

  echo "[$(date)] Dev server exited with code $EXIT_CODE"
  echo "[$(date)] Restarting in 2 seconds..."
  sleep 2
done