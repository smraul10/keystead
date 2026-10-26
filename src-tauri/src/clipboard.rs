//! Copying to the system clipboard: kept out of the Windows clipboard history
//! and wiped after a while, because a copied password must not stay there.

use std::sync::{Mutex, MutexGuard, PoisonError};
use std::time::Duration;

use zeroize::Zeroizing;

use crate::error::CommandError;

/// How long a copied text stays in the clipboard (KeePassXC: 10 s,
/// 1Password: 90 s).
pub const CLEAR_AFTER: Duration = Duration::from_secs(30);

/// What Keystead needs from a clipboard: the system's ([`SystemClipboard`]),
/// or a fake one in tests.
pub trait Clipboard {
    /// Copies `text`, kept out of the clipboard history and the cloud.
    ///
    /// # Errors
    ///
    /// Returns [`CommandError::Clipboard`] if the clipboard can't be used.
    fn copy(&mut self, text: &str) -> Result<(), CommandError>;
    /// The text in the clipboard now, if there is one.
    fn text(&mut self) -> Option<Zeroizing<String>>;
    /// Empties the clipboard. It can't fail: there would be nothing to do.
    fn clear(&mut self);
}

/// The system clipboard, through `arboard`.
pub struct SystemClipboard;

impl Clipboard for SystemClipboard {
    fn copy(&mut self, text: &str) -> Result<(), CommandError> {
        let mut clipboard = arboard::Clipboard::new().map_err(|_| CommandError::Clipboard)?;
        let set = clipboard.set();
        // Out of the clipboard history (Win+V), the cloud clipboard and the
        // apps that watch the clipboard, like KeePassXC and 1Password do
        #[cfg(windows)]
        let set = {
            use arboard::SetExtWindows;
            set.exclude_from_monitoring()
        };
        set.text(text).map_err(|_| CommandError::Clipboard)
    }

    fn text(&mut self) -> Option<Zeroizing<String>> {
        let mut clipboard = arboard::Clipboard::new().ok()?;
        clipboard.get_text().ok().map(Zeroizing::new)
    }

    fn clear(&mut self) {
        if let Ok(mut clipboard) = arboard::Clipboard::new() {
            // If it fails, another app is using the clipboard: nothing to do
            let _ = clipboard.clear();
        }
    }
}

/// The clipboard as Keystead uses it: it remembers the last text it copied,
/// to wipe it later, but only while the clipboard still holds it. What the
/// user copies afterwards from another app is never touched.
pub struct SecretClipboard<C = SystemClipboard> {
    // Tauri may run several commands at once, and each timer has its thread
    copies: Mutex<Copies<C>>,
}

struct Copies<C> {
    clipboard: C,
    // The last text Keystead copied, with the number of that copy
    last: Option<(u64, Zeroizing<String>)>,
    count: u64,
}

impl<C: Clipboard> SecretClipboard<C> {
    #[must_use]
    pub fn new(clipboard: C) -> Self {
        Self {
            copies: Mutex::new(Copies {
                clipboard,
                last: None,
                count: 0,
            }),
        }
    }

    /// Copies `text` and returns the number of this copy, for [`Self::clear_copy`].
    ///
    /// # Errors
    ///
    /// Returns [`CommandError::Clipboard`] if the clipboard can't be used.
    pub fn copy(&self, text: &str) -> Result<u64, CommandError> {
        let mut copies = self.copies();
        copies.clipboard.copy(text)?;
        copies.count += 1;
        let number = copies.count;
        copies.last = Some((number, Zeroizing::new(text.to_string())));
        Ok(number)
    }

    /// Wipes copy number `copy` once its time is up, unless something newer
    /// was copied since: a newer copy has its own timer.
    pub fn clear_copy(&self, copy: u64) {
        let mut copies = self.copies();
        if copies
            .last
            .as_ref()
            .is_some_and(|(number, _)| *number == copy)
        {
            copies.clear();
        }
    }

    /// Wipes what Keystead copied, if the clipboard still holds it: on lock,
    /// when the app closes, and with "Clear now".
    pub fn clear(&self) {
        self.copies().clear();
    }

    fn copies(&self) -> MutexGuard<'_, Copies<C>> {
        // Clearing must work even after a panic: nothing here can be half done
        self.copies.lock().unwrap_or_else(PoisonError::into_inner)
    }
}

impl<C: Clipboard> Copies<C> {
    fn clear(&mut self) {
        if let Some((_, copied)) = self.last.take() {
            let still_ours = self.clipboard.text().is_some_and(|now| *now == *copied);
            if still_ours {
                self.clipboard.clear();
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;

    // A clipboard in memory, shared with the test (a CI machine has no
    // clipboard), so the test can look inside and play another app
    #[derive(Clone, Default)]
    struct FakeClipboard(Arc<Mutex<Option<String>>>);

    impl FakeClipboard {
        fn holds(&self) -> Option<String> {
            self.0.lock().unwrap().clone()
        }

        fn another_app_copies(&self, text: &str) {
            *self.0.lock().unwrap() = Some(text.to_string());
        }
    }

    impl Clipboard for FakeClipboard {
        fn copy(&mut self, text: &str) -> Result<(), CommandError> {
            self.another_app_copies(text);
            Ok(())
        }

        fn text(&mut self) -> Option<Zeroizing<String>> {
            self.holds().map(Zeroizing::new)
        }

        fn clear(&mut self) {
            *self.0.lock().unwrap() = None;
        }
    }

    fn clipboard() -> (SecretClipboard<FakeClipboard>, FakeClipboard) {
        let fake = FakeClipboard::default();
        (SecretClipboard::new(fake.clone()), fake)
    }

    #[test]
    fn copies_the_text() {
        let (clipboard, fake) = clipboard();

        clipboard.copy("b,YjHm4^9aBBNC[zP]GD").unwrap();

        assert_eq!(fake.holds().as_deref(), Some("b,YjHm4^9aBBNC[zP]GD"));
    }

    #[test]
    fn wipes_the_copy_when_its_time_is_up() {
        let (clipboard, fake) = clipboard();
        let copy = clipboard.copy("secret").unwrap();

        clipboard.clear_copy(copy);

        assert_eq!(fake.holds(), None);
    }

    #[test]
    fn leaves_alone_what_another_app_copied_afterwards() {
        let (clipboard, fake) = clipboard();
        let copy = clipboard.copy("secret").unwrap();
        fake.another_app_copies("a link");

        clipboard.clear_copy(copy);

        assert_eq!(fake.holds().as_deref(), Some("a link"));
    }

    #[test]
    fn an_older_timer_leaves_a_newer_copy_alone() {
        let (clipboard, fake) = clipboard();
        let first = clipboard.copy("first").unwrap();
        let second = clipboard.copy("second").unwrap();

        // The first copy's time is up while the second is in the clipboard
        clipboard.clear_copy(first);
        assert_eq!(fake.holds().as_deref(), Some("second"));

        clipboard.clear_copy(second);
        assert_eq!(fake.holds(), None);
    }

    #[test]
    fn locking_wipes_the_copy_at_once() {
        let (clipboard, fake) = clipboard();
        clipboard.copy("secret").unwrap();

        clipboard.clear();

        assert_eq!(fake.holds(), None);
    }

    #[test]
    fn locking_leaves_alone_what_another_app_copied() {
        let (clipboard, fake) = clipboard();
        clipboard.copy("secret").unwrap();
        fake.another_app_copies("a link");

        clipboard.clear();

        assert_eq!(fake.holds().as_deref(), Some("a link"));
    }
}
