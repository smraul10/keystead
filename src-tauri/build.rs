fn main() {
    // Least privilege: every command the UI may call is listed here, and gets
    // its own permission (`allow-<command>`) that `capabilities/default.json`
    // grants one by one. A command missing from either list can't be called.
    let manifest =
        tauri_build::AppManifest::new().commands(&["vault_status", "create_vault", "lock_vault"]);

    // A build script reports errors by stopping the build
    #[allow(clippy::expect_used)]
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(manifest))
        .expect("failed to run the Tauri build script");
}
