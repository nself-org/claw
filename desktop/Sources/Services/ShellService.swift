import Foundation
import AppKit

/// Shell command execution with mandatory user approval.
/// Every command triggers a native NSAlert before running.
final class ShellService {

    /// Execute a shell command after user approval via native dialog.
    func executeWithApproval(
        command: String,
        workingDirectory: String?,
        completion: @escaping (Result<String, ServiceError>) -> Void
    ) {
        DispatchQueue.main.async {
            let approved = self.showApprovalDialog(command: command, workingDirectory: workingDirectory)
            if approved {
                DispatchQueue.global(qos: .userInitiated).async {
                    let result = self.execute(command: command, workingDirectory: workingDirectory)
                    completion(result)
                }
            } else {
                completion(.failure(.userDenied))
            }
        }
    }

    // MARK: - HTTP Handler

    func handleExec(_ request: HTTPRequest) -> HTTPResponse {
        struct Params: Decodable {
            let command: String
            let cwd: String?
        }
        guard let params = request.jsonBody(as: Params.self) else {
            return .error("Missing 'command' in request body")
        }

        // Synchronous approval + execution for HTTP endpoint
        var result: Result<String, ServiceError>?
        let semaphore = DispatchSemaphore(value: 0)

        executeWithApproval(command: params.command, workingDirectory: params.cwd) { r in
            result = r
            semaphore.signal()
        }

        semaphore.wait()

        switch result {
        case .success(let output):
            return .json(["output": output])
        case .failure(let error):
            return .error(error.localizedDescription, status: error.httpStatus)
        case .none:
            return .error("Unexpected error", status: 500)
        }
    }

    // MARK: - Private

    private func showApprovalDialog(command: String, workingDirectory: String?) -> Bool {
        let alert = NSAlert()
        alert.messageText = "\u{0266}Claw: Shell Command Request"
        alert.informativeText = "The nClaw server is requesting to execute:\n\n\(command)"
        if let cwd = workingDirectory {
            alert.informativeText += "\n\nWorking directory: \(cwd)"
        }
        alert.alertStyle = .warning
        alert.addButton(withTitle: "Allow")
        alert.addButton(withTitle: "Deny")

        let response = alert.runModal()
        return response == .alertFirstButtonReturn
    }

    private func execute(command: String, workingDirectory: String?) -> Result<String, ServiceError> {
        let process = Process()
        let pipe = Pipe()

        process.executableURL = URL(fileURLWithPath: "/bin/zsh")
        process.arguments = ["-c", command]
        process.standardOutput = pipe
        process.standardError = pipe

        if let cwd = workingDirectory {
            process.currentDirectoryURL = URL(fileURLWithPath: cwd)
        }

        do {
            try process.run()
            process.waitUntilExit()

            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            let output = String(data: data, encoding: .utf8) ?? ""

            if process.terminationStatus != 0 {
                return .failure(.operationFailed("Exit code \(process.terminationStatus): \(output)"))
            }

            return .success(output)
        } catch {
            return .failure(.operationFailed("Failed to launch: \(error.localizedDescription)"))
        }
    }
}
