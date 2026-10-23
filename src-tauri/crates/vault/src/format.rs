//! The vault file format: a header in clear, then the encrypted vault.
//!
//! ```text
//! offset  size  field
//! 0       4     magic "KSTD"
//! 4       2     format version (u16, little endian)
//! 6       4     Argon2 memory in KiB (u32, little endian)
//! 10      4     Argon2 iterations (u32, little endian)
//! 14      4     Argon2 parallelism (u32, little endian)
//! 18      16    salt
//! 34      24    nonce
//! 58      ...   the vault as JSON, encrypted, followed by the 16-byte tag
//! ```
//!
//! The header is not encrypted (the salt and parameters are needed to derive
//! the key), but it is the associated data of the encryption: changing any
//! byte of it makes decryption fail.

use zeroize::Zeroizing;

use crate::{
    Error, KdfParams, Key, Nonce, Salt, TAG_LEN, Vault, decrypt, derive_key, encrypt, random_nonce,
};

/// The first bytes of every vault file, to recognize it before reading more.
pub const MAGIC: [u8; 4] = *b"KSTD";

/// The version of the vault file format. It goes up when the format changes,
/// so newer versions of the app can still open older files.
pub const FORMAT_VERSION: u16 = 1;

/// Length of the header, in bytes.
pub const HEADER_LEN: usize = 58;

/// The most memory a vault may ask Argon2 for: 1 GiB.
pub const MAX_MEMORY_KIB: u32 = 1024 * 1024;

/// The most passes a vault may ask Argon2 for.
pub const MAX_ITERATIONS: u32 = 10;

/// The most lanes a vault may ask Argon2 for.
pub const MAX_PARALLELISM: u32 = 16;

/// What the header of a vault file says.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Header {
    pub params: KdfParams,
    pub salt: Salt,
    pub nonce: Nonce,
}

/// An opened vault, with what it takes to save it again without asking for
/// the master password: the key is wiped from memory when this is dropped.
// No Debug: it would print the key
pub struct Unsealed {
    pub vault: Vault,
    pub key: Key,
    pub salt: Salt,
    pub params: KdfParams,
}

/// Writes the header bytes.
#[must_use]
pub fn encode_header(header: &Header) -> [u8; HEADER_LEN] {
    let mut bytes = [0; HEADER_LEN];
    bytes[0..4].copy_from_slice(&MAGIC);
    bytes[4..6].copy_from_slice(&FORMAT_VERSION.to_le_bytes());
    bytes[6..10].copy_from_slice(&header.params.memory_kib.to_le_bytes());
    bytes[10..14].copy_from_slice(&header.params.iterations.to_le_bytes());
    bytes[14..18].copy_from_slice(&header.params.parallelism.to_le_bytes());
    bytes[18..34].copy_from_slice(&header.salt);
    bytes[34..58].copy_from_slice(&header.nonce);
    bytes
}

/// Reads and checks the header at the start of a vault file.
///
/// # Errors
///
/// Returns [`Error::InvalidFile`] if the file is too short to be a vault,
/// [`Error::NotAVault`] if it doesn't start with the magic bytes,
/// [`Error::UnsupportedVersion`] for another format version, and
/// [`Error::UnsupportedKdfParams`] if the parameters are beyond the limits.
pub fn decode_header(file: &[u8]) -> Result<Header, Error> {
    // Even an empty vault has a header and a tag
    if file.len() < HEADER_LEN + TAG_LEN {
        return Err(Error::InvalidFile);
    }
    if file[0..4] != MAGIC {
        return Err(Error::NotAVault);
    }
    let version = u16::from_le_bytes(bytes_at(file, 4)?);
    if version != FORMAT_VERSION {
        return Err(Error::UnsupportedVersion(version));
    }

    let params = KdfParams {
        memory_kib: u32::from_le_bytes(bytes_at(file, 6)?),
        iterations: u32::from_le_bytes(bytes_at(file, 10)?),
        parallelism: u32::from_le_bytes(bytes_at(file, 14)?),
    };
    // Checked now, before the tag can be: Argon2 would try to use whatever
    // memory the file asks for
    if params.memory_kib > MAX_MEMORY_KIB
        || params.iterations > MAX_ITERATIONS
        || params.parallelism > MAX_PARALLELISM
    {
        return Err(Error::UnsupportedKdfParams);
    }

    Ok(Header {
        params,
        salt: bytes_at(file, 18)?,
        nonce: bytes_at(file, 34)?,
    })
}

/// The `N` bytes of `file` starting at `offset`, as an array.
fn bytes_at<const N: usize>(file: &[u8], offset: usize) -> Result<[u8; N], Error> {
    file.get(offset..offset + N)
        .and_then(|slice| slice.try_into().ok())
        .ok_or(Error::InvalidFile)
}

