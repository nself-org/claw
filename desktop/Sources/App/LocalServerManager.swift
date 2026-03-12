import SwiftUI

/// Manages the local HTTP server lifecycle.
/// Observable so the UI can show running state.
@MainActor
final class LocalServerManager: ObservableObject {
    @Published var isRunning: Bool = false
    @Published var port: Int = 7710

    private var server: LocalHTTPServer?

    init() {
        let savedPort = UserDefaults.standard.integer(forKey: "httpPort")
        self.port = savedPort > 0 ? savedPort : 7710
        startServer()
    }

    func startServer() {
        guard !isRunning else { return }

        let token = KeychainHelper.load(key: "nclaw-http-token")
        let httpServer = LocalHTTPServer(port: UInt16(port), token: token)

        do {
            try httpServer.start()
            self.server = httpServer
            self.isRunning = true
        } catch {
            ClawLogger.error("Failed to start HTTP server: \(error)")
            self.isRunning = false
        }
    }

    func stopServer() {
        server?.stop()
        server = nil
        isRunning = false
    }

    func restart() {
        stopServer()
        let savedPort = UserDefaults.standard.integer(forKey: "httpPort")
        self.port = savedPort > 0 ? savedPort : 7710
        startServer()
    }
}
