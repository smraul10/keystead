//! Creating, opening and saving a vault file on disk.

use std::io::Write;
use std::path::Path;

use tempfile::NamedTempFile;

use crate::{Error, KdfParams, Key, Salt, Vault, derive_key, random_salt, seal, unseal};

/// An open vault: its data and the key to save it again. The key never
/// leaves this struct, and it is wiped from memory when this is dropped
/// (when the vault is locked).
#[derive(Debug)]
pub struct UnlockedVault {
    vault: Vault,
    key: Key,
    salt: Salt,
    params: KdfParams,
}

impl UnlockedVault {
    /// Creates a new, empty vault at `path`, with the recommended Argon2
    /// parameters. It never replaces an existing file.
    ///
    /// # Errors
    ///
    /// Returns [`Error::AlreadyExists`] if there is a file at `path`, and the
    /// errors of deriving the key, encrypting and writing the file.
    pub fn create(path: &Path, master_password: &str) -> Result<Self, Error> {
        Self::create_with_params(path, master_password, &KdfParams::RECOMMENDED)
    }

    fn create_with_params(
        path: &Path,
        master_password: &str,
        params: &KdfParams,
    ) -> Result<Self, Error> {
        // A new salt: the same password gives a different key in every vault
        let salt = random_salt()?;
        let created = Self {
            vault: Vault::default(),
            key: derive_key(master_password, &salt, params)?,
            salt,
            params: *params,
        };
        created.write(path, Replace::Never)?;
        Ok(created)
    }

    /// Opens the vault at `path` with the master password.
    ///
    /// # Errors
    ///
    /// Returns [`Error::NotFound`] if there is no file, [`Error::Decryption`]
    /// for a wrong master password or a changed file, and the other errors of
    /// reading and decoding the file.
    pub fn open(path: &Path, master_password: &str) -> Result<Self, Error> {
        let opened = unseal(&std::fs::read(path)?, master_password)?;
        Ok(Self {
            vault: opened.vault,
            key: opened.key,
            salt: opened.salt,
            params: opened.params,
        })
    }

    /// Saves the vault to `path` atomically: the file is either the old
    /// version or the new one, never half written.
    ///
    /// # Errors
    ///
    /// Returns the errors of encrypting and writing the file.
    pub fn save(&self, path: &Path) -> Result<(), Error> {
        self.write(path, Replace::Existing)
    }

    fn write(&self, path: &Path, replace: Replace) -> Result<(), Error> {
        // The key stays in memory, so saving doesn't run Argon2 again
        let bytes = seal(&self.vault, &self.key, &self.salt, &self.params)?;
        write_atomically(path, &bytes, replace)
    }

    /// The items in the vault.
    #[must_use]
    pub fn vault(&self) -> &Vault {
        &self.vault
    }

    /// The items in the vault, to change them before saving.
    pub fn vault_mut(&mut self) -> &mut Vault {
        &mut self.vault
    }
}

/// Whether writing a file may replace one that is already there.
#[derive(Debug, Clone, Copy)]
enum Replace {
    Never,
    Existing,
}

