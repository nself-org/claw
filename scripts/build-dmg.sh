#!/bin/bash
# Build macOS DMG for ɳClaw
# Requires: create-dmg (brew install create-dmg)
set -euo pipefail

VERSION="${1:-1.1.0}"
APP_PATH="build/macos/Build/Products/Release/Claw.app"
DMG_OUTPUT="build/macos/Claw-${VERSION}.dmg"
DMG_BG="assets/dmg-background.png"

if [ ! -d "$APP_PATH" ]; then
    echo "Error: $APP_PATH not found. Run 'flutter build macos --release' first."
    exit 1
fi

if ! command -v create-dmg &>/dev/null; then
    echo "Error: create-dmg not found. Install via: brew install create-dmg"
    exit 1
fi

# Remove old DMG if exists
rm -f "$DMG_OUTPUT"

create-dmg \
    --volname "ɳClaw ${VERSION}" \
    --volicon "$APP_PATH/Contents/Resources/AppIcon.icns" \
    --background "$DMG_BG" \
    --window-pos 200 120 \
    --window-size 660 400 \
    --icon-size 80 \
    --icon "Claw.app" 180 190 \
    --hide-extension "Claw.app" \
    --app-drop-link 480 190 \
    "$DMG_OUTPUT" \
    "$APP_PATH"

echo "DMG created: $DMG_OUTPUT"
