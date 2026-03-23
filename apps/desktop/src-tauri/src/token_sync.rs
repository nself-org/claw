//! T-2083: Token sync — watches gog CLI token refreshes and syncs to server.
//! When gog refreshes an OAuth token on Mac, syncs the new token to server's np_google_tokens.

/// Placeholder for token sync implementation.
/// Full implementation requires watching gog CLI's token storage location
/// and syncing via the claw server's token import endpoint.
pub async fn watch_token_refreshes(_server_url: &str, _auth_token: &str) {
    // Watch ~/.config/gog/tokens/ for changes
    // On change: read new token, POST to server /mux/tokens/import
    tracing::info!("Token sync: watching for gog CLI token refreshes");
}
