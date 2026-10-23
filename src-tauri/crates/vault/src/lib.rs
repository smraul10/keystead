//! Keystead's encrypted vault: key derivation, encryption and the vault file.
//!
//! This crate doesn't depend on Tauri or the UI, so it can be tested on its
//! own (`cargo test -p keystead-vault`) and stays small enough to review.

mod cipher;
mod error;
mod format;
mod kdf;
mod model;

pub use cipher::{NONCE_LEN, Nonce, TAG_LEN, decrypt, encrypt, random_nonce};
pub use error::Error;
pub use format::{
    FORMAT_VERSION, HEADER_LEN, Header, MAGIC, MAX_ITERATIONS, MAX_MEMORY_KIB, MAX_PARALLELISM,
    Unsealed, decode_header, encode_header, seal, unseal,
};
pub use kdf::{KEY_LEN, KdfParams, Key, SALT_LEN, Salt, derive_key, random_salt};
pub use model::{Item, Vault};
