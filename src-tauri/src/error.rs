//! The errors the commands send to the UI.

use serde::Serialize;

/// Errors as the UI receives them: `{ "kind": "wrongPassword" }`. The UI has
/// the same type as a discriminated union and decides what to show for each
/// kind; nothing here (paths, system messages) leaks to the screen.
#[derive(Debug, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum CommandError {
    /// The master password doesn't open the vault (or the file was changed)
    WrongPassword,
    /// The vault file isn't one, or it is damaged
    DamagedFile,
    /// The vault was saved by a newer version of Keystead
    NewerVersion { version: u16 },
    /// There is no vault yet
    NotFound,
    /// There is already a vault, so a new one can't be created
    AlreadyExists,
    /// The disk couldn't be read or written (permissions, full disk...)
    Storage,
    /// Something that should never happen: a bug
    Internal,
}

impl From<keystead_vault::Error> for CommandError {
    fn from(error: keystead_vault::Error) -> Self {
        use keystead_vault::Error;

        // No `_ =>` arm on purpose: a new vault error won't compile until
        // someone decides what the UI should see for it
        match error {
            Error::Decryption => Self::WrongPassword,
            Error::InvalidFile | Error::NotAVault | Error::UnsupportedKdfParams => {
                Self::DamagedFile
            }
            Error::UnsupportedVersion(version) => Self::NewerVersion { version },
            Error::NotFound => Self::NotFound,
            Error::AlreadyExists => Self::AlreadyExists,
            Error::Io(_) => Self::Storage,
            Error::InvalidKdfParams | Error::KeyDerivation | Error::Random | Error::Encryption => {
                Self::Internal
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use keystead_vault::Error;
    use serde_json::json;

    #[test]
    fn the_ui_receives_the_kind_as_a_tag() {
        assert_eq!(
            serde_json::to_value(CommandError::WrongPassword).unwrap(),
            json!({ "kind": "wrongPassword" })
        );
        assert_eq!(
            serde_json::to_value(CommandError::NewerVersion { version: 2 }).unwrap(),
            json!({ "kind": "newerVersion", "version": 2 })
        );
    }

    #[test]
    fn a_failed_decryption_is_a_wrong_password() {
        assert_eq!(
            CommandError::from(Error::Decryption),
            CommandError::WrongPassword
        );
    }

    #[test]
    fn unreadable_files_are_damaged_files() {
        for error in [
            Error::InvalidFile,
            Error::NotAVault,
            Error::UnsupportedKdfParams,
        ] {
            assert_eq!(CommandError::from(error), CommandError::DamagedFile);
        }
    }

    #[test]
    fn a_newer_format_says_which_version() {
        assert_eq!(
            CommandError::from(Error::UnsupportedVersion(2)),
            CommandError::NewerVersion { version: 2 }
        );
    }

    #[test]
    fn file_system_errors_keep_their_meaning() {
        assert_eq!(CommandError::from(Error::NotFound), CommandError::NotFound);
        assert_eq!(
            CommandError::from(Error::AlreadyExists),
            CommandError::AlreadyExists
        );
        assert_eq!(
            CommandError::from(Error::Io(std::io::Error::other("disk full"))),
            CommandError::Storage
        );
    }

    #[test]
    fn crypto_failures_are_internal_errors() {
        for error in [
            Error::InvalidKdfParams,
            Error::KeyDerivation,
            Error::Random,
            Error::Encryption,
        ] {
            assert_eq!(CommandError::from(error), CommandError::Internal);
        }
    }
}
