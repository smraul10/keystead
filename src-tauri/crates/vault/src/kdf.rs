//! Key derivation: from the master password to the key that encrypts the vault.

use argon2::{Algorithm, Argon2, Params, Version};
use zeroize::Zeroizing;

use crate::Error;

/// Length of the encryption key, in bytes (XChaCha20-Poly1305 uses 32).
pub const KEY_LEN: usize = 32;

/// Length of the salt, in bytes.
pub const SALT_LEN: usize = 16;

/// The key that encrypts the vault. Its bytes are overwritten with zeros
/// when it is dropped, so it doesn't stay in memory after use.
pub type Key = Zeroizing<[u8; KEY_LEN]>;

/// Random bytes stored in the vault header, so the same master password
/// gives a different key in every vault.
pub type Salt = [u8; SALT_LEN];

/// How expensive Argon2id is.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct KdfParams {
    /// Memory used, in KiB
    pub memory_kib: u32,
    /// Passes over that memory
    pub iterations: u32,
    /// Lanes computed in parallel
    pub parallelism: u32,
}

impl KdfParams {
    /// RFC 9106's second recommended option (also Bitwarden's default):
    /// 64 MiB, 3 passes, 4 lanes. Each vault stores its own parameters,
    /// so they can be raised later without breaking existing vaults.
    pub const RECOMMENDED: Self = Self {
        memory_kib: 64 * 1024,
        iterations: 3,
        parallelism: 4,
    };
}

/// A new random salt, for a new vault.
///
/// # Errors
///
/// Returns [`Error::Random`] if the operating system can't provide random bytes.
pub fn random_salt() -> Result<Salt, Error> {
    let mut salt = [0; SALT_LEN];
    // The operating system's secure random generator
    getrandom::fill(&mut salt).map_err(|_| Error::Random)?;
    Ok(salt)
}

/// Derives the vault key from the master password with Argon2id.
///
/// # Errors
///
/// Returns [`Error::InvalidKdfParams`] if `params` are out of range, and
/// [`Error::KeyDerivation`] if Argon2 fails.
pub fn derive_key(master_password: &str, salt: &Salt, params: &KdfParams) -> Result<Key, Error> {
    let params = Params::new(
        params.memory_kib,
        params.iterations,
        params.parallelism,
        Some(KEY_LEN),
    )
    .map_err(|_| Error::InvalidKdfParams)?;

    // Argon2id: resists both GPU guessing and side-channel attacks
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);

    let mut key = Zeroizing::new([0; KEY_LEN]);
    argon2
        .hash_password_into(master_password.as_bytes(), salt, key.as_mut())
        .map_err(|_| Error::KeyDerivation)?;
    Ok(key)
}

#[cfg(test)]
mod tests {
    use super::*;

    // Small parameters, so the tests run fast; the recommended ones have their own test
    const FAST: KdfParams = KdfParams {
        memory_kib: 8,
        iterations: 1,
        parallelism: 1,
    };
    const SALT: Salt = [7; SALT_LEN];

    #[test]
    fn the_same_inputs_give_the_same_key() {
        let first = derive_key("correct horse", &SALT, &FAST).unwrap();
        let second = derive_key("correct horse", &SALT, &FAST).unwrap();

        // Otherwise the vault could never be opened again
        assert_eq!(*first, *second);
    }

    #[test]
    fn another_salt_gives_another_key() {
        let first = derive_key("correct horse", &SALT, &FAST).unwrap();
        let second = derive_key("correct horse", &[8; SALT_LEN], &FAST).unwrap();

        assert_ne!(*first, *second);
    }

    #[test]
    fn another_password_gives_another_key() {
        let first = derive_key("correct horse", &SALT, &FAST).unwrap();
        let second = derive_key("correct horsf", &SALT, &FAST).unwrap();

        assert_ne!(*first, *second);
    }

    #[test]
    fn matches_an_independent_implementation() {
        // Computed with Node.js's own Argon2id (crypto.argon2Sync, from OpenSSL),
        // not with this crate: if a change ever altered the derivation, existing
        // vaults would stop opening, and this test would catch it
        const EXPECTED: [u8; KEY_LEN] = [
            0x6d, 0x9d, 0x4c, 0xd2, 0xbf, 0x04, 0x8c, 0x1f, 0x14, 0x22, 0x87, 0xa8, 0x0b, 0x10,
            0x5d, 0x85, 0xf8, 0x68, 0xb7, 0x5b, 0x4e, 0x15, 0xf5, 0x1b, 0xa2, 0x3c, 0x51, 0x3f,
            0x1f, 0xfb, 0x4c, 0xb1,
        ];

        let key = derive_key("correct horse battery staple", &SALT, &FAST).unwrap();

        assert_eq!(*key, EXPECTED);
    }

    #[test]
    fn random_salts_are_different() {
        assert_ne!(random_salt().unwrap(), random_salt().unwrap());
    }

    #[test]
    fn rejects_invalid_params() {
        let no_memory = KdfParams {
            memory_kib: 0,
            ..FAST
        };

        let result = derive_key("correct horse", &SALT, &no_memory);

        assert!(matches!(result, Err(Error::InvalidKdfParams)));
    }

    #[test]
    fn the_recommended_params_follow_rfc_9106() {
        // RFC 9106's second recommended option (also Bitwarden's default)
        assert_eq!(
            KdfParams::RECOMMENDED,
            KdfParams {
                memory_kib: 64 * 1024,
                iterations: 3,
                parallelism: 4,
            }
        );
    }

    #[test]
    fn derives_a_key_with_the_recommended_params() {
        assert!(derive_key("correct horse", &SALT, &KdfParams::RECOMMENDED).is_ok());
    }
}