/// Encrypts the vault into the bytes of a vault file, with a new nonce.
///
/// # Errors
///
/// Returns [`Error::Random`] if no nonce can be generated and
/// [`Error::Encryption`] if the vault can't be encrypted.
pub fn seal(vault: &Vault, key: &Key, salt: &Salt, params: &KdfParams) -> Result<Vec<u8>, Error> {
    let nonce = random_nonce()?;
    let header = encode_header(&Header {
        params: *params,
        salt: *salt,
        nonce,
    });
    let json = vault_to_json(vault)?;
    // The header is the associated data: authenticated, not encrypted
    let ciphertext = encrypt(key, &nonce, &json, &header)?;

    let mut file = Vec::with_capacity(HEADER_LEN + ciphertext.len());
    file.extend_from_slice(&header);
    file.extend_from_slice(&ciphertext);
    Ok(file)
}

/// The vault as JSON, wiped from memory when dropped.
fn vault_to_json(vault: &Vault) -> Result<Zeroizing<Vec<u8>>, Error> {
    // A buffer that grows moves its contents to a bigger place and frees the
    // old one without wiping it, leaving copies of the passwords behind.
    // So: count the bytes first, then write into a buffer of exactly that size
    let mut counter = ByteCounter(0);
    serde_json::to_writer(&mut counter, vault).map_err(|_| Error::Encryption)?;

    let mut json = Zeroizing::new(Vec::with_capacity(counter.0));
    serde_json::to_writer(&mut *json, vault).map_err(|_| Error::Encryption)?;
    Ok(json)
}

/// A writer that only counts the bytes written to it.
struct ByteCounter(usize);

impl std::io::Write for ByteCounter {
    fn write(&mut self, bytes: &[u8]) -> std::io::Result<usize> {
        self.0 += bytes.len();
        Ok(bytes.len())
    }

    fn flush(&mut self) -> std::io::Result<()> {
        Ok(())
    }
}

