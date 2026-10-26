//! The window's title bar, drawn by Windows, in the theme chosen in Settings.

use serde::Deserialize;
use tauri::Theme;

/// The theme chosen in Settings. Its twin is `THEMES` in
/// `src/features/settings/settings.ts`: keep both in sync.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ThemeSetting {
    Light,
    Dark,
    System,
}

/// The theme of the window for a setting: `None` lets Windows decide (and
/// follow its own mode when it changes).
#[must_use]
pub fn window_theme(setting: ThemeSetting) -> Option<Theme> {
    match setting {
        ThemeSetting::Light => Some(Theme::Light),
        ThemeSetting::Dark => Some(Theme::Dark),
        ThemeSetting::System => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_chosen_theme_paints_the_title_bar() {
        assert_eq!(window_theme(ThemeSetting::Light), Some(Theme::Light));
        assert_eq!(window_theme(ThemeSetting::Dark), Some(Theme::Dark));
    }

    #[test]
    fn the_system_theme_lets_windows_decide() {
        assert_eq!(window_theme(ThemeSetting::System), None);
    }

    #[test]
    fn reads_the_setting_as_the_ui_sends_it() {
        let setting: ThemeSetting = serde_json::from_str(r#""system""#).unwrap();

        assert_eq!(setting, ThemeSetting::System);
    }
}
