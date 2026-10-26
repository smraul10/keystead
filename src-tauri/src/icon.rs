//! Downloading a website's icon, on demand: the only network access in the app.

use std::io::Cursor;
use std::time::Duration;

use base64::Engine;
use base64::engine::general_purpose::STANDARD;
use image::{ImageFormat, ImageReader, Limits};
use url::Url;

use crate::error::CommandError;

/// Icons are stored at most this big, in pixels, on each side.
const ICON_SIZE: u32 = 64;
/// No icon is bigger than this; anything bigger isn't worth the wait.
const MAX_DOWNLOAD_BYTES: u64 = 512 * 1024;
/// Images claiming to be bigger are refused before decoding them: a small
/// file can claim to be a huge image and take all the memory.
const MAX_IMAGE_SIZE: u32 = 1024;
/// The whole download, redirects included.
const TIMEOUT: Duration = Duration::from_secs(10);
const MAX_REDIRECTS: u32 = 5;

/// Downloads the icon of the website at `url` and returns it as a PNG of at
/// most 64×64 pixels, in base64.
///
/// # Errors
///
/// Returns [`CommandError::InvalidUrl`] if `url` isn't a website,
/// [`CommandError::Network`] if it can't be reached, and
/// [`CommandError::IconNotFound`] if it has no icon that can be used.
pub fn download_icon(url: &str) -> Result<String, CommandError> {
    let bytes = fetch(&favicon_url(url)?)?;
    Ok(STANDARD.encode(to_png(&bytes)?))
}

/// Where a website keeps its icon: `https://<host>/favicon.ico`. The item's
/// URL is free text, so "github.com" works too; it is always asked over HTTPS,
/// and never with the username or password the URL may contain.
fn favicon_url(url: &str) -> Result<String, CommandError> {
    let url = url.trim();
    // People often type "github.com", without the scheme
    let full = if url.contains("://") {
        url.to_string()
    } else {
        format!("https://{url}")
    };
    let parsed = Url::parse(&full).map_err(|_| CommandError::InvalidUrl)?;
    let host = parsed.host_str().ok_or(CommandError::InvalidUrl)?;
    // `port()` is None for the scheme's default port (443, or 80 for http)
    let port = parsed
        .port()
        .map(|port| format!(":{port}"))
        .unwrap_or_default();
    Ok(format!("https://{host}{port}/favicon.ico"))
}

/// Downloads `url`, with the limits above.
fn fetch(url: &str) -> Result<Vec<u8>, CommandError> {
    let agent: ureq::Agent = ureq::Agent::config_builder()
        .https_only(true)
        .timeout_global(Some(TIMEOUT))
        .max_redirects(MAX_REDIRECTS)
        .build()
        .into();
    let mut response = agent.get(url).call().map_err(fetch_error)?;
    response
        .body_mut()
        .with_config()
        .limit(MAX_DOWNLOAD_BYTES)
        .read_to_vec()
        .map_err(fetch_error)
}

/// The website answered but has no icon to use, or it couldn't be reached.
fn fetch_error(error: ureq::Error) -> CommandError {
    match error {
        ureq::Error::StatusCode(_) | ureq::Error::BodyExceedsLimit(_) => CommandError::IconNotFound,
        // No address, no connection, a timeout, a TLS problem...
        _ => CommandError::Network,
    }
}

