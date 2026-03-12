import Foundation

/// Browser integration via Chrome DevTools Protocol (CDP).
/// This is a stub. Full implementation requires connecting to Chrome's
/// debug port (--remote-debugging-port=9222) via WebSocket.
final class BrowserService {

    func handleNavigate(_ request: HTTPRequest) -> HTTPResponse {
        struct Params: Decodable { let url: String }
        guard let params = request.jsonBody(as: Params.self) else {
            return .error("Missing 'url' in request body")
        }

        ClawLogger.info("Browser navigate stub: \(params.url)")
        return .error("Browser integration not yet implemented. Chrome CDP support coming in a future release.", status: 501)
    }

    func handleExecute(_ request: HTTPRequest) -> HTTPResponse {
        struct Params: Decodable { let script: String }
        guard let params = request.jsonBody(as: Params.self) else {
            return .error("Missing 'script' in request body")
        }

        ClawLogger.info("Browser execute stub: \(params.script.prefix(100))")
        return .error("Browser integration not yet implemented. Chrome CDP support coming in a future release.", status: 501)
    }
}
