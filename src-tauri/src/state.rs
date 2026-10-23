//! What the app keeps in memory between commands.

use std::path::PathBuf;
use std::sync::{Mutex, PoisonError};

use keystead_vault::{Item, UnlockedVault};
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

    /// Creates the vault, protected by `master_password`, and leaves it
    /// unlocked.
    ///
    /// # Errors
    ///
    /// Returns [`CommandError::AlreadyExists`] if there is a vault already
    /// (it is never replaced), or [`CommandError::Storage`] if it can't be
    /// written.
    pub fn create(&self, master_password: &str) -> Result<(), CommandError> {
        let mut vault = self.vault.lock().map_err(|_| CommandError::Internal)?;
        // On first launch, the app's data folder doesn't exist yet
        if let Some(folder) = self.path.parent() {
            std::fs::create_dir_all(folder).map_err(|_| CommandError::Storage)?;
        }
        *vault = Some(UnlockedVault::create(&self.path, master_password)?);
        Ok(())
    }

    /// Opens the vault with `master_password` and keeps it unlocked.
    ///
    /// # Errors
    ///
    /// Returns [`CommandError::WrongPassword`] if the master password doesn't
    /// open it, [`CommandError::NotFound`] if there is no vault, and the
    /// other errors of reading the file.
    pub fn unlock(&self, master_password: &str) -> Result<(), CommandError> {
        let mut vault = self.vault.lock().map_err(|_| CommandError::Internal)?;
        *vault = Some(UnlockedVault::open(&self.path, master_password)?);
        Ok(())
    }

    /// A copy of the items in the unlocked vault, for the UI. The copy is
    /// wiped too when it is dropped, once it has been sent.
    ///
    /// # Errors
    ///
    /// Returns [`CommandError::Locked`] if the vault isn't unlocked.
    pub fn items(&self) -> Result<Vec<Item>, CommandError> {
        let vault = self.vault.lock().map_err(|_| CommandError::Internal)?;
        let unlocked = vault.as_ref().ok_or(CommandError::Locked)?;
        Ok(unlocked.vault().items.clone())
    }

    /// Replaces the items of the unlocked vault and saves it to its file.
    ///
    /// # Errors
    ///
    /// Returns [`CommandError::Locked`] if the vault isn't unlocked, or
    /// [`CommandError::Storage`] if the file can't be written.
    pub fn save(&self, items: Vec<Item>) -> Result<(), CommandError> {
        let mut vault = self.vault.lock().map_err(|_| CommandError::Internal)?;
        let unlocked = vault.as_mut().ok_or(CommandError::Locked)?;
        // The old items are dropped here, and so wiped from memory
        unlocked.vault_mut().items = items;
        unlocked.save(&self.path)?;
        Ok(())
    }

    /// Locks the vault: drops it, which wipes the key and the items.
    pub fn lock(&self) {
        // Locking must always work, even if a command panicked while using
        // the vault (a "poisoned" lock): take the vault out anyway
        let mut vault = self.vault.lock().unwrap_or_else(PoisonError::into_inner);
        *vault = None;
        // Nothing of the old vault is left half-changed: the app can go on
        self.vault.clear_poison();
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
    fn creating_the_vault_leaves_it_unlocked() {
        let folder = folder();
        let path = folder.path().join(VAULT_FILE_NAME);
        let state = AppState::new(path.clone());

        state.create("correct horse battery staple").unwrap();

        assert!(path.exists());
        assert_eq!(state.status().unwrap(), VaultStatus::Unlocked);
    }

    #[test]
    fn creating_the_vault_creates_its_folder() {
        // On first launch, the app's data folder doesn't exist yet
        let folder = folder();
        let path = folder.path().join("missing").join(VAULT_FILE_NAME);
        let state = AppState::new(path.clone());

        state.create("correct horse battery staple").unwrap();

        assert!(path.exists());
    }

    #[test]
    fn never_replaces_an_existing_vault() {
        let folder = folder();
        let path = folder.path().join(VAULT_FILE_NAME);
        std::fs::write(&path, b"a vault").unwrap();
        let state = AppState::new(path.clone());

        let result = state.create("correct horse battery staple");

        assert_eq!(result, Err(CommandError::AlreadyExists));
        assert_eq!(std::fs::read(&path).unwrap(), b"a vault");
        assert_eq!(state.status().unwrap(), VaultStatus::Locked);
    }

    #[test]
    fn locking_forgets_the_open_vault() {
        let folder = folder();
        let state = AppState::new(folder.path().join(VAULT_FILE_NAME));
        state.create("correct horse battery staple").unwrap();

        state.lock();

        assert_eq!(state.status().unwrap(), VaultStatus::Locked);
    }

    #[test]
    #[allow(clippy::panic)] // The panic is what this test is about
    fn locking_works_even_after_a_command_panicked() {
        let folder = folder();
        let state = AppState::new(folder.path().join(VAULT_FILE_NAME));
        state.create("correct horse battery staple").unwrap();
        // A panic while holding the lock "poisons" it
        let panicked = std::thread::scope(|scope| {
            scope
                .spawn(|| {
                    let _vault = state.vault.lock().unwrap();
                    panic!("a bug in some command");
                })
                .join()
                .is_err()
        });
        assert!(panicked);

        state.lock();

        assert_eq!(state.status().unwrap(), VaultStatus::Locked);
    }

    fn github() -> Item {
        Item {
            id: "1".to_string(),
            title: "GitHub".to_string(),
            username: "raul-dev".to_string(),
            password: "b,YjHm4^9aBBNC[zP]GD".to_string(),
            url: "https://github.com".to_string(),
            notes: String::new(),
            favorite: true,
            created_at: "2026-03-14T10:12:00.000Z".to_string(),
            updated_at: "2026-09-02T18:40:00.000Z".to_string(),
            deleted_at: None,
        }
    }

    // A vault on disk with one item, locked: as when the app starts
    fn locked_vault_with_an_item(folder: &tempfile::TempDir) -> AppState {
        let path = folder.path().join(VAULT_FILE_NAME);
        let mut vault = UnlockedVault::create(&path, "correct horse battery staple").unwrap();
        vault.vault_mut().items.push(github());
        vault.save(&path).unwrap();
        AppState::new(path)
    }

    #[test]
    fn unlocking_opens_the_vault_with_its_items() {
        let folder = folder();
        let state = locked_vault_with_an_item(&folder);

        state.unlock("correct horse battery staple").unwrap();

        assert_eq!(state.status().unwrap(), VaultStatus::Unlocked);
        assert_eq!(state.items().unwrap(), vec![github()]);
    }

    #[test]
    fn a_wrong_master_password_keeps_the_vault_locked() {
        let folder = folder();
        let state = locked_vault_with_an_item(&folder);

        let result = state.unlock("wrong password");

        assert_eq!(result, Err(CommandError::WrongPassword));
        assert_eq!(state.status().unwrap(), VaultStatus::Locked);
    }

    #[test]
    fn there_is_nothing_to_unlock_before_creating_a_vault() {
        let folder = folder();
        let state = AppState::new(folder.path().join(VAULT_FILE_NAME));

        let result = state.unlock("correct horse battery staple");

        assert_eq!(result, Err(CommandError::NotFound));
    }

    #[test]
    fn saving_writes_the_items_to_the_file() {
        let folder = folder();
        let state = locked_vault_with_an_item(&folder);
        state.unlock("correct horse battery staple").unwrap();
        let mut gitlab = github();
        gitlab.id = "2".to_string();
        gitlab.title = "GitLab".to_string();

        state.save(vec![github(), gitlab.clone()]).unwrap();

        // Opened again from the file, as after restarting the app
        let reopened = AppState::new(state.path.clone());
        reopened.unlock("correct horse battery staple").unwrap();
        assert_eq!(reopened.items().unwrap(), vec![github(), gitlab]);
    }

    #[test]
    fn a_locked_vault_cannot_be_saved() {
        let folder = folder();
        let state = locked_vault_with_an_item(&folder);

        assert_eq!(state.save(Vec::new()), Err(CommandError::Locked));
    }

    #[test]
    fn a_locked_vault_shows_no_items() {
        let folder = folder();
        let state = locked_vault_with_an_item(&folder);

        assert_eq!(state.items(), Err(CommandError::Locked));
    }

    #[test]
    fn the_ui_receives_the_status_in_camel_case() {
        assert_eq!(
            serde_json::to_value(VaultStatus::NotCreated).unwrap(),
            json!("notCreated")
        );
    }
}
