import SwiftUI
import ServiceManagement

struct SettingsView: View {
    @ObservedObject var connectionManager: ConnectionManager
    @ObservedObject var serverManager: LocalServerManager

    @AppStorage("serverURL") private var serverURL: String = "wss://api.nself.org/claw/ws"
    @AppStorage("httpPort") private var httpPort: Int = 7710
    @AppStorage("launchAtLogin") private var launchAtLogin: Bool = false
    @AppStorage("notificationsEnabled") private var notificationsEnabled: Bool = true
    @AppStorage("sandboxPaths") private var sandboxPathsRaw: String = ""

    @State private var editingToken: String = ""
    @State private var tokenSaveStatus: String?

    var body: some View {
        TabView {
            generalTab
                .tabItem {
                    Label("General", systemImage: "gear")
                }

            serverTab
                .tabItem {
                    Label("Server", systemImage: "network")
                }

            securityTab
                .tabItem {
                    Label("Security", systemImage: "lock.shield")
                }
        }
        .frame(width: 480, height: 360)
        .onAppear {
            loadToken()
        }
    }

    // MARK: - General Tab

    private var generalTab: some View {
        Form {
            Section("Startup") {
                Toggle("Launch at login", isOn: $launchAtLogin)
                    .onChange(of: launchAtLogin) { newValue in
                        LaunchAtLogin.setEnabled(newValue)
                    }

                Toggle("Show notifications", isOn: $notificationsEnabled)
            }

            Section("Local HTTP Server") {
                HStack {
                    Text("Port:")
                    TextField("Port", value: $httpPort, format: .number)
                        .frame(width: 80)
                    Text("(requires restart)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .formStyle(.grouped)
    }

    // MARK: - Server Tab

    private var serverTab: some View {
        Form {
            Section("nClaw Server") {
                TextField("WebSocket URL", text: $serverURL)
                    .textFieldStyle(.roundedBorder)

                HStack {
                    Text("Status:")
                    Circle()
                        .fill(connectionManager.statusColor)
                        .frame(width: 8, height: 8)
                    Text(connectionManager.state.displayName)
                }

                HStack {
                    Button("Connect") {
                        connectionManager.config = ServerConfig(
                            serverURL: serverURL,
                            port: httpPort
                        )
                        connectionManager.connect()
                    }
                    .disabled(connectionManager.state == .connected)

                    Button("Disconnect") {
                        connectionManager.disconnect()
                    }
                    .disabled(connectionManager.state == .disconnected)
                }
            }

            Section("Authentication") {
                SecureField("JWT Token", text: $editingToken)
                    .textFieldStyle(.roundedBorder)

                HStack {
                    Button("Save to Keychain") {
                        saveToken()
                    }

                    if let status = tokenSaveStatus {
                        Text(status)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .formStyle(.grouped)
    }

    // MARK: - Security Tab

    private var securityTab: some View {
        Form {
            Section("File Access Sandbox") {
                Text("Allowed directories (one per line):")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                TextEditor(text: $sandboxPathsRaw)
                    .font(.system(.body, design: .monospaced))
                    .frame(height: 120)
                    .border(Color.secondary.opacity(0.3))

                Text("File operations are restricted to these paths. Leave empty to use ~/Documents only.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Section("Shell Execution") {
                Text("Shell commands from the server always require explicit user approval via a system dialog before execution.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .formStyle(.grouped)
    }

    // MARK: - Helpers

    private func loadToken() {
        if let token = KeychainHelper.load(key: "nclaw-jwt-token") {
            editingToken = token
        }
    }

    private func saveToken() {
        let success = KeychainHelper.save(key: "nclaw-jwt-token", value: editingToken)
        tokenSaveStatus = success ? "Saved" : "Failed"
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            tokenSaveStatus = nil
        }
    }
}
