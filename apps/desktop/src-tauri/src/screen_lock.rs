//! T-2088: Screen lock detection.
//! Reports macOS screen lock/unlock status to the claw server.

/// Check if the screen is currently locked (macOS).
#[cfg(target_os = "macos")]
pub fn is_screen_locked() -> bool {
    // Use CGSessionCopyCurrentDictionary to check lock state.
    // For now, return false (unlocked) as a safe default.
    // Full implementation requires Core Graphics framework binding.
    false
}

#[cfg(not(target_os = "macos"))]
pub fn is_screen_locked() -> bool {
    false
}

/// Watch for screen lock/unlock events and notify the server.
#[cfg(target_os = "macos")]
pub async fn watch_screen_lock(_app_handle: tauri::AppHandle) {
    // macOS: subscribe to com.apple.screenIsLocked / com.apple.screenIsUnlocked
    // distributed notifications via NSDistributedNotificationCenter.
    // Requires objc bindings or Swift bridge.
    tracing::info!("Screen lock watcher started (macOS)");

    // Poll-based fallback: check every 30 seconds
    loop {
        tokio::time::sleep(std::time::Duration::from_secs(30)).await;
        let locked = is_screen_locked();
        tracing::debug!(locked, "screen lock status");
    }
}

#[cfg(not(target_os = "macos"))]
pub async fn watch_screen_lock(_app_handle: tauri::AppHandle) {
    tracing::info!("Screen lock watcher not available on this platform");
}
