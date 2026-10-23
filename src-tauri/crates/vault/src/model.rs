//! The data inside the vault: the same items as the UI, as JSON.

use std::fmt;

use serde::{Deserialize, Serialize};
use zeroize::{Zeroize, ZeroizeOnDrop};

/// A login item. Mirrors the UI's `Item` type: with `rename_all`, the JSON
/// uses the same camelCase names (`createdAt`), so it crosses to the UI as is.
///
/// Every field is overwritten with zeros when the item is dropped (when the
/// vault is locked), so passwords don't stay in memory.
#[derive(Clone, PartialEq, Eq, Serialize, Deserialize, Zeroize, ZeroizeOnDrop)]
#[serde(rename_all = "camelCase")]
pub struct Item {
    pub id: String,
    pub title: String,
    pub username: String,
    pub password: String,
    pub url: String,
    pub notes: String,
    pub favorite: bool,
    /// ISO 8601 date in UTC, like `2026-10-22T10:00:00.000Z`
    pub created_at: String,
    pub updated_at: String,
    /// When the item was moved to the trash; `None` (`null` in JSON) if not
    pub deleted_at: Option<String>,
}

// Written by hand: a derived Debug would print the password and the notes in
// logs and error messages
impl fmt::Debug for Item {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter
            .debug_struct("Item")
            .field("id", &self.id)
            .field("title", &self.title)
            .field("username", &self.username)
            .field("password", &"<redacted>")
            .field("url", &self.url)
            .field("notes", &"<redacted>")
            .field("favorite", &self.favorite)
            .field("created_at", &self.created_at)
            .field("updated_at", &self.updated_at)
            .field("deleted_at", &self.deleted_at)
            .finish()
    }
}

/// Everything stored, encrypted, in a vault file. Wiped when dropped, like its items.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize, Zeroize, ZeroizeOnDrop)]
pub struct Vault {
    pub items: Vec<Item>,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn github() -> Item {
        Item {
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
        }
    }

    #[test]
    fn items_use_the_same_json_names_as_the_ui() {
        let json = serde_json::to_value(github()).unwrap();

        assert_eq!(json["createdAt"], "2026-03-14T10:12:00.000Z");
        assert_eq!(json["deletedAt"], serde_json::Value::Null);
        assert!(json.get("created_at").is_none());
    }

    #[test]
    fn a_vault_survives_a_round_trip_through_json() {
        // `..github()` can't be used: it would move fields out of an item that
        // wipes itself when dropped, so change a copy instead
        let mut trashed = github();
        trashed.id = "2".to_string();
        trashed.deleted_at = Some("2026-10-22T10:00:00.000Z".to_string());
        let vault = Vault {
            items: vec![github(), trashed],
        };

        let json = serde_json::to_string(&vault).unwrap();
        let back: Vault = serde_json::from_str(&json).unwrap();

        assert_eq!(back, vault);
    }

    #[test]
    fn rejects_an_item_with_missing_fields() {
        let json = r#"{ "id": "1", "title": "GitHub" }"#;

        let result = serde_json::from_str::<Item>(json);

        assert!(result.is_err());
    }

    #[test]
    fn treats_a_missing_deleted_at_as_not_in_the_trash() {
        // serde reads a missing Option field as None: only deletedAt may be missing
        let mut json = serde_json::to_value(github()).unwrap();
        json.as_object_mut().unwrap().remove("deletedAt");

        let item: Item = serde_json::from_value(json).unwrap();

        assert_eq!(item.deleted_at, None);
    }

    #[test]
    fn a_new_vault_is_empty() {
        assert!(Vault::default().items.is_empty());
    }

    #[test]
    fn debug_output_hides_the_password_and_the_notes() {
        let mut item = github();
        item.notes = "Recovery codes: 1234-5678".to_string();

        // What logs and error messages would show
        let printed = format!("{item:?}");

        assert!(printed.contains("GitHub"));
        assert!(!printed.contains("b,YjHm4^9aBBNC[zP]GD"));
        assert!(!printed.contains("1234-5678"));
    }

    #[test]
    fn zeroize_wipes_every_text_field() {
        let mut item = github();

        item.zeroize();

        assert!(item.password.is_empty());
        assert!(item.title.is_empty());
        assert!(item.username.is_empty());
        assert!(item.url.is_empty());
    }

    #[test]
    fn zeroize_wipes_every_item_of_the_vault() {
        let mut vault = Vault {
            items: vec![github()],
        };

        vault.zeroize();

        assert!(vault.items.is_empty());
    }
}
