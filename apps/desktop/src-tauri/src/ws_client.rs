//! T-2083: WebSocket client connecting to claw server.
//! Persistent connection with exponential backoff reconnect. JWT auth.

use futures_util::{SinkExt, StreamExt};
use tokio_tungstenite::connect_async;

const INITIAL_BACKOFF_MS: u64 = 1000;
const MAX_BACKOFF_MS: u64 = 60_000;

/// Run the WebSocket client with auto-reconnect.
pub async fn run_ws_client(
    server_url: &str,
    auth_token: &str,
    app_handle: tauri::AppHandle,
) {
    let mut backoff = INITIAL_BACKOFF_MS;

    loop {
        let ws_url = server_url
            .replace("https://", "wss://")
            .replace("http://", "ws://");
        let url = format!("{ws_url}/claw/companion/ws?token={auth_token}");

        tracing::info!("Connecting to {ws_url}...");

        match connect_async(&url).await {
            Ok((ws_stream, _)) => {
                tracing::info!("Connected to claw server");
                backoff = INITIAL_BACKOFF_MS; // Reset backoff on success

                let (mut write, mut read) = ws_stream.split();

                // Send capabilities registration
                let caps = serde_json::json!({
                    "type": "capabilities",
                    "platform": std::env::consts::OS,
                    "version": env!("CARGO_PKG_VERSION"),
                    "actions": ["file_sync", "notification", "screen_lock", "token_sync", "os_control"]
                });
                let _ = write
                    .send(tokio_tungstenite::tungstenite::Message::Text(caps.to_string()))
                    .await;

                // Process incoming messages
                while let Some(msg) = read.next().await {
                    match msg {
                        Ok(tokio_tungstenite::tungstenite::Message::Text(text)) => {
                            handle_server_message(&text, &app_handle).await;
                        }
                        Ok(tokio_tungstenite::tungstenite::Message::Close(_)) => {
                            tracing::info!("Server closed connection");
                            break;
                        }
                        Err(e) => {
                            tracing::warn!("WebSocket error: {e}");
                            break;
                        }
                        _ => {}
                    }
                }
            }
            Err(e) => {
                tracing::warn!("Connection failed: {e}");
            }
        }

        // Reconnect with exponential backoff
        tracing::info!("Reconnecting in {backoff}ms...");
        tokio::time::sleep(std::time::Duration::from_millis(backoff)).await;
        backoff = (backoff * 2).min(MAX_BACKOFF_MS);
    }
}

async fn handle_server_message(text: &str, app_handle: &tauri::AppHandle) {
    let msg: serde_json::Value = match serde_json::from_str(text) {
        Ok(v) => v,
        Err(_) => return,
    };

    let msg_type = msg["type"].as_str().unwrap_or("");

    match msg_type {
        "file_write" => {
            let path = msg["path"].as_str().unwrap_or("");
            let content = msg["content"].as_str().unwrap_or("");
            crate::file_sync::handle_file_write(path, content, app_handle).await;
        }
        "notification" => {
            let title = msg["title"].as_str().unwrap_or("nClaw");
            let body = msg["body"].as_str().unwrap_or("");
            crate::notifications::show_notification(title, body);
        }
        "screen_lock_query" => {
            // Server asking if screen is locked
            let locked = crate::screen_lock::is_screen_locked();
            tracing::debug!("Screen lock status: {locked}");
        }
        _ => {
            tracing::debug!("Unknown message type: {msg_type}");
        }
    }
}