/// Opens the bytes of a vault file with the master password.
///
/// # Errors
///
/// Returns the header errors of [`decode_header`], [`Error::Decryption`] for
/// a wrong master password or a changed file, and [`Error::InvalidFile`] if
/// the decrypted content isn't a vault.
pub fn unseal(file: &[u8], master_password: &str) -> Result<Unsealed, Error> {
    let header = decode_header(file)?;
    let key = derive_key(master_password, &header.salt, &header.params)?;
    let (header_bytes, ciphertext) = file.split_at(HEADER_LEN);
    let json = decrypt(&key, &header.nonce, ciphertext, header_bytes)?;
    // Authenticated, so it can't have been changed: a failure here is a bug
    let vault = serde_json::from_slice(&json).map_err(|_| Error::InvalidFile)?;

    Ok(Unsealed {
        vault,
        key,
        salt: header.salt,
        params: header.params,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Item, NONCE_LEN, SALT_LEN, TAG_LEN, derive_key};

    const PASSWORD: &str = "correct horse battery staple";
    // Small parameters, so the tests run fast
    const FAST: KdfParams = KdfParams {
        memory_kib: 8,
        iterations: 1,
        parallelism: 1,
    };
    const SALT: Salt = [7; SALT_LEN];

    fn header() -> Header {
        Header {
            params: KdfParams {
                memory_kib: 64 * 1024,
                iterations: 3,
                parallelism: 4,
            },
            salt: [1; SALT_LEN],
            nonce: [2; NONCE_LEN],
        }
    }

    fn vault() -> Vault {
        Vault {
            items: vec![Item {
                id: "1".to_string(),
                title: "GitHub".to_string(),
                username: "raul-dev".to_string(),
                password: "b,YjHm4^9aBBNC[zP]GD".to_string(),
                url: "https://github.com".to_string(),
                notes: String::new(),
                favorite: true,
                created_at: "2026-03-14T10:12:00.000Z".to_string(),
                updated_at: "2026-09-02T18:40:00.000Z".to_string(),
                deleted_at: None,
                icon: None,
            }],
        }
    }

    fn sealed() -> Vec<u8> {
        let key = derive_key(PASSWORD, &SALT, &FAST).unwrap();
        seal(&vault(), &key, &SALT, &FAST).unwrap()
    }

    #[test]
    fn vault_files_start_with_the_magic_bytes() {
        assert_eq!(&MAGIC, b"KSTD");
    }

    #[test]
    fn the_format_starts_at_version_1() {
        assert_eq!(FORMAT_VERSION, 1);
    }

    #[test]
    fn writes_the_header_in_the_documented_layout() {
        let bytes = encode_header(&header());

        assert_eq!(&bytes[0..4], b"KSTD");
        assert_eq!(&bytes[4..6], &[1, 0]); // version 1, little endian
        assert_eq!(&bytes[6..10], &(64 * 1024u32).to_le_bytes());
        assert_eq!(&bytes[10..14], &3u32.to_le_bytes());
        assert_eq!(&bytes[14..18], &4u32.to_le_bytes());
        assert_eq!(&bytes[18..34], &[1; SALT_LEN]);
        assert_eq!(&bytes[34..58], &[2; NONCE_LEN]);
    }

    #[test]
    fn reads_back_the_header_it_writes() {
        let mut file = encode_header(&header()).to_vec();
        file.extend_from_slice(&[0; TAG_LEN]);

        assert_eq!(decode_header(&file).unwrap(), header());
    }

    #[test]
    fn rejects_a_file_too_short_to_be_a_vault() {
        let header_only = encode_header(&header());

        assert!(matches!(
            decode_header(&header_only),
            Err(Error::InvalidFile)
        ));
    }

    #[test]
    fn rejects_a_file_that_is_not_a_vault() {
        let mut file = sealed();
        file[0..4].copy_from_slice(b"%PDF");

        assert!(matches!(decode_header(&file), Err(Error::NotAVault)));
    }

    #[test]
    fn rejects_a_newer_format_version() {
        let mut file = sealed();
        file[4..6].copy_from_slice(&2u16.to_le_bytes());

        assert!(matches!(
            decode_header(&file),
            Err(Error::UnsupportedVersion(2))
        ));
    }

    #[test]
    fn rejects_unsafe_kdf_params_before_deriving_the_key() {
        // 4 TiB of memory: deriving the key would hang or crash the app
        for (offset, too_much) in [
            (6, MAX_MEMORY_KIB + 1),
            (10, MAX_ITERATIONS + 1),
            (14, MAX_PARALLELISM + 1),
            (6, u32::MAX),
        ] {
            let mut file = sealed();
            file[offset..offset + 4].copy_from_slice(&too_much.to_le_bytes());

            assert!(
                matches!(unseal(&file, PASSWORD), Err(Error::UnsupportedKdfParams)),
                "offset {offset}"
            );
        }
    }

    #[test]
    fn opens_what_it_seals() {
        let opened = unseal(&sealed(), PASSWORD).unwrap();

        assert_eq!(opened.vault, vault());
        assert_eq!(opened.salt, SALT);
        assert_eq!(opened.params, FAST);
        // The same key, so the vault can be saved again without the password
        assert_eq!(*opened.key, *derive_key(PASSWORD, &SALT, &FAST).unwrap());
    }

    #[test]
    fn a_wrong_master_password_cannot_open_it() {
        let result = unseal(&sealed(), "correct horse battery stapler");

        assert!(matches!(result, Err(Error::Decryption)));
    }

    #[test]
    fn detects_a_changed_header() {
        // Still within the limits, so only the authentication can catch it
        let mut file = sealed();
        file[10..14].copy_from_slice(&2u32.to_le_bytes());

        assert!(matches!(unseal(&file, PASSWORD), Err(Error::Decryption)));
    }

    #[test]
    fn every_save_uses_a_new_nonce() {
        let first = sealed();
        let second = sealed();

        // Same salt (the same key), different nonce and ciphertext
        assert_eq!(first[18..34], second[18..34]);
        assert_ne!(first[34..58], second[34..58]);
        assert_ne!(first[HEADER_LEN..], second[HEADER_LEN..]);
    }

    #[test]
    fn opens_a_vault_saved_with_format_version_1() {
        // Created once, when version 1 was introduced, and never regenerated:
        // if a change ever broke reading version 1, users' vaults would stop
        // opening, and this test would catch it
        let file = include_bytes!("../tests/fixtures/v1.kstd");

        let opened = unseal(file, PASSWORD).unwrap();

        let titles: Vec<&str> = opened
            .vault
            .items
            .iter()
            .map(|item| item.title.as_str())
            .collect();
        assert_eq!(titles, ["GitHub", "Home Wi-Fi"]);
        assert_eq!(opened.vault.items[0].password, "b,YjHm4^9aBBNC[zP]GD");
        assert_eq!(
            opened.vault.items[1].deleted_at.as_deref(),
            Some("2026-10-22T10:00:00.000Z")
        );
        assert_eq!(opened.params, FAST);
    }

    #[test]
    fn writes_the_json_into_a_buffer_of_the_exact_size() {
        // A buffer that grows leaves copies of its earlier contents in memory,
        // where nobody wipes them: this one never has to grow
        let json = vault_to_json(&vault()).unwrap();

        assert_eq!(json.capacity(), json.len());
        assert_eq!(serde_json::from_slice::<Vault>(&json).unwrap(), vault());
    }

    #[test]
    fn the_file_does_not_contain_the_vault_in_clear() {
        let file = sealed();

        assert!(!file.windows(6).any(|window| window == b"GitHub"));
    }
}
