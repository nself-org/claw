import Foundation

/// Route handler for the local HTTP server.
/// Maps paths to service methods.
final class RouteHandler {
    private let fileService = FileService()
    private let shellService = ShellService()
    private let clipboardService = ClipboardService()
    private let screenshotService = ScreenshotService()
    private let browserService = BrowserService()

    func handle(_ request: HTTPRequest) -> HTTPResponse {
        switch (request.method, request.path) {

        // Health check
        case ("GET", "/health"):
            return handleHealth()

        // Capabilities report
        case ("GET", "/capabilities"):
            return handleCapabilities()

        // File operations
        case ("POST", "/files/read"):
            return fileService.handleRead(request)
        case ("POST", "/files/write"):
            return fileService.handleWrite(request)
        case ("POST", "/files/list"):
            return fileService.handleList(request)
        case ("POST", "/files/delete"):
            return fileService.handleDelete(request)
        case ("POST", "/files/mkdir"):
            return fileService.handleMkdir(request)

        // Shell execution
        case ("POST", "/shell/exec"):
            return shellService.handleExec(request)

        // Clipboard
        case ("GET", "/clipboard/read"):
            return clipboardService.handleRead()
        case ("POST", "/clipboard/write"):
            return clipboardService.handleWrite(request)

        // Screenshot
        case ("POST", "/screenshot"):
            return screenshotService.handleCapture(request)

        // Browser (stub)
        case ("POST", "/browser/navigate"):
            return browserService.handleNavigate(request)
        case ("POST", "/browser/execute"):
            return browserService.handleExecute(request)

        // Catch-all
        case (_, _) where request.method != "GET" && request.method != "POST":
            return .error("Method not allowed", status: 405)
        default:
            return .error("Not found", status: 404)
        }
    }

    // MARK: - Built-in Routes

    private func handleHealth() -> HTTPResponse {
        let health: [String: String] = [
            "status": "ok",
            "version": "0.1.0",
            "daemon": "nclaw-desktop"
        ]
        return .json(health)
    }

    private func handleCapabilities() -> HTTPResponse {
        let caps = DeviceCapability.current()
        return .json(caps)
    }
}
