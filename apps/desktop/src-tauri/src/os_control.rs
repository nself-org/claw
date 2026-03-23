//! T-2086: OS control macros — keyboard/mouse simulation.
//! Server sends commands, companion executes native input events.

/// Handle an OS control command from the server.
/// Commands: type_text, key_combo, mouse_click, active_window.
pub async fn handle_os_command(command: &serde_json::Value) -> Result<serde_json::Value, String> {
    let action = command["action"].as_str().unwrap_or("");

    match action {
        "type_text" => {
            let text = command["text"].as_str().unwrap_or("");
            type_text(text)?;
            Ok(serde_json::json!({"ok": true}))
        }
        "active_window" => {
            let name = get_active_window_name();
            Ok(serde_json::json!({"window": name}))
        }
        _ => Err(format!("unknown os_control action: {action}")),
    }
}

/// Type text using native keyboard simulation.
/// Uses enigo crate (not included yet — add to Cargo.toml when needed).
fn type_text(text: &str) -> Result<(), String> {
    // Placeholder: requires enigo crate for cross-platform keyboard simulation
    tracing::info!(chars = text.len(), "os_control: type_text");
    Ok(())
}

/// Get the name of the currently active window.
fn get_active_window_name() -> String {
    // Placeholder: requires platform-specific APIs
    // macOS: NSWorkspace.shared.frontmostApplication
    "unknown".into()
}
