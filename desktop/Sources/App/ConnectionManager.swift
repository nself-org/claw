import SwiftUI
import Combine

enum ConnectionState: String {
    case disconnected
    case connecting
    case connected

    var displayName: String {
        switch self {
        case .disconnected: return "Disconnected"
        case .connecting: return "Connecting..."
        case .connected: return "Connected"
        }
    }
}

@MainActor
final class ConnectionManager: ObservableObject {
    @Published var state: ConnectionState = .disconnected
    @Published var config: ServerConfig

    private var webSocket: ClawWebSocket?
    private var actionHandler: ActionHandler?

    var statusColor: Color {
        switch state {
        case .connected: return .green
        case .connecting: return .orange
        case .disconnected: return .red
        }
    }

    var statusIcon: String {
        switch state {
        case .connected: return "brain.head.profile"
        case .connecting: return "brain.head.profile"
        case .disconnected: return "brain.head.profile"
        }
    }

    init() {
        let savedURL = UserDefaults.standard.string(forKey: "serverURL") ?? "wss://api.nself.org/claw/ws"
        let savedPort = UserDefaults.standard.integer(forKey: "httpPort")
        self.config = ServerConfig(
            serverURL: savedURL,
            port: savedPort > 0 ? savedPort : 7710
        )
        fputs("[nClaw] init: url=\(savedURL)\n", stderr)
        // Auto-connect on startup. Use detached task to avoid @MainActor deadlock
        // during init, then dispatch back to main after the run loop is active.
        Task.detached { [weak self] in
            fputs("[nClaw] task.detached: sleeping 1s\n", stderr)
            try? await Task.sleep(nanoseconds: 1_000_000_000) // 1s — let NSApp finish launching
            fputs("[nClaw] task.detached: calling connect\n", stderr)
            await MainActor.run { self?.connect() }
        }
    }

    func connect() {
        fputs("[nClaw] connect() called, state=\(state.rawValue)\n", stderr)
        guard state == .disconnected else { return }
        state = .connecting

        let handler = ActionHandler()
        self.actionHandler = handler

        let ws = ClawWebSocket(
            url: config.serverURL,
            onStateChange: { [weak self] newState in
                Task { @MainActor in
                    self?.state = newState
                }
            },
            onAction: { [weak self] action in
                Task { @MainActor in
                    self?.actionHandler?.handle(action)
                }
            }
        )
        self.webSocket = ws
        ws.connect()
    }

    func disconnect() {
        webSocket?.disconnect()
        webSocket = nil
        actionHandler = nil
        state = .disconnected
    }
}
