//! The errors of the vault crate. Nothing here panics: every failure is a
//! value the app can show or handle.

/// Everything that can go wrong in the vault crate.
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("the key derivation parameters are not valid")]
    InvalidKdfParams,

    #[error("the key could not be derived from the master password")]
    KeyDerivation,

    #[error("the system could not provide random bytes")]
    Random,
}
