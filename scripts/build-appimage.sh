#!/bin/bash
# Build Linux AppImage for ɳClaw
# Requires: appimagetool in PATH
set -euo pipefail

VERSION="${1:-1.1.0}"
ARCH="x86_64"
BUILD_DIR="build/linux/${ARCH}/release/bundle"
APPDIR="build/linux/AppDir"
OUTPUT="build/linux/Claw-${VERSION}-${ARCH}.AppImage"

if [ ! -d "$BUILD_DIR" ]; then
    echo "Error: $BUILD_DIR not found. Run 'flutter build linux --release' first."
    exit 1
fi

if ! command -v appimagetool &>/dev/null; then
    echo "Error: appimagetool not found. Download from https://appimage.github.io/appimagetool/"
    exit 1
fi

# Clean and create AppDir structure
rm -rf "$APPDIR"
mkdir -p "$APPDIR/usr/bin" "$APPDIR/usr/share/applications" "$APPDIR/usr/share/icons/hicolor/512x512/apps"

# Copy Flutter bundle
cp -r "$BUILD_DIR"/* "$APPDIR/usr/bin/"

# Copy desktop file and icon
cp linux/packaging/claw.desktop "$APPDIR/claw.desktop"
cp linux/packaging/claw.desktop "$APPDIR/usr/share/applications/claw.desktop"

# Icon (use existing brand asset or placeholder)
ICON_SRC=".github/wiki/brand/claw-icon-512.png"
if [ -f "$ICON_SRC" ]; then
    cp "$ICON_SRC" "$APPDIR/claw.png"
    cp "$ICON_SRC" "$APPDIR/usr/share/icons/hicolor/512x512/apps/claw.png"
else
    echo "WARNING: $ICON_SRC not found. AppImage will lack an icon."
fi

# Create AppRun
cat > "$APPDIR/AppRun" << 'APPRUN'
#!/bin/bash
HERE="$(dirname "$(readlink -f "${0}")")"
export LD_LIBRARY_PATH="${HERE}/usr/bin/lib:${LD_LIBRARY_PATH:-}"
exec "${HERE}/usr/bin/nself_claw" "$@"
APPRUN
chmod +x "$APPDIR/AppRun"

# Build AppImage
rm -f "$OUTPUT"
ARCH="$ARCH" appimagetool "$APPDIR" "$OUTPUT"

echo "AppImage created: $OUTPUT"

# GPG sign if key available
if [ -n "${LINUX_SIGNING_GPG_KEY:-}" ]; then
    echo "Signing AppImage with GPG..."
    echo "$LINUX_SIGNING_GPG_KEY" | gpg --batch --import 2>/dev/null || true
    gpg --batch --yes --detach-sign --armor "$OUTPUT"
    echo "GPG signature: ${OUTPUT}.asc"
else
    echo "WARNING: LINUX_SIGNING_GPG_KEY not set. Skipping GPG signing."
fi
