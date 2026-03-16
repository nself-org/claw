import Foundation

/// WebSocket client to the nself-claw server.
/// Uses URLSessionWebSocketTask (built-in, no dependencies).
final class ClawWebSocket: NSObject {
    private let urlString: String
    private var task: URLSessionWebSocketTask?
    private var session: URLSession?
    private var reconnector: Reconnect?
    private let onStateChange: (ConnectionState) -> Void
    private let onAction: (Action) -> Void

    init(url: String, onStateChange: @escaping (ConnectionState) -> Void, onAction: @escaping (Action) -> Void) {
        self.urlString = url
        self.onStateChange = onStateChange
        self.onAction = onAction
        super.init()
        self.reconnector = Reconnect { [weak self] in
            self?.attemptConnect()
        }
    }

    func connect() {
        attemptConnect()
    }

    func disconnect() {
        reconnector?.stop()
        task?.cancel(with: .goingAway, reason: nil)
        task = nil
        session?.invalidateAndCancel()
        session = nil
        onStateChange(.disconnected)
    }

    func send(_ message: some Encodable) {
        guard let data = try? JSONEncoder().encode(message),
              let text = String(data: data, encoding: .utf8) else {
            ClawLogger.error("Failed to encode WebSocket message")
            return
        }
        task?.send(.string(text)) { error in
            if let error = error {
                ClawLogger.error("WebSocket send error: \(error)")
            }
        }
    }

    // MARK: - Private

    private func attemptConnect() {
        fputs("[nClaw] attemptConnect: \(urlString)\n", stderr)
        guard let url = URL(string: urlString) else {
            fputs("[nClaw] attemptConnect: INVALID URL\n", stderr)
            ClawLogger.error("Invalid WebSocket URL: \(urlString)")
            return
        }

        onStateChange(.connecting)

        let config = URLSessionConfiguration.default
        config.waitsForConnectivity = true
        session = URLSession(configuration: config, delegate: self, delegateQueue: nil)

        // Build URLRequest with auth header if token exists
        var request = URLRequest(url: url)
        if let token = KeychainHelper.load(key: "nclaw-jwt-token") {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        task = session?.webSocketTask(with: request)
        fputs("[nClaw] task created, calling resume\n", stderr)
        task?.resume()
        fputs("[nClaw] resume called, starting receiveMessage\n", stderr)
        receiveMessage()
    }

    private func receiveMessage() {
        task?.receive { [weak self] result in
            guard let self = self else { return }

            switch result {
            case .success(let message):
                self.handleMessage(message)
                self.receiveMessage() // Continue listening
            case .failure(let error):
                fputs("[nClaw] WS receive error: \(error)\n", stderr)
                ClawLogger.error("WebSocket receive error: \(error)")
                self.handleDisconnect()
            }
        }
    }

    private func handleMessage(_ message: URLSessionWebSocketTask.Message) {
        let data: Data?
        switch message {
        case .string(let text):
            data = text.data(using: .utf8)
        case .data(let d):
            data = d
        @unknown default:
            data = nil
        }

        guard let data = data else { return }

        do {
            let action = try JSONDecoder().decode(Action.self, from: data)
            onAction(action)
        } catch {
            ClawLogger.error("Failed to decode action: \(error)")
        }
    }

    private func handleDisconnect() {
        task = nil
        onStateChange(.disconnected)
        reconnector?.scheduleRetry()
    }
}

// MARK: - URLSessionWebSocketDelegate

extension ClawWebSocket: URLSessionWebSocketDelegate {
    func urlSession(
        _ session: URLSession,
        webSocketTask: URLSessionWebSocketTask,
        didOpenWithProtocol protocol: String?
    ) {
        ClawLogger.info("WebSocket connected")
        reconnector?.reset()
        onStateChange(.connected)

        // Send capability report on connect
        let caps = DeviceCapability.current()
        send(caps)
    }

    func urlSession(
        _ session: URLSession,
        webSocketTask: URLSessionWebSocketTask,
        didCloseWith closeCode: URLSessionWebSocketTask.CloseCode,
        reason: Data?
    ) {
        ClawLogger.info("WebSocket closed with code: \(closeCode.rawValue)")
        handleDisconnect()
    }
}
