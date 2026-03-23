//! T-2083: Configuration for the companion app.
//! Reads from ~/.nself-companion/config.toml

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompanionConfig {
    pub server_url: String,
    pub auth_token: String,
    #[serde(default = "default_allowed_paths")]
    pub allowed_paths: Vec<String>,
    #[serde(default)]
    pub auto_sync_tokens: bool,
}

fn default_allowed_paths() -> Vec<String> {
    vec!["~/Sites/*/.claude/inbox/".into()]
}

impl Default for CompanionConfig {
    fn default() -> Self {
        Self {
            server_url: String::new(),
            auth_token: String::new(),
            allowed_paths: default_allowed_paths(),
            auto_sync_tokens: true,
        }
    }
}

pub fn load_config() -> CompanionConfig {
    let config_path = dirs::home_dir()
        .map(|h| h.join(".nself-companion").join("config.toml"))
        .unwrap_or_default();

    if config_path.exists() {
        let content = std::fs::read_to_string(&config_path).unwrap_or_default();
        toml::from_str(&content).unwrap_or_default()
    } else {
        CompanionConfig::default()
    }
}
