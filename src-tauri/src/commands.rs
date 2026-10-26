//! The commands the UI can call with `invoke`. Each one is a thin layer over
//! `AppState`, where the logic lives and is tested; each one also needs its
//! own permission (see `build.rs` and `capabilities/default.json`).

use keystead_vault::Item;
use tauri::{AppHandle, Manager, State, WebviewWindow};
use zeroize::Zeroizing;

use crate::clipboard::{SecretClipboard, clear_after};
use crate::error::CommandError;
use crate::icon;
use crate::state::{AppState, VaultStatus};
use crate::theme::{ThemeSetting, window_theme};

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

/// Downloads the icon of the website at `url`, for the item form: a PNG of
/// at most 64×64 pixels, in base64. The only command that uses the network.
///
/// The download runs on a thread meant for blocking work: waiting for a slow
/// website must block neither the window nor the other commands.
#[tauri::command]
pub async fn download_icon(url: String) -> Result<String, CommandError> {
    tauri::async_runtime::spawn_blocking(move || icon::download_icon(&url))
        .await
        .map_err(|_| CommandError::Internal)?
}

/// Copies `text` to the clipboard, kept out of the Windows clipboard history,
/// and wipes it after the seconds chosen in Settings (within limits) if the
/// clipboard still holds it. Returns the seconds used, for the countdown the
/// UI shows.
#[tauri::command]
pub fn copy_to_clipboard(
    app: AppHandle,
    clipboard: State<'_, SecretClipboard>,
    text: String,
    clear_after_seconds: u64,
) -> Result<u64, CommandError> {
    // Wiped from memory as soon as this command ends
    let text = Zeroizing::new(text);
    let delay = clear_after(clear_after_seconds);
    let copy = clipboard.copy(&text)?;
    // A thread that only sleeps: it blocks nothing, and newer copies have
    // their own (an older timer leaves them alone)
    std::thread::spawn(move || {
        std::thread::sleep(delay);
        app.state::<SecretClipboard>().clear_copy(copy);
    });
    Ok(delay.as_secs())
}

/// Wipes what Keystead copied right away ("Clear now"), if the clipboard
/// still holds it.
#[tauri::command]
pub fn clear_clipboard(clipboard: State<'_, SecretClipboard>) {
    clipboard.clear();
}

/// Paints the window's title bar (drawn by Windows) in the theme chosen in
/// Settings, so it matches the app.
#[tauri::command]
pub fn set_window_theme(window: WebviewWindow, theme: ThemeSetting) -> Result<(), CommandError> {
    window
        .set_theme(window_theme(theme))
        .map_err(|_| CommandError::Internal)
}

/// Locks the vault: wipes its key and its items from memory, and what was
/// copied from it from the clipboard.
#[tauri::command]
pub fn lock_vault(state: State<'_, AppState>, clipboard: State<'_, SecretClipboard>) {
    state.lock();
    clipboard.clear();
}
