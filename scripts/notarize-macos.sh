#!/bin/bash
# Notarize macOS DMG for ɳClaw
# Requires: Apple Developer account credentials in environment
set -euo pipefail

DMG_PATH="${1:?Usage: notarize-macos.sh <path-to-dmg>}"

if [ ! -f "$DMG_PATH" ]; then
    echo "Error: $DMG_PATH not found."
    exit 1
fi

# Required env vars (from vault / CI secrets)
: "${APPLE_ID:?Set APPLE_ID}"
: "${APPLE_TEAM_ID:?Set APPLE_TEAM_ID}"
: "${APPLE_APP_SPECIFIC_PASSWORD:?Set APPLE_APP_SPECIFIC_PASSWORD}"

echo "Submitting $DMG_PATH for notarization..."
xcrun notarytool submit "$DMG_PATH" \
    --apple-id "$APPLE_ID" \
    --team-id "$APPLE_TEAM_ID" \
    --password "$APPLE_APP_SPECIFIC_PASSWORD" \
    --wait

echo "Stapling notarization ticket..."
xcrun stapler staple "$DMG_PATH"

echo "Verifying..."
spctl --assess --type install "$DMG_PATH" && echo "Notarization verified." || echo "WARNING: spctl assessment failed."
