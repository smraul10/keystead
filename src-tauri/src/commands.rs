//! The commands the UI can call with `invoke`. Each one is a thin layer over
//! `AppState`, where the logic lives and is tested; each one also needs its
//! own permission (see `build.rs` and `capabilities/default.json`).

use keystead_vault::Item;
use tauri::State;
use zeroize::Zeroizing;

use crate::error::CommandError;
use crate::state::{AppState, VaultStatus};

/// Whether there is a vault to create, to unlock, or an unlocked one.
#[tauri::command]
pub fn vault_status(state: State<'_, AppState>) -> Result<VaultStatus, CommandError> {
    state.status()
}

/// Creates the vault with this master password and leaves it unlocked.
///
/// `async` so it runs outside the main thread: Argon2 takes a moment on
/// purpose, and the window must keep responding meanwhile.
#[tauri::command]
pub async fn create_vault(
    state: State<'_, AppState>,
    master_password: String,
) -> Result<(), CommandError> {
    // Wiped from memory as soon as this command ends
    let master_password = Zeroizing::new(master_password);
    state.create(&master_password)
}

/// Opens the vault with this master password and keeps it unlocked.
///
/// `async` like `create_vault`: Argon2 runs outside the main thread.
#[tauri::command]
pub async fn unlock_vault(
    state: State<'_, AppState>,
    master_password: String,
) -> Result<(), CommandError> {
    // Wiped from memory as soon as this command ends
    let master_password = Zeroizing::new(master_password);
    state.unlock(&master_password)
}

/// The items in the unlocked vault.
#[tauri::command]
pub fn vault_items(state: State<'_, AppState>) -> Result<Vec<Item>, CommandError> {
    state.items()
}

/// Replaces the items of the unlocked vault and saves it to its file.
///
/// `async` so encrypting and writing the file happen outside the main thread.
#[tauri::command]
pub async fn save_vault(state: State<'_, AppState>, items: Vec<Item>) -> Result<(), CommandError> {
    state.save(items)
}

/// Locks the vault: wipes its key and its items from memory.
#[tauri::command]
pub fn lock_vault(state: State<'_, AppState>) {
    state.lock();
}
