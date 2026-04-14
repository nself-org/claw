#!/bin/bash
# Code sign macOS app for ɳClaw
# Requires: Developer ID Application certificate installed in keychain
set -euo pipefail

APP_PATH="${1:-build/macos/Build/Products/Release/Claw.app}"
ENTITLEMENTS="macos/Runner/Release.entitlements"

: "${APPLE_TEAM_NAME:?Set APPLE_TEAM_NAME}"
: "${APPLE_TEAM_ID:?Set APPLE_TEAM_ID}"

SIGN_IDENTITY="Developer ID Application: ${APPLE_TEAM_NAME} (${APPLE_TEAM_ID})"

echo "Signing $APP_PATH with identity: $SIGN_IDENTITY"

codesign --deep --force --timestamp --options=runtime \
    --entitlements "$ENTITLEMENTS" \
    --sign "$SIGN_IDENTITY" \
    "$APP_PATH"

echo "Verifying signature..."
codesign --verify --strict --deep "$APP_PATH"
echo "Code signing complete."
