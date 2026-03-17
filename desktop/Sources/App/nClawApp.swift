import SwiftUI

@main
struct nClawApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var connectionManager = ConnectionManager()
    @StateObject private var serverManager = LocalServerManager()

    var body: some Scene {
        MenuBarExtra {
            MenuBarView(
                connectionManager: connectionManager,
                serverManager: serverManager
            )
            .task { connectionManager.connect() }
        } label: {
            Image(systemName: connectionManager.statusIcon)
                .symbolRenderingMode(.palette)
                .foregroundStyle(connectionManager.statusColor)
        }
        .menuBarExtraStyle(.window)

        Settings {
            SettingsView(
                connectionManager: connectionManager,
                serverManager: serverManager
            )
        }

        // Onboarding window — shown on first launch when no JWT is found.
        // Displayed as a floating panel via openWindow(id:) from AppDelegate.
        WindowGroup("Setup \u{0266}Claw", id: "onboarding") {
            OnboardingView {
                // Dismiss the onboarding window and reconnect with the new credentials.
                NSApplication.shared.windows
                    .first { $0.title.hasPrefix("Setup") }?
                    .close()
                connectionManager.reconnectWithSavedCredentials()
            }
            .frame(width: 420, height: 440)
        }
        .windowResizability(.contentSize)
        .defaultPosition(.center)
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        ClawLogger.info("nClaw daemon started")

        // Show onboarding if no JWT exists in Keychain.
        if KeychainHelper.load(key: "nclaw-jwt-token") == nil {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                self.openOnboardingWindow()
            }
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        ClawLogger.info("nClaw daemon shutting down")
    }

    // MARK: - Private

    private func openOnboardingWindow() {
        // Find the onboarding WindowGroup by its title prefix and bring it forward,
        // or open a fresh one if none exists yet.
        if let existing = NSApplication.shared.windows.first(where: { $0.title.hasPrefix("Setup") }) {
            existing.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
            return
        }

        // Trigger the WindowGroup by sending the openWindow action via the environment.
        // For menu bar apps, the cleanest path is to post the built-in openWindow
        // notification that SwiftUI's WindowGroup listens to.
        if #available(macOS 13.0, *) {
            NSApp.sendAction(#selector(NSDocument.makeWindowControllers), to: nil, from: nil)
        }

        // Fallback: create an NSWindow hosting the OnboardingView directly.
        let onboardingWindow = OnboardingWindowController()
        onboardingWindow.showWindow(nil)
        NSApp.activate(ignoringOtherApps: true)
    }
}

// MARK: - Onboarding Window Controller

/// Fallback NSWindowController that hosts OnboardingView when the SwiftUI
/// WindowGroup approach fails (e.g., during first launch on macOS 13).
final class OnboardingWindowController: NSWindowController {
    init() {
        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 420, height: 440),
            styleMask: [.titled, .closable, .miniaturizable],
            backing: .buffered,
            defer: false
        )
        window.title = "Setup \u{0266}Claw"
        window.center()
        window.isReleasedWhenClosed = false

        super.init(window: window)

        let contentView = OnboardingView {
            window.close()
        }
        window.contentView = NSHostingView(rootView: contentView)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) not used")
    }
}
