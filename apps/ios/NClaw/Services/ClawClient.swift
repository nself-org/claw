import Foundation

final class ClawClient {
    private static let serverURLKey = "nclaw_server_url"
    private static let apiKeyKey = "nclaw_api_key"

    static var serverURL: String {
        get { UserDefaults.standard.string(forKey: serverURLKey) ?? "" }
        set { UserDefaults.standard.set(newValue, forKey: serverURLKey) }
    }

    static var apiKey: String {
        get { UserDefaults.standard.string(forKey: apiKeyKey) ?? "" }
        set { UserDefaults.standard.set(newValue, forKey: apiKeyKey) }
    }

    func sendMessage(_ text: String) async throws -> String {
        let baseURL = ClawClient.serverURL.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard let url = URL(string: "\(baseURL)/claw/chat") else {
            throw ClawError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let key = ClawClient.apiKey
        if !key.isEmpty {
            request.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization")
        }

        let body: [String: Any] = [
            "message": text
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw ClawError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            let errorBody = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw ClawError.serverError(statusCode: httpResponse.statusCode, message: errorBody)
        }

        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let reply = json["reply"] as? String else {
            throw ClawError.decodingFailed
        }

        return reply
    }
}

enum ClawError: LocalizedError {
    case invalidURL
    case invalidResponse
    case serverError(statusCode: Int, message: String)
    case decodingFailed

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid server URL. Check your settings."
        case .invalidResponse:
            return "Received an invalid response from the server."
        case .serverError(let code, let message):
            return "Server error (\(code)): \(message)"
        case .decodingFailed:
            return "Failed to decode the server response."
        }
    }
}
