//! nSelf Desktop Companion — system tray app that bridges nClaw server to local machine.
//!
//! Features:
//! - WebSocket connection to claw server (persistent, authenticated, auto-reconnect)
//! - File sync: server pushes inbox messages to local .claude/inbox/ directories
//! - Token sync: watches gog CLI OAuth token refreshes and syncs to server
//! - System notifications: native macOS/Linux notifications from server
//! - Screen lock detection: reports lock status for quiet-mode decisions
//! - Sandboxed file proxy: server file requests require user approval

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod config;
mod file_sync;
mod fs_proxy;
mod notifications;
mod os_control;
mod screen_lock;
mod token_sync;
mod ws_client;

use tauri::Manager;

fn main() {
    tracing_subscriber::fmt()
        .with_env_filter("nself_companion=info")
        .init();

    tauri::Builder::default()
        .plugin(tauri::plugin::notification::init())
        .setup(|app| {
            let config = config::load_config();

            // Create system tray
            let tray = tauri::tray::TrayIconBuilder::new()
                .tooltip("nSelf Companion")
                .menu_on_left_click(true)
                .build(app)?;

            // Start WebSocket connection to claw server
            let app_handle = app.handle().clone();
            let server_url = config.server_url.clone();
            let auth_token = config.auth_token.clone();

            tokio::spawn(async move {
                ws_client::run_ws_client(
                    &server_url,
                    &auth_token,
                    app_handle,
                )
                .await;
            });

            // Start screen lock detector (macOS)
            #[cfg(target_os = "macos")]
            {
                let app_handle2 = app.handle().clone();
                tokio::spawn(async move {
                    screen_lock::watch_screen_lock(app_handle2).await;
                });
            }

            tracing::info!("nSelf Companion started");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
