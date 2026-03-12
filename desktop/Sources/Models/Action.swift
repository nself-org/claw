import Foundation

/// Action dispatched from the nself-claw server to this daemon.
struct Action: Codable, Identifiable {
    let id: String
    let type: ActionType
    let params: [String: String]?
    let status: ActionStatus?

    enum ActionType: String, Codable {
        case fileRead = "file.read"
        case fileWrite = "file.write"
        case fileList = "file.list"
        case fileDelete = "file.delete"
        case fileMkdir = "file.mkdir"
        case shellExec = "shell.exec"
        case clipboardRead = "clipboard.read"
        case clipboardWrite = "clipboard.write"
        case screenshot = "screenshot"
        case browserNavigate = "browser.navigate"
        case browserExecute = "browser.execute"
    }

    enum ActionStatus: String, Codable {
        case pending
        case running
        case completed
        case failed
        case denied
    }
}

/// Response sent back to the server after handling an action.
struct ActionResponse: Codable {
    let actionId: String
    let status: Action.ActionStatus
    let result: String?
    let error: String?
}
