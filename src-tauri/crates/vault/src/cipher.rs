//! Authenticated encryption of the vault with XChaCha20-Poly1305.

use chacha20poly1305::aead::{Aead, Payload};
use chacha20poly1305::{KeyInit, XChaCha20Poly1305, XNonce};
use zeroize::Zeroizing;

use crate::{Error, Key};

/// Length of the nonce, in bytes. XChaCha20's long nonce can be random:
/// two saves will practically never pick the same one.
pub const NONCE_LEN: usize = 24;

/// Length of the authentication tag added to the ciphertext, in bytes.
pub const TAG_LEN: usize = 16;

/// A "number used once": new random bytes for every save, stored in the header.
pub type Nonce = [u8; NONCE_LEN];

/// A new random nonce, for a new save.
///
/// # Errors
///
/// Returns [`Error::Random`] if the operating system can't provide random bytes.
pub fn random_nonce() -> Result<Nonce, Error> {
    let mut nonce = [0; NONCE_LEN];
    getrandom::fill(&mut nonce).map_err(|_| Error::Random)?;
    Ok(nonce)
}

/// Encrypts `plaintext` and seals it, together with `aad`, under a tag.
///
/// # Errors
///
/// Returns [`Error::Encryption`] if the cipher fails.
pub fn encrypt(key: &Key, nonce: &Nonce, plaintext: &[u8], aad: &[u8]) -> Result<Vec<u8>, Error> {
    // Borrow the key's bytes instead of copying them into a value nobody wipes
    let cipher =
        XChaCha20Poly1305::new_from_slice(key.as_slice()).map_err(|_| Error::Encryption)?;
    cipher
        .encrypt(
            &XNonce::from(*nonce),
            Payload {
                msg: plaintext,
                aad,
            },
        )
        .map_err(|_| Error::Encryption)
}

/// Checks the tag and decrypts. The plaintext is wiped from memory when dropped.
///
/// # Errors
///
/// Returns [`Error::Decryption`] if the key is wrong or if the ciphertext,
/// the tag or `aad` changed.
pub fn decrypt(
    key: &Key,
    nonce: &Nonce,
    ciphertext: &[u8],
    aad: &[u8],
) -> Result<Zeroizing<Vec<u8>>, Error> {
    let cipher =
        XChaCha20Poly1305::new_from_slice(key.as_slice()).map_err(|_| Error::Decryption)?;
    // The tag is checked before anything is decrypted: a changed file gives
    // an error, never altered data
    cipher
        .decrypt(
            &XNonce::from(*nonce),
            Payload {
                msg: ciphertext,
                aad,
            },
        )
        .map(Zeroizing::new)
        .map_err(|_| Error::Decryption)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn key(byte: u8) -> Key {
        Zeroizing::new([byte; 32])
    }

    const NONCE: Nonce = [9; NONCE_LEN];
    const AAD: &[u8] = b"header";

    fn hex(text: &str) -> Vec<u8> {
        (0..text.len())
            .step_by(2)
            .map(|i| u8::from_str_radix(&text[i..i + 2], 16).unwrap())
            .collect()
    }

    #[test]
    fn decrypting_gives_back_the_plaintext() {
        let sealed = encrypt(&key(1), &NONCE, b"secret items", AAD).unwrap();

        let opened = decrypt(&key(1), &NONCE, &sealed, AAD).unwrap();

        assert_eq!(opened.as_slice(), b"secret items");
    }

    #[test]
    fn the_ciphertext_hides_the_plaintext_and_carries_a_tag() {
        let sealed = encrypt(&key(1), &NONCE, b"secret items", AAD).unwrap();

        assert_eq!(sealed.len(), b"secret items".len() + TAG_LEN);
        assert!(!sealed.windows(6).any(|window| window == b"secret"));
    }

    #[test]
    fn a_wrong_key_cannot_decrypt() {
        let sealed = encrypt(&key(1), &NONCE, b"secret items", AAD).unwrap();

        let result = decrypt(&key(2), &NONCE, &sealed, AAD);

        assert!(matches!(result, Err(Error::Decryption)));
    }

    #[test]
    fn detects_a_changed_bit_anywhere_in_the_ciphertext_or_tag() {
        let sealed = encrypt(&key(1), &NONCE, b"secret items", AAD).unwrap();

        // Flip one bit in every byte, one at a time: the ciphertext and the tag
        for index in 0..sealed.len() {
            let mut tampered = sealed.clone();
            tampered[index] ^= 0b0000_0001;

            let result = decrypt(&key(1), &NONCE, &tampered, AAD);

            assert!(matches!(result, Err(Error::Decryption)), "byte {index}");
        }
    }

    #[test]
    fn detects_a_changed_header() {
        // The header is not encrypted, but it is authenticated as AAD
        let sealed = encrypt(&key(1), &NONCE, b"secret items", b"memory=65536").unwrap();

        let result = decrypt(&key(1), &NONCE, &sealed, b"memory=8");

        assert!(matches!(result, Err(Error::Decryption)));
    }

    #[test]
    fn another_nonce_gives_another_ciphertext() {
        let first = encrypt(&key(1), &[1; NONCE_LEN], b"secret items", AAD).unwrap();
        let second = encrypt(&key(1), &[2; NONCE_LEN], b"secret items", AAD).unwrap();

        assert_ne!(first, second);
    }

    #[test]
    fn random_nonces_are_different() {
        assert_ne!(random_nonce().unwrap(), random_nonce().unwrap());
    }

    #[test]
    fn matches_the_ietf_test_vector() {
        // draft-irtf-cfrg-xchacha-03, appendix A.3.1: the standard's own example
        let key: Key = Zeroizing::new(
            hex("808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9f")
                .try_into()
                .unwrap(),
        );
        let nonce: Nonce = hex("404142434445464748494a4b4c4d4e4f5051525354555657")
            .try_into()
            .unwrap();
        let aad = hex("50515253c0c1c2c3c4c5c6c7");
        let plaintext = b"Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.";
        let expected = hex(concat!(
            // Ciphertext
            "bd6d179d3e83d43b9576579493c0e939572a1700252bfaccbed2902c21396cbb",
            "731c7f1b0b4aa6440bf3a82f4eda7e39ae64c6708c54c216cb96b72e1213b452",
            "2f8c9ba40db5d945b11b69b982c1bb9e3f3fac2bc369488f76b2383565d3fff9",
            "21f9664c97637da9768812f615c68b13b52e",
            // Tag
            "c0875924c1c7987947deafd8780acf49",
        ));

        let sealed = encrypt(&key, &nonce, plaintext, &aad).unwrap();

        assert_eq!(sealed, expected);
    }
}
