//! The commands the UI can call with `invoke`. Each one is a thin layer over
//! `AppState`, where the logic lives and is tested; each one also needs its
//! own permission (see `build.rs` and `capabilities/default.json`).

use tauri::State;

use crate::error::CommandError;
use crate::state::{AppState, VaultStatus};

/// Whether there is a vault to create, to unlock, or an unlocked one.
#[tauri::command]
pub fn vault_status(state: State<'_, AppState>) -> Result<VaultStatus, CommandError> {
    state.status()
}
