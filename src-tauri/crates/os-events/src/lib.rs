//! Events from the operating system that should lock the vault at once: the
//! session being locked (Win+L) and the computer going to sleep.
//!
//! Listening to them takes calls to Windows that Rust can't check (`unsafe`).
//! They live in `win32.rs`, the only place in Keystead with `unsafe` code:
//! the app and the vault crate forbid it. Elsewhere than Windows, nothing is
//! watched yet.

#[cfg(windows)]
mod win32;

#[cfg(windows)]
pub use win32::watch;

/// Why the operating system asks to lock.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LockReason {
    SessionLocked,
    Suspending,
}

// Window messages and their `wparam`, from the Windows headers (`win32.rs`
// checks that they match the `windows` crate)
const WM_WTSSESSION_CHANGE: u32 = 0x02B1;
const WTS_SESSION_LOCK: usize = 0x7;
const WM_POWERBROADCAST: u32 = 0x0218;
const PBT_APMSUSPEND: usize = 0x4;

/// Whether a window message means "lock now". Apart from the Windows glue,
/// so it can be tested on any system.
#[must_use]
pub fn lock_reason(message: u32, wparam: usize) -> Option<LockReason> {
    match (message, wparam) {
        (WM_WTSSESSION_CHANGE, WTS_SESSION_LOCK) => Some(LockReason::SessionLocked),
        (WM_POWERBROADCAST, PBT_APMSUSPEND) => Some(LockReason::Suspending),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Other values of the same messages, from the Windows headers
    const WTS_SESSION_UNLOCK: usize = 0x8;
    const PBT_APMRESUMEAUTOMATIC: usize = 0x12;
    const WM_PAINT: u32 = 0x000F;

    #[test]
    fn locking_the_session_locks() {
        assert_eq!(
            lock_reason(WM_WTSSESSION_CHANGE, WTS_SESSION_LOCK),
            Some(LockReason::SessionLocked)
        );
    }

    #[test]
    fn going_to_sleep_locks() {
        assert_eq!(
            lock_reason(WM_POWERBROADCAST, PBT_APMSUSPEND),
            Some(LockReason::Suspending)
        );
    }

    #[test]
    fn other_messages_change_nothing() {
        // Unlocking the session or waking up: the user unlocks the vault
        assert_eq!(lock_reason(WM_WTSSESSION_CHANGE, WTS_SESSION_UNLOCK), None);
        assert_eq!(lock_reason(WM_POWERBROADCAST, PBT_APMRESUMEAUTOMATIC), None);
        assert_eq!(lock_reason(WM_PAINT, 0), None);
    }
}
