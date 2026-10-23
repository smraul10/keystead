//! What the app keeps in memory between commands.

use std::path::PathBuf;
use std::sync::Mutex;

use keystead_vault::UnlockedVault;
use serde::Serialize;

use crate::error::CommandError;

/// The name of the vault file inside the app's data folder.
pub const VAULT_FILE_NAME: &str = "Personal.kstd";

/// Where the vault is and, while it is unlocked, the open vault with its key.
/// Locking drops the `UnlockedVault`, which wipes the key and the items.
pub struct AppState {
    path: PathBuf,
    // Tauri may run several commands at once: one at a time may use the vault
    vault: Mutex<Option<UnlockedVault>>,
}

/// What the UI shows at launch: create a vault, unlock it, or the vault.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum VaultStatus {
    NotCreated,
    Locked,
    Unlocked,
}

impl AppState {
    #[must_use]
    pub fn new(path: PathBuf) -> Self {
        Self {
            path,
            vault: Mutex::new(None),
        }
    }

    /// Whether the vault exists, and whether it is unlocked.
    ///
    /// # Errors
    ///
    /// Returns [`CommandError::Storage`] if the disk can't be checked.
    pub fn status(&self) -> Result<VaultStatus, CommandError> {
        // A poisoned lock means a command panicked while using the vault
        let vault = self.vault.lock().map_err(|_| CommandError::Internal)?;
        if vault.is_some() {
            return Ok(VaultStatus::Unlocked);
        }
        if self.path.try_exists().map_err(|_| CommandError::Storage)? {
            Ok(VaultStatus::Locked)
        } else {
            Ok(VaultStatus::NotCreated)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    // A real folder on disk, deleted when the test ends
    fn folder() -> tempfile::TempDir {
        tempfile::tempdir().unwrap()
    }

    #[test]
    fn there_is_no_vault_before_creating_one() {
        let folder = folder();
        let state = AppState::new(folder.path().join(VAULT_FILE_NAME));

        assert_eq!(state.status().unwrap(), VaultStatus::NotCreated);
    }

    #[test]
    fn an_existing_vault_starts_locked() {
        let folder = folder();
        let path = folder.path().join(VAULT_FILE_NAME);
        std::fs::write(&path, b"a vault").unwrap();

        let state = AppState::new(path);

        assert_eq!(state.status().unwrap(), VaultStatus::Locked);
    }

    #[test]
    fn an_open_vault_is_unlocked() {
        let folder = folder();
        let path = folder.path().join(VAULT_FILE_NAME);
        let state = AppState::new(path.clone());

        let vault = UnlockedVault::create(&path, "correct horse battery staple").unwrap();
        *state.vault.lock().unwrap() = Some(vault);

        assert_eq!(state.status().unwrap(), VaultStatus::Unlocked);
    }

    #[test]
    fn the_ui_receives_the_status_in_camel_case() {
        assert_eq!(
            serde_json::to_value(VaultStatus::NotCreated).unwrap(),
            json!("notCreated")
        );
    }
}
