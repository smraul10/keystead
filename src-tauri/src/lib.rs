#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    // Save the window size and position on exit and restore them on launch.
    // Registered on the builder (not in `setup`) so it is ready before the
    // main window is created.
    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_window_state::Builder::default().build());

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