/// Writes `bytes` to `path` so that a crash or a power cut leaves either the
/// old file or the new one, never a half-written one.
fn write_atomically(path: &Path, bytes: &[u8], replace: Replace) -> Result<(), Error> {
    // In the same folder, so the final rename stays on the same disk, where
    // the system does it in one step
    let folder = match path.parent() {
        Some(parent) if !parent.as_os_str().is_empty() => parent,
        _ => Path::new("."),
    };
    let mut temporary = NamedTempFile::new_in(folder)?;
    temporary.write_all(bytes)?;
    // On the disk itself, not only in the system's cache, before it replaces anything
    temporary.as_file().sync_all()?;

    // If anything above failed, dropping `temporary` deleted it
    match replace {
        Replace::Never => temporary.persist_noclobber(path),
        Replace::Existing => temporary.persist(path),
    }
    .map_err(|failed| Error::from(failed.error))?;

    // On Linux and macOS the rename itself must reach the disk too
    #[cfg(unix)]
    std::fs::File::open(folder)?.sync_all()?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Item, decode_header};

    const PASSWORD: &str = "correct horse battery staple";
    // Small parameters, so the tests run fast
    const FAST: KdfParams = KdfParams {
        memory_kib: 8,
        iterations: 1,
        parallelism: 1,
    };

    fn item(id: &str, title: &str) -> Item {
        Item {
            id: id.to_string(),
            title: title.to_string(),
            username: String::new(),
            password: "secret".to_string(),
            url: String::new(),
            notes: String::new(),
            favorite: false,
            created_at: "2026-10-23T10:00:00.000Z".to_string(),
            updated_at: "2026-10-23T10:00:00.000Z".to_string(),
            deleted_at: None,
        }
    }

    // A real folder on disk, deleted when the test ends
    fn folder() -> tempfile::TempDir {
        tempfile::tempdir().unwrap()
    }

    #[test]
    fn creates_an_empty_vault_that_opens_with_its_password() {
        let folder = folder();
        let path = folder.path().join("Personal.kstd");

        UnlockedVault::create_with_params(&path, PASSWORD, &FAST).unwrap();
        let opened = UnlockedVault::open(&path, PASSWORD).unwrap();

        assert!(opened.vault().items.is_empty());
    }

    #[test]
    fn creates_vaults_with_the_recommended_params() {
        let folder = folder();
        let path = folder.path().join("Personal.kstd");

        UnlockedVault::create(&path, PASSWORD).unwrap();

        let header = decode_header(&std::fs::read(&path).unwrap()).unwrap();
        assert_eq!(header.params, KdfParams::RECOMMENDED);
    }

    #[test]
    fn never_creates_a_vault_over_an_existing_file() {
        let folder = folder();
        let path = folder.path().join("Personal.kstd");
        std::fs::write(&path, b"precious").unwrap();

        let result = UnlockedVault::create_with_params(&path, PASSWORD, &FAST);

        assert!(matches!(result, Err(Error::AlreadyExists)));
        assert_eq!(std::fs::read(&path).unwrap(), b"precious");
    }

    #[test]
    fn saves_items_and_opens_them_again() {
        let folder = folder();
        let path = folder.path().join("Personal.kstd");
        let mut vault = UnlockedVault::create_with_params(&path, PASSWORD, &FAST).unwrap();

        vault.vault_mut().items.push(item("1", "GitHub"));
        vault.save(&path).unwrap();

        let opened = UnlockedVault::open(&path, PASSWORD).unwrap();
        assert_eq!(opened.vault().items, [item("1", "GitHub")]);
    }

    #[test]
    fn saving_replaces_the_previous_version() {
        let folder = folder();
        let path = folder.path().join("Personal.kstd");
        let mut vault = UnlockedVault::create_with_params(&path, PASSWORD, &FAST).unwrap();
        vault.vault_mut().items.push(item("1", "GitHub"));
        vault.save(&path).unwrap();

        vault.vault_mut().items.push(item("2", "Gmail"));
        vault.save(&path).unwrap();

        let opened = UnlockedVault::open(&path, PASSWORD).unwrap();
        assert_eq!(opened.vault().items.len(), 2);
    }

    #[test]
    fn saving_leaves_no_temporary_files() {
        let folder = folder();
        let path = folder.path().join("Personal.kstd");
        let vault = UnlockedVault::create_with_params(&path, PASSWORD, &FAST).unwrap();

        vault.save(&path).unwrap();

        let names: Vec<_> = std::fs::read_dir(folder.path())
            .unwrap()
            .map(|entry| entry.unwrap().file_name())
            .collect();
        assert_eq!(names, ["Personal.kstd"]);
    }

    #[test]
    fn a_wrong_master_password_cannot_open_it() {
        let folder = folder();
        let path = folder.path().join("Personal.kstd");
        UnlockedVault::create_with_params(&path, PASSWORD, &FAST).unwrap();

        let result = UnlockedVault::open(&path, "correct horse battery stapler");

        assert!(matches!(result, Err(Error::Decryption)));
    }

    #[test]
    fn says_when_the_vault_file_does_not_exist() {
        let folder = folder();

        let result = UnlockedVault::open(&folder.path().join("Missing.kstd"), PASSWORD);

        assert!(matches!(result, Err(Error::NotFound)));
    }

    #[test]
    fn fails_without_panicking_when_the_folder_does_not_exist() {
        let folder = folder();
        let path = folder.path().join("missing folder").join("Personal.kstd");

        let result = UnlockedVault::create_with_params(&path, PASSWORD, &FAST);

        assert!(result.is_err());
    }
}
