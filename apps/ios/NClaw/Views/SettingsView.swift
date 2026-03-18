import SwiftUI

struct SettingsView: View {
    @State private var serverURL: String = ClawClient.serverURL
    @State private var apiKey: String = ClawClient.apiKey
    @State private var showSavedBanner: Bool = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Server URL")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        TextField("https://your-server.example.com", text: $serverURL)
                            .textContentType(.URL)
                            .autocapitalization(.none)
                            .disableAutocorrection(true)
                            .keyboardType(.URL)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text("API Key")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        SecureField("Bearer token", text: $apiKey)
                            .autocapitalization(.none)
                            .disableAutocorrection(true)
                    }
                } header: {
                    Text("Connection")
                } footer: {
                    Text("Enter the URL and API key of your nSelf server running the claw plugin.")
                }

                Section {
                    Button("Save") {
                        ClawClient.serverURL = serverURL
                        ClawClient.apiKey = apiKey
                        showSavedBanner = true
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                            showSavedBanner = false
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .foregroundStyle(Color(hex: 0x6366F1))
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color(hex: 0x0F0F1A))
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .overlay(alignment: .top) {
                if showSavedBanner {
                    Text("Settings saved")
                        .font(.subheadline.weight(.medium))
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Color(hex: 0x6366F1).opacity(0.9))
                        .foregroundStyle(.white)
                        .clipShape(Capsule())
                        .transition(.move(edge: .top).combined(with: .opacity))
                        .padding(.top, 8)
                }
            }
            .animation(.easeInOut, value: showSavedBanner)
        }
    }
}
