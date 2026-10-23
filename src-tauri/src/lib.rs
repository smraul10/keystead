mod commands;
mod error;
mod state;

use tauri::Manager;

use crate::state::{AppState, VAULT_FILE_NAME};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    // Save the window size and position on exit and restore them on launch.
    // Registered on the builder (not in `setup`) so it is ready before the
    // main window is created.
    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_window_state::Builder::default().build());

    // If Tauri itself can't start there is no window to show an error in:
    // stopping with a message is the only option
    #[allow(clippy::expect_used)]
    builder
        .setup(|app| {
            // One vault, in the app's data folder (on Windows, inside %APPDATA%)
            let folder = app.path().app_data_dir()?;
            app.manage(AppState::new(folder.join(VAULT_FILE_NAME)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::vault_status,
            commands::create_vault,
            commands::lock_vault,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
