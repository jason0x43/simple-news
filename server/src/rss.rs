use base64::{engine::general_purpose, Engine};
use feed_rs::{
    model::{Entry, Feed},
    parser,
};
use lol_html::{element, HtmlRewriter, Settings};
use reqwest::Client;
use time::OffsetDateTime;
use url::Origin;
use url::Url;

use crate::{error::AppError, util::get_timestamp};

#[derive(Debug)]
pub(crate) struct ItemContent {
    pub(crate) title: String,
    pub(crate) link: Option<Url>,
    pub(crate) content: Option<String>,
    pub(crate) article_id: String,
    pub(crate) published: OffsetDateTime,
}

pub(crate) async fn load_feed(url: &str) -> Result<Feed, AppError> {
    let client = Client::new();
    let bytes = client.get(url).send().await?.bytes().await?;
    parser::parse(&bytes[..]).map_err(|err| {
        AppError::Error(format!("error loading RSS from {}: {}", url, err))
    })
}

/// Return the content of an Item
pub(crate) fn get_content(entry: Entry) -> Result<ItemContent, AppError> {
    let title = entry.title.map_or("Untitled".into(), |t| t.content);
    let link = if entry.links.len() > 0 {
        Some(Url::parse(&entry.links[0].href)?)
    } else {
        None
    };

    let content = entry
        .content
        .map_or_else(
            || entry.summary.map(|d| d.content),
            |c| Some(c.body.unwrap_or("".into())),
        )
        .map(|c| process_content(&c).unwrap_or(c));

    let article_id = entry.id;
    let published = entry.updated.map_or(get_timestamp(0), |updated| {
        OffsetDateTime::from_unix_timestamp(updated.timestamp()).unwrap()
    });

    Ok(ItemContent {
        title,
        link,
        content,
        article_id,
        published,
    })
}

/// Return the icon as a data URL, if found
pub(crate) async fn get_icon(feed: &Feed) -> Result<Option<Url>, AppError> {
    let url = get_icon_url(feed)?;
    if url.is_none() {
        return Ok(None);
    }

    // TODO: request icon data, convert to data URI
    // see https://stackoverflow.com/a/19996331/141531

    let url = url.unwrap();
    let client = Client::builder().build()?;
    let resp = client.get(url.clone()).send().await?;
    if resp.status() != 200 {
        let msg =
            format!("error downloading icon from {}: [{}]", url, resp.status());
        log::warn!("{}", msg);
        return Err(AppError::Error(msg));
    }

    let ctype_hdr = resp.headers().get("content-type");
    let ctype: Option<String> = if let Some(ctype_hdr) = ctype_hdr {
        Some(ctype_hdr.to_str()?.into())
    } else {
        None
    };

    if let Some(ctype) = ctype {
        let bytes = resp.bytes().await?;
        let b64 = general_purpose::STANDARD.encode(&bytes);
        let url = Url::parse(&format!("data:{};base64,{}", ctype, b64))?;
        Ok(Some(url))
    } else {
        Ok(None)
    }
}

/// Return a URL for the channel icon, if available
fn get_icon_url(feed: &Feed) -> Result<Option<Url>, AppError> {
    if let Some(image) = &feed.logo {
        let url = Url::parse(&image.uri)?;
        return Ok(Some(url));
    }

    let favico_url = if feed.links.len() > 0 {
        let link = &feed.links[0];
        let url = Url::parse(&link.href)?;
        let origin = url.origin();
        if let Origin::Tuple(scheme, host, port) = origin {
            Some(Url::parse(&format!(
                "{}://{}:{}/favicon.ico",
                scheme, host, port
            ))?)
        } else {
            None
        }
    } else {
        None
    };

    if let Some(favico_url) = favico_url {
        Ok(Some(favico_url))
    } else {
        Ok(None)
    }
}

/// Process / cleanup document content
fn process_content(content: &str) -> Result<String, AppError> {
    let mut output = vec![];

    let mut rewriter = HtmlRewriter::new(
        Settings {
            element_content_handlers: vec![element!("a[style]", |el| {
                el.remove_attribute("style");
                Ok(())
            })],
            ..Settings::default()
        },
        |c: &[u8]| output.extend_from_slice(c),
    );

    rewriter.write(content.as_bytes())?;
    rewriter.end()?;

    Ok(String::from_utf8(output)?)
}
