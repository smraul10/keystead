//! Keystead's encrypted vault: key derivation, encryption and the vault file.
//!
//! This crate doesn't depend on Tauri or the UI, so it can be tested on its
//! own (`cargo test -p keystead-vault`) and stays small enough to review.

mod error;
mod kdf;
mod model;

pub use error::Error;
pub use kdf::{KEY_LEN, KdfParams, Key, SALT_LEN, Salt, derive_key, random_salt};
pub use model::{Item, Vault};

/// The first bytes of every vault file, to recognize it before reading more.
pub const MAGIC: [u8; 4] = *b"KSTD";

/// The version of the vault file format. It goes up when the format changes,
/// so newer versions of the app can still open older files.
pub const FORMAT_VERSION: u16 = 1;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn vault_files_start_with_the_magic_bytes() {
        assert_eq!(&MAGIC, b"KSTD");
    }

    #[test]
    fn the_format_starts_at_version_1() {
        assert_eq!(FORMAT_VERSION, 1);
    }
}