/// Decodes an icon (PNG or ICO) and encodes it again as a PNG of at most
/// 64×64 pixels. The UI never sees the website's file: only a small PNG made
/// here, from pixels decoded by Rust code.
fn to_png(bytes: &[u8]) -> Result<Vec<u8>, CommandError> {
    let mut limits = Limits::default();
    limits.max_image_width = Some(MAX_IMAGE_SIZE);
    limits.max_image_height = Some(MAX_IMAGE_SIZE);
    let mut reader = ImageReader::new(Cursor::new(bytes))
        .with_guessed_format()
        .map_err(|_| CommandError::IconNotFound)?;
    reader.limits(limits);
    // Not an image, a format we don't read (e.g. SVG), or too big
    let mut image = reader.decode().map_err(|_| CommandError::IconNotFound)?;

    // Only shrunk: enlarging a 16×16 icon would just blur it
    if image.width() > ICON_SIZE || image.height() > ICON_SIZE {
        image = image.thumbnail(ICON_SIZE, ICON_SIZE);
    }
    let mut png = Vec::new();
    image
        .write_to(&mut Cursor::new(&mut png), ImageFormat::Png)
        .map_err(|_| CommandError::Internal)?;
    Ok(png)
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{DynamicImage, RgbaImage};

    fn image(width: u32, height: u32) -> DynamicImage {
        DynamicImage::ImageRgba8(RgbaImage::new(width, height))
    }

    fn encoded(image: &DynamicImage, format: ImageFormat) -> Vec<u8> {
        let mut bytes = Vec::new();
        image
            .write_to(&mut Cursor::new(&mut bytes), format)
            .unwrap();
        bytes
    }

    fn png_size(png: &[u8]) -> (u32, u32) {
        let image = image::load_from_memory_with_format(png, ImageFormat::Png).unwrap();
        (image.width(), image.height())
    }

    #[test]
    fn asks_for_the_icon_at_the_root_of_the_site() {
        assert_eq!(
            favicon_url("https://github.com/login?return_to=x").unwrap(),
            "https://github.com/favicon.ico"
        );
    }

    #[test]
    fn accepts_an_address_typed_without_https() {
        assert_eq!(
            favicon_url("  github.com ").unwrap(),
            "https://github.com/favicon.ico"
        );
    }

    #[test]
    fn always_uses_https() {
        assert_eq!(
            favicon_url("http://example.com/").unwrap(),
            "https://example.com/favicon.ico"
        );
    }

    #[test]
    fn keeps_the_port() {
        assert_eq!(
            favicon_url("example.com:8443/app").unwrap(),
            "https://example.com:8443/favicon.ico"
        );
    }

    #[test]
    fn never_sends_a_username_or_password_in_the_address() {
        assert_eq!(
            favicon_url("https://raul:secret@example.com/").unwrap(),
            "https://example.com/favicon.ico"
        );
    }

    #[test]
    fn rejects_text_that_is_not_an_address() {
        for text in ["", "   ", "not a website"] {
            assert_eq!(favicon_url(text), Err(CommandError::InvalidUrl), "{text:?}");
        }
    }

    #[test]
    fn shrinks_big_icons_to_64_pixels() {
        let png = to_png(&encoded(&image(128, 128), ImageFormat::Png)).unwrap();

        assert_eq!(png_size(&png), (64, 64));
    }

    #[test]
    fn keeps_small_icons_as_they_are() {
        let png = to_png(&encoded(&image(16, 16), ImageFormat::Png)).unwrap();

        assert_eq!(png_size(&png), (16, 16));
    }

    #[test]
    fn reads_ico_files() {
        let png = to_png(&encoded(&image(32, 32), ImageFormat::Ico)).unwrap();

        assert_eq!(png_size(&png), (32, 32));
    }

    #[test]
    fn rejects_a_page_that_is_not_an_image() {
        // Some sites answer a missing favicon.ico with their home page
        let html = b"<!doctype html><title>Not found</title>";

        assert_eq!(to_png(html), Err(CommandError::IconNotFound));
    }

    #[test]
    #[ignore = "uses the network: run it with `cargo test -- --ignored`"]
    fn downloads_a_real_icon() {
        let icon = download_icon("github.com").unwrap();

        let png = STANDARD.decode(icon).unwrap();
        let (width, height) = png_size(&png);
        assert!(width > 0 && width <= ICON_SIZE && height <= ICON_SIZE);
    }

    #[test]
    fn rejects_images_too_big_to_be_icons() {
        // A small file can claim to be a huge image: it's refused before
        // decoding it, so it can't take all the memory
        let wide = encoded(&image(2048, 1), ImageFormat::Png);

        assert_eq!(to_png(&wide), Err(CommandError::IconNotFound));
    }
}
