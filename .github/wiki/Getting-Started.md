# Getting Started

## Prerequisites

### nSelf CLI and Pro license

nClaw requires a self-hosted nSelf backend with Pro plugins.

1. Install nSelf CLI v1.0+:
   ```bash
   brew install nself-org/nself/nself
   ```

2. Obtain a Pro license key from [nself.org/pricing](https://nself.org/pricing) ($1.99/mo or $19.99/yr). The key has the format `nself_pro_` followed by 32+ characters.

3. Set the license:
   ```bash
   nself license set nself_pro_YOURKEY
   ```

### Flutter

Install Flutter 3.x via the [official installer](https://docs.flutter.dev/get-started/install).

Verify:
```bash
flutter doctor
```

### Rust

Install the Rust stable toolchain via [rustup](https://rustup.rs/):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Docker

Docker is required to run the nSelf backend. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine.

### Platform tools

- **iOS/macOS:** Xcode (latest stable) from the Mac App Store
- **Android:** Android Studio with NDK installed

---

## Backend Setup

```bash
cd backend

# Initialize nSelf project
nself init

# Install required Pro plugins (ai + claw + mux)
nself plugin install ai claw mux

# Optional ɳClaw-bundle plugins (voice, browser, google, notify, cron, claw-web)
nself plugin install voice browser google notify cron claw-web

# Generate docker-compose and config
nself build

# Start the backend
nself start
```

The backend will start at:
- GraphQL API: `http://localhost:8080/v1/graphql`
- Auth: `http://localhost:4000`
- Storage: `http://localhost:9000`

See [backend/README.md](../../../backend/README.md) for the full self-hosting guide.

---

## Clone the repo

```bash
git clone https://github.com/nself-org/claw.git
cd claw
```

---

## Build libnclaw (Rust FFI)

```bash
cd libs/libnclaw
cargo build --release
```

---

## Run the Flutter app

```bash
cd app
flutter pub get
```

### iOS

```bash
flutter run -d ios
```

Requires Xcode and an iOS simulator or physical device.

### Android

```bash
flutter run -d android
```

Requires an Android emulator or physical device with USB debugging enabled.

### macOS

```bash
flutter run -d macos
```

Requires macOS 12+ and Xcode.

### Web

```bash
flutter run -d chrome
```

---

## First launch

When the app starts for the first time, it runs a six-screen setup wizard:

| Screen | Purpose |
|--------|---------|
| 0 — Welcome | Intro to ɳClaw |
| 1 — Server resources | Detects local model availability |
| 2 — Model install | Optionally downloads a local LLM |
| 3 — Connect Your Tools | Enable optional plugins: Google Workspace, Notifications, Browser Control, Voice Input, Scheduler |
| 4 — Daily Schedule | Set timezone + wake time + starter recipes (only shown if Scheduler was enabled) |
| 5 — Agent Style | Choose a starting agent template: Personal Assistant, Research Agent, Writing Coach, Code Reviewer, or Custom |

**Screen 3 — Plugin toggles:**
- Toggle any plugin on or off. Google Workspace opens a browser OAuth flow.
- Tap **Skip All** to proceed without enabling any optional plugins.
- Tap **Continue** to advance.

**Screen 4 — Schedule (only shown when Scheduler is enabled):**
- Pick your timezone and daily wake time.
- Select which starter recipes to activate: Morning Briefing, End-of-Day Summary, Weekly Review.

**Screen 5 — Agent style:**
- Each template sets your agent's persona and default tool permissions.
- Selecting **Custom** opens a blank agent editor after setup completes.
- Tap **Finish Setup** to commit all choices. ɳClaw calls `POST /claw/onboarding/complete` with your selections in a single transaction.

The wizard does not show again after completion. To re-run it, go to Settings and choose "Reset onboarding".

After the wizard, sign in using the credentials you configured in your nSelf backend.

---

## Native clients

### iOS/macOS (SwiftUI)

```bash
open apps/ios/nClaw.xcodeproj
```

Build and run from Xcode. Targets both iOS and macOS via Mac Catalyst.

### Android (Kotlin)

Open `apps/android/` in Android Studio and run from there.
