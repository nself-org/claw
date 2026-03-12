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
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        ClawLogger.info("nClaw daemon started")
    }

    func applicationWillTerminate(_ notification: Notification) {
        ClawLogger.info("nClaw daemon shutting down")
    }
}
