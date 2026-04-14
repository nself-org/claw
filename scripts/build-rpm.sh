#!/bin/bash
# Build RPM package for ɳClaw via fpm
# Requires: fpm (gem install fpm)
set -euo pipefail

VERSION="${1:-1.1.0}"
BUILD_DIR="build/linux/x86_64/release/bundle"

if [ ! -d "$BUILD_DIR" ]; then
    echo "Error: $BUILD_DIR not found. Run 'flutter build linux --release' first."
    exit 1
fi

if ! command -v fpm &>/dev/null; then
    echo "Error: fpm not found. Install via: gem install fpm"
    exit 1
fi

fpm -s dir -t rpm \
    --name claw \
    --version "$VERSION" \
    --architecture x86_64 \
    --description "ɳClaw - Personal AI assistant with infinite memory" \
    --url "https://claw.nself.org" \
    --maintainer "nSelf, Inc. <support@nself.org>" \
    --license MIT \
    --depends gtk3 \
    --depends libappindicator-gtk3 \
    --after-install linux/packaging/deb/DEBIAN/postinst \
    --package "build/linux/claw-${VERSION}-1.x86_64.rpm" \
    "$BUILD_DIR/=/opt/claw/" \
    "linux/packaging/claw.desktop=/usr/share/applications/claw.desktop"

echo "RPM package: build/linux/claw-${VERSION}-1.x86_64.rpm"
