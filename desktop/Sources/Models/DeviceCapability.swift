import Foundation

/// Capability report sent to the nself-claw server on WebSocket connect.
/// Tells the server what this daemon can do.
struct DeviceCapability: Codable {
    let daemon: String
    let version: String
    let platform: String
    let hostname: String
    let capabilities: [String]

    static func current() -> DeviceCapability {
        return DeviceCapability(
            daemon: "nclaw-desktop",
            version: "0.1.0",
            platform: "macOS \(ProcessInfo.processInfo.operatingSystemVersionString)",
            hostname: Host.current().localizedName ?? ProcessInfo.processInfo.hostName,
            capabilities: [
                "file.read",
                "file.write",
                "file.list",
                "file.delete",
                "file.mkdir",
                "shell.exec",
                "clipboard.read",
                "clipboard.write",
                "screenshot"
                // "browser.navigate" and "browser.execute" omitted — not yet implemented
            ]
        )
    }
}
