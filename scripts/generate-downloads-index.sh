#!/bin/bash
# F-28-08: Generate downloads.nself.org/claw/index.json
#
# Scans build artifacts and produces the release index with sha256 checksums.
# Usage: ./scripts/generate-downloads-index.sh <version> <artifacts-dir> <output-dir>

set -euo pipefail

VERSION="${1:?Usage: $0 <version> <artifacts-dir> <output-dir>}"
ARTIFACTS="${2:?}"
OUTPUT="${3:?}"

BASE_URL="https://downloads.nself.org/claw"

sha256_of() {
    shasum -a 256 "$1" | cut -d' ' -f1
}

mkdir -p "$OUTPUT"

# Compute checksums for each platform artifact.
MACOS_DMG="$ARTIFACTS/nClaw-${VERSION}-macos.dmg"
WINDOWS_MSIX="$ARTIFACTS/nClaw-${VERSION}-windows.msix"
LINUX_APPIMAGE="$ARTIFACTS/nClaw-${VERSION}-linux.AppImage"
LINUX_DEB="$ARTIFACTS/nClaw-${VERSION}-linux.deb"
LINUX_RPM="$ARTIFACTS/nClaw-${VERSION}-linux.rpm"

macos_sha=""
windows_sha=""
appimage_sha=""
deb_sha=""
rpm_sha=""

if [ -f "$MACOS_DMG" ]; then macos_sha=$(sha256_of "$MACOS_DMG"); fi
if [ -f "$WINDOWS_MSIX" ]; then windows_sha=$(sha256_of "$WINDOWS_MSIX"); fi
if [ -f "$LINUX_APPIMAGE" ]; then appimage_sha=$(sha256_of "$LINUX_APPIMAGE"); fi
if [ -f "$LINUX_DEB" ]; then deb_sha=$(sha256_of "$LINUX_DEB"); fi
if [ -f "$LINUX_RPM" ]; then rpm_sha=$(sha256_of "$LINUX_RPM"); fi

cat > "$OUTPUT/index.json" << ENDJSON
{
  "product": "nclaw",
  "version": "${VERSION}",
  "released": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "platforms": {
    "macos": {
      "url": "${BASE_URL}/macos/nClaw-${VERSION}-macos.dmg",
      "sha256": "${macos_sha}",
      "appcast": "${BASE_URL}/macos/appcast.xml"
    },
    "windows": {
      "url": "${BASE_URL}/windows/nClaw-${VERSION}-windows.msix",
      "sha256": "${windows_sha}",
      "squirrel": "${BASE_URL}/windows/RELEASES"
    },
    "linux_appimage": {
      "url": "${BASE_URL}/linux/nClaw-${VERSION}-linux.AppImage",
      "sha256": "${appimage_sha}",
      "latest": "${BASE_URL}/linux/latest.json"
    },
    "linux_deb": {
      "url": "${BASE_URL}/linux/nClaw-${VERSION}-linux.deb",
      "sha256": "${deb_sha}"
    },
    "linux_rpm": {
      "url": "${BASE_URL}/linux/nClaw-${VERSION}-linux.rpm",
      "sha256": "${rpm_sha}"
    },
    "ios": {
      "store_url": "https://apps.apple.com/app/nclaw/id0000000000"
    },
    "android": {
      "store_url": "https://play.google.com/store/apps/details?id=com.nself.claw"
    }
  }
}
ENDJSON

# Generate Sparkle appcast.xml for macOS auto-updates.
if [ -n "$macos_sha" ]; then
    macos_size=$(stat -f%z "$MACOS_DMG" 2>/dev/null || stat -c%s "$MACOS_DMG" 2>/dev/null || printf "0")
    cat > "$OUTPUT/appcast.xml" << ENDXML
<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:sparkle="http://www.andymatuschak.net/xml-namespaces/sparkle" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>nClaw Updates</title>
    <link>${BASE_URL}/macos/appcast.xml</link>
    <language>en</language>
    <item>
      <title>Version ${VERSION}</title>
      <pubDate>$(date -R)</pubDate>
      <sparkle:version>${VERSION}</sparkle:version>
      <sparkle:shortVersionString>${VERSION}</sparkle:shortVersionString>
      <sparkle:minimumSystemVersion>13.0</sparkle:minimumSystemVersion>
      <enclosure url="${BASE_URL}/macos/nClaw-${VERSION}-macos.dmg"
                 sparkle:edSignature=""
                 length="${macos_size}"
                 type="application/octet-stream" />
    </item>
  </channel>
</rss>
ENDXML
fi

# Generate Squirrel RELEASES for Windows.
if [ -n "$windows_sha" ]; then
    windows_size=$(stat -f%z "$WINDOWS_MSIX" 2>/dev/null || stat -c%s "$WINDOWS_MSIX" 2>/dev/null || printf "0")
    printf "%s nClaw-%s-full.nupkg %s\n" "$windows_sha" "$VERSION" "$windows_size" > "$OUTPUT/RELEASES"
fi

# Generate latest.json for Linux AppImage updater.
if [ -n "$appimage_sha" ]; then
    cat > "$OUTPUT/latest.json" << ENDLATEST
{
  "version": "${VERSION}",
  "url": "${BASE_URL}/linux/nClaw-${VERSION}-linux.AppImage",
  "sha256": "${appimage_sha}",
  "released": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
ENDLATEST
fi

printf "Downloads index generated at %s/index.json\n" "$OUTPUT"
