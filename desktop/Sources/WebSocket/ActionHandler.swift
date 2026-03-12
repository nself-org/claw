import Foundation

/// Processes incoming action dispatches from the nself-claw server.
@MainActor
final class ActionHandler {
    private let fileService = FileService()
    private let shellService = ShellService()
    private let clipboardService = ClipboardService()
    private let screenshotService = ScreenshotService()
    private let browserService = BrowserService()

    func handle(_ action: Action) {
        ClawLogger.info("Handling action: \(action.type) (id: \(action.id))")

        switch action.type {
        case .fileRead:
            handleFileAction(action) { self.fileService.readFile(path: $0) }
        case .fileWrite:
            handleFileWriteAction(action)
        case .fileList:
            handleFileAction(action) { self.fileService.listDirectory(path: $0) }
        case .fileDelete:
            handleFileAction(action) { self.fileService.deleteFile(path: $0) }
        case .fileMkdir:
            handleFileAction(action) { self.fileService.makeDirectory(path: $0) }
        case .shellExec:
            handleShellAction(action)
        case .clipboardRead:
            handleClipboardRead(action)
        case .clipboardWrite:
            handleClipboardWrite(action)
        case .screenshot:
            handleScreenshot(action)
        case .browserNavigate, .browserExecute:
            ClawLogger.info("Browser actions are stubbed in this version")
        }
    }

    // MARK: - Private Handlers

    private func handleFileAction(_ action: Action, operation: (String) -> Result<String, ServiceError>) {
        guard let path = action.params?["path"] else {
            ClawLogger.error("File action missing 'path' param")
            return
        }
        let result = operation(path)
        logResult(action: action, result: result)
    }

    private func handleFileWriteAction(_ action: Action) {
        guard let path = action.params?["path"],
              let content = action.params?["content"] else {
            ClawLogger.error("File write action missing 'path' or 'content' param")
            return
        }
        let result = fileService.writeFile(path: path, content: content)
        logResult(action: action, result: result)
    }

    private func handleShellAction(_ action: Action) {
        guard let command = action.params?["command"] else {
            ClawLogger.error("Shell action missing 'command' param")
            return
        }
        let workingDir = action.params?["cwd"]
        shellService.executeWithApproval(command: command, workingDirectory: workingDir) { result in
            switch result {
            case .success(let output):
                ClawLogger.info("Shell action \(action.id) completed: \(output.prefix(200))")
            case .failure(let error):
                ClawLogger.error("Shell action \(action.id) failed: \(error)")
            }
        }
    }

    private func handleClipboardRead(_ action: Action) {
        let result = clipboardService.read()
        logResult(action: action, result: result)
    }

    private func handleClipboardWrite(_ action: Action) {
        guard let content = action.params?["content"] else {
            ClawLogger.error("Clipboard write missing 'content' param")
            return
        }
        let result = clipboardService.write(content)
        logResult(action: action, result: result)
    }

    private func handleScreenshot(_ action: Action) {
        Task {
            let result = await screenshotService.capture()
            switch result {
            case .success(let base64):
                ClawLogger.info("Screenshot action \(action.id) completed (\(base64.count) chars)")
            case .failure(let error):
                ClawLogger.error("Screenshot action \(action.id) failed: \(error)")
            }
        }
    }

    private func logResult(action: Action, result: Result<String, ServiceError>) {
        switch result {
        case .success(let output):
            ClawLogger.info("Action \(action.id) (\(action.type)) completed")
            ClawLogger.debug("Output: \(output.prefix(500))")
        case .failure(let error):
            ClawLogger.error("Action \(action.id) (\(action.type)) failed: \(error)")
        }
    }
}
