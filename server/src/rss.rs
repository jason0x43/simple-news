use base64::{engine::general_purpose, Engine};
use lol_html::{element, HtmlRewriter, Settings};
use reqwest::Client;
use rss::{Channel, Item};
use sha2::{Digest, Sha256};
use time::{
    format_description::{well_known::Rfc2822, FormatItem},
    macros::format_description,
    OffsetDateTime,
};
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

/// Rfc2822 without the optional weekday
static RSS_TIME_FORMAT: &'static [FormatItem<'static>] = format_description!(
    "[day] [month repr:short] [year] [hour repr:24]:[minute] [offset_hour sign:mandatory][offset_minute]"
);

pub(crate) async fn load_feed(url: String) -> Result<Channel, AppError> {
    let client = Client::new();
    let bytes = client.get(url).send().await?.bytes().await?;
    Ok(Channel::read_from(&bytes[..])?)
}

/// Return the content of an Item
pub(crate) fn get_content(item: &Item) -> Result<ItemContent, AppError> {
    let title = item.title.clone().unwrap_or("Untitled".into());
    let link = item.link.clone();
    let link = if let Some(url) = link {
        Some(Url::parse(&url)?)
    } else {
        None
    };

    let content = item
        .content()
        .map_or_else(
            || item.description().map(|d| d.to_string()),
            |c| Some(c.to_string()),
        )
        .map(|c| process_content(&c).unwrap_or(c));

    let article_id = item
        .guid
        .clone()
        .map_or(link.clone().map(|l| l.to_string()), |v| Some(v.value))
        .unwrap_or_else(|| {
            let mut hasher = Sha256::new();
            let content = content.clone().unwrap_or("".into());
            let summary = item.description.clone().unwrap_or("".into());
            hasher.update(format!("{}{}{}", title, summary, content));
            let hash = hasher.finalize();
            format!("sha256:{}", hex::encode(hash))
        });

    let published = item.pub_date.clone().map_or_else(
        || get_timestamp(0),
        |pub_date| {
            let date = OffsetDateTime::parse(&pub_date, &RSS_TIME_FORMAT)
                .or_else(|_| OffsetDateTime::parse(&pub_date, &Rfc2822));
            match date {
                Err(err) => {
                    log::warn!(
                        "invalid pub date for {} ({}): {}",
                        article_id,
                        pub_date,
                        err
                    );
                    get_timestamp(0)
                }
                Ok(date) => date,
            }
        },
    );

    Ok(ItemContent {
        title,
        link,
        content,
        article_id,
        published,
    })
}

/// Return the icon as a data URL, if found
pub(crate) async fn get_icon(
    channel: &Channel,
) -> Result<Option<Url>, AppError> {
    let url = get_icon_url(channel)?;
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
fn get_icon_url(channel: &Channel) -> Result<Option<Url>, AppError> {
    if let Some(image) = channel.image() {
        let url = Url::parse(&image.url)?;
        return Ok(Some(url));
    }

    let link = channel.link();
    let url = Url::parse(&link)?;
    let origin = url.origin();
    let favico_url = if let Origin::Tuple(scheme, host, port) = origin {
        Some(Url::parse(&format!(
            "{}://{}:{}/favicon.ico",
            scheme, host, port
        ))?)
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
