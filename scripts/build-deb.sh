#!/bin/bash
# Build Debian package for ɳClaw
set -euo pipefail

VERSION="${1:-1.1.0}"
ARCH="amd64"
BUILD_DIR="build/linux/x86_64/release/bundle"
PKG_NAME="claw_${VERSION}_${ARCH}"
PKG_DIR="build/linux/${PKG_NAME}"

if [ ! -d "$BUILD_DIR" ]; then
    echo "Error: $BUILD_DIR not found. Run 'flutter build linux --release' first."
    exit 1
fi

# Clean and create package structure
rm -rf "$PKG_DIR"
mkdir -p "$PKG_DIR/DEBIAN"
mkdir -p "$PKG_DIR/opt/claw"
mkdir -p "$PKG_DIR/usr/bin"
mkdir -p "$PKG_DIR/usr/share/applications"
mkdir -p "$PKG_DIR/usr/share/icons/hicolor/512x512/apps"

# Copy control file and postinst
cp linux/packaging/deb/DEBIAN/control "$PKG_DIR/DEBIAN/control"
cp linux/packaging/deb/DEBIAN/postinst "$PKG_DIR/DEBIAN/postinst"
chmod 755 "$PKG_DIR/DEBIAN/postinst"

# Copy Flutter bundle
cp -r "$BUILD_DIR"/* "$PKG_DIR/opt/claw/"

# Symlink binary
ln -sf /opt/claw/nself_claw "$PKG_DIR/usr/bin/claw"

# Desktop file and icon
cp linux/packaging/claw.desktop "$PKG_DIR/usr/share/applications/claw.desktop"
ICON_SRC=".github/wiki/brand/claw-icon-512.png"
if [ -f "$ICON_SRC" ]; then
    cp "$ICON_SRC" "$PKG_DIR/usr/share/icons/hicolor/512x512/apps/claw.png"
fi

# Build
dpkg-deb --build "$PKG_DIR"
echo "Debian package: build/linux/${PKG_NAME}.deb"
