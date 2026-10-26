//! The Windows glue: the only `unsafe` code in Keystead. Windows calls this
//! window's message procedure; Rust can't check what it does with the raw
//! pointers involved, so every `unsafe` block says why it is sound.
#![allow(unsafe_code)]

use windows::Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM};
use windows::Win32::System::RemoteDesktop::{
    NOTIFY_FOR_THIS_SESSION, WTSRegisterSessionNotification, WTSUnRegisterSessionNotification,
};
use windows::Win32::UI::Shell::{DefSubclassProc, RemoveWindowSubclass, SetWindowSubclass};
use windows::Win32::UI::WindowsAndMessaging as messages;
use windows::core::{Error, Result};

use crate::{LockReason, lock_reason};

// The constants of lib.rs are the ones in the Windows headers
const _: () = assert!(crate::WM_WTSSESSION_CHANGE == messages::WM_WTSSESSION_CHANGE);
const _: () = assert!(crate::WTS_SESSION_LOCK == messages::WTS_SESSION_LOCK as usize);
const _: () = assert!(crate::WM_POWERBROADCAST == messages::WM_POWERBROADCAST);
const _: () = assert!(crate::PBT_APMSUSPEND == messages::PBT_APMSUSPEND as usize);

// Tells our subclass apart from the others of the window (Tauri has its own)
const SUBCLASS_ID: usize = 0x4B53_5444;

type Callback = Box<dyn Fn(LockReason)>;

/// Calls `on_lock` when the session is locked or the computer goes to sleep,
/// until `window` is closed. It runs on the window's thread.
///
/// # Errors
///
/// Returns the Windows error if the window can't be watched.
pub fn watch(window: HWND, on_lock: impl Fn(LockReason) + 'static) -> Result<()> {
    // Handed to Windows as a number; freed on the window's last message
    let callback: *mut Callback = Box::into_raw(Box::new(Box::new(on_lock)));

    // SAFETY: `window` is a window of this process, and `callback` stays
    // valid until `subclass_proc` frees it on WM_NCDESTROY
    let subclassed =
        unsafe { SetWindowSubclass(window, Some(subclass_proc), SUBCLASS_ID, callback as usize) };
    if !subclassed.as_bool() {
        // SAFETY: Windows didn't keep it: it is freed here, and only here
        drop(unsafe { Box::from_raw(callback) });
        return Err(Error::from_thread());
    }

    // SAFETY: `window` is a window of this process; `subclass_proc`
    // unregisters it on WM_NCDESTROY
    unsafe { WTSRegisterSessionNotification(window, NOTIFY_FOR_THIS_SESSION) }
}

// Sees every message of the window, then lets it go on as usual
unsafe extern "system" fn subclass_proc(
    window: HWND,
    message: u32,
    wparam: WPARAM,
    lparam: LPARAM,
    _subclass_id: usize,
    data: usize,
) -> LRESULT {
    let callback = data as *mut Callback;

    if let Some(reason) = lock_reason(message, wparam.0) {
        // SAFETY: `data` is the callback `watch` gave Windows, alive until
        // WM_NCDESTROY, the window's last message (handled below)
        unsafe { (*callback)(reason) };
    }

    if message == messages::WM_NCDESTROY {
        // SAFETY: the window's last message: nothing uses the subclass or the
        // callback afterwards, so they are undone and freed once
        unsafe {
            // Nothing else to do if these fail: the window is going away
            let _ = WTSUnRegisterSessionNotification(window);
            let _ = RemoveWindowSubclass(window, Some(subclass_proc), SUBCLASS_ID);
            drop(Box::from_raw(callback));
        }
    }

    // SAFETY: the arguments are the ones Windows gave this procedure
    unsafe { DefSubclassProc(window, message, wparam, lparam) }
}
