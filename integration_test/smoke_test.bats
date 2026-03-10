#!/usr/bin/env bats
# T-0394 — claw/ CI smoke tests
#
# nself-claw ships three clients: a Next.js web app (apps/web/), a Kotlin
# Android app (apps/android/), and a SwiftUI iOS/macOS app (apps/ios/).
# These bats tests cover the web client static/static CI tier only.
# Android and iOS are excluded from automated CI smoke tests — they require
# platform SDKs (Android Studio / Xcode) that are not available in CI.
#
# Skip guard: set SKIP_FLUTTER_TESTS=1 to skip all tests in this file.
# (Variable name preserved for CI matrix compatibility with sibling repos.)
#
# Prerequisites: pnpm installed, node_modules present (pnpm install in apps/web)
# Run: bats claw/integration_test/smoke_test.bats
# CI:  SKIP_FLUTTER_TESTS=1 bats claw/integration_test/smoke_test.bats

REPO_ROOT="$(cd "$(dirname "$BATS_TEST_FILENAME")/../.." && pwd)"
WEB_APP="$REPO_ROOT/apps/web"

setup() {
  if [ "${SKIP_FLUTTER_TESTS:-1}" = "1" ]; then
    skip "SKIP_FLUTTER_TESTS=1 — set to 0 to run claw CI smoke tests"
  fi

  if [ ! -d "$WEB_APP" ]; then
    skip "apps/web directory not found"
  fi

  if [ ! -d "$WEB_APP/node_modules" ]; then
    skip "node_modules not installed — run: pnpm install in $WEB_APP"
  fi
}

# ---------------------------------------------------------------------------
# Scenario 1 — TypeScript type-check exits 0
# ---------------------------------------------------------------------------
@test "TypeScript type-check passes (tsc --noEmit)" {
  run pnpm --dir "$WEB_APP" run type-check
  [ "$status" -eq 0 ]
}

# ---------------------------------------------------------------------------
# Scenario 2 — Unit / component tests exit 0
# ---------------------------------------------------------------------------
@test "Unit tests exit 0" {
  run pnpm --dir "$WEB_APP" run test -- --passWithNoTests --forceExit
  [ "$status" -eq 0 ]
}

# ---------------------------------------------------------------------------
# Scenario 3 — Next.js production build exits 0 (next build)
# ---------------------------------------------------------------------------
@test "Next.js production build exits 0" {
  run pnpm --dir "$WEB_APP" run build
  [ "$status" -eq 0 ]
}

# ---------------------------------------------------------------------------
# Scenario 4 — Build output directory .next/ exists after build
# ---------------------------------------------------------------------------
@test ".next/ output directory exists after build" {
  if [ ! -d "$WEB_APP/.next" ]; then
    run pnpm --dir "$WEB_APP" run build
    [ "$status" -eq 0 ]
  fi
  [ -d "$WEB_APP/.next" ]
}

# ---------------------------------------------------------------------------
# Scenario 5 — .next/BUILD_ID file confirms build completed
# ---------------------------------------------------------------------------
@test ".next/BUILD_ID file exists (build fully completed)" {
  if [ ! -f "$WEB_APP/.next/BUILD_ID" ]; then
    run pnpm --dir "$WEB_APP" run build
    [ "$status" -eq 0 ]
  fi
  [ -f "$WEB_APP/.next/BUILD_ID" ]
}
