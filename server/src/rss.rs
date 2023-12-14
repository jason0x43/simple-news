use atom_syndication as atom;
use base64::{engine::general_purpose, Engine};
use lol_html::{element, HtmlRewriter, Settings};
use regex::Regex;
use reqwest::Client;
use rss::{self, Item};
use sha2::{Digest, Sha256};
use time::format_description::well_known::Rfc3339;
use time::{
    format_description::FormatItem, macros::format_description, OffsetDateTime,
};
use time_tz::Offset;
use time_tz::TimeZone;
use time_tz::Tz;
use url::Origin;
use url::Url;

use crate::{error::AppError, util::get_timestamp};

#[derive(Debug)]
pub(crate) struct Entry {
    pub(crate) content: String,
    pub(crate) guid: String,
    pub(crate) link: Option<String>,
    pub(crate) published: OffsetDateTime,
    pub(crate) title: String,
}

pub(crate) struct Feed {
    pub(crate) title: String,
    pub(crate) link: String,
    pub(crate) image: Option<String>,
    pub(crate) entries: Vec<Entry>,
}

impl From<rss::Channel> for Feed {
    fn from(value: rss::Channel) -> Self {
        Feed {
            title: value.title.clone(),
            link: value.link.clone(),
            image: value.image.clone().map(|i| i.url),
            entries: value
                .items()
                .into_iter()
                .map(|item| {
                    let content = process_content(
                        &FeedItem::Item(item.clone()),
                        &get_rss_content(&item),
                    );
                    let title = item.title.clone().unwrap_or("Untitled".into());
                    let guid = get_rss_guid(&item);
                    let published = get_rss_date(item);
                    let link = item.link.clone();

                    Entry {
                        content,
                        guid,
                        link,
                        published,
                        title,
                    }
                })
                .collect(),
        }
    }
}

impl From<atom::Feed> for Feed {
    fn from(value: atom::Feed) -> Self {
        Feed {
            title: value.title.clone().value,
            link: value.links[0].href.clone(),
            image: value.icon.clone().map(|i| i.to_string()),
            entries: value
                .entries()
                .into_iter()
                .map(|entry| {
                    let content = process_content(
                        &FeedItem::Entry(entry.clone()),
                        &entry
                            .content
                            .clone()
                            .map(|c| c.value.unwrap_or("".into()))
                            .unwrap_or("".to_string()),
                    );
                    let title = entry.title.clone().value;
                    let guid = entry.id.clone();
                    let published = entry
                        .published
                        .map(|p| {
                            OffsetDateTime::from_unix_timestamp(p.timestamp())
                                .unwrap()
                        })
                        .unwrap_or(get_timestamp(0));
                    let link = entry.links.first().map(|l| l.href.clone());

                    Entry {
                        content,
                        guid,
                        link,
                        published,
                        title,
                    }
                })
                .collect(),
        }
    }
}

impl Feed {
    pub(crate) async fn load(url: &str) -> Result<Feed, AppError> {
        let client = Client::new();
        let bytes = client.get(url).send().await?.bytes().await?;
        let feed: Feed = if let Ok(c) = rss::Channel::read_from(&bytes[..]) {
            Ok(c.into())
        } else {
            if let Ok(f) = atom::Feed::read_from(&bytes[..]) {
                Ok(f.into())
            } else {
                Err(AppError::Error("invalid feed".into()))
            }
        }?;
        Ok(feed)
    }

    /// Return the icon as a data URL, if found
    pub(crate) async fn get_icon(&self) -> Result<Option<Url>, AppError> {
        let url = self.get_icon_url()?;
        if url.is_none() {
            return Ok(None);
        }

        // TODO: request icon data, convert to data URI
        // see https://stackoverflow.com/a/19996331/141531

        let url = url.unwrap();
        let client = Client::builder().build()?;
        let resp = client.get(url.clone()).send().await?;
        if resp.status() != 200 {
            let msg = format!(
                "error downloading icon from {}: [{}]",
                url,
                resp.status()
            );
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
    fn get_icon_url(&self) -> Result<Option<Url>, AppError> {
        if let Some(image) = &self.image {
            let url = Url::parse(image)?;
            return Ok(Some(url));
        }

        let url = Url::parse(&self.link)?;
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
}

pub(crate) enum FeedItem {
    Entry(atom_syndication::Entry),
    Item(Item),
}

impl FeedItem {
    pub(crate) fn get_link(&self) -> Option<String> {
        match self {
            FeedItem::Entry(e) => e.links.first().map(|l| l.href.clone()),
            FeedItem::Item(i) => i.link.clone(),
        }
    }
}

/// Process / cleanup document content
fn process_content(item: &FeedItem, content: &str) -> String {
    let mut output = vec![];

    let link = item.get_link();
    let base_addr = if let Some(link) = link {
        Url::parse(&link).ok()
    } else {
        None
    };

    let mut rewriter = HtmlRewriter::new(
        Settings {
            element_content_handlers: vec![
                (element!("a[style]", |el| {
                    el.remove_attribute("style");
                    Ok(())
                })),
                (element!("a", |el| {
                    let Some(href) = el.get_attribute("href") else {
                        return Ok(());
                    };

                    if !href.starts_with("/") {
                        return Ok(());
                    }

                    let Some(base_addr) = base_addr.clone() else {
                        return Ok(());
                    };

                    let url = base_addr.join(&href)?;
                    el.set_attribute("href", &url.to_string())?;
                    Ok(())
                })),
                (element!("img", |el| {
                    let Some(src) = el.get_attribute("src") else {
                        return Ok(());
                    };

                    if !src.starts_with("/") {
                        return Ok(());
                    }

                    let Some(base_addr) = base_addr.clone() else {
                        return Ok(());
                    };

                    let url = base_addr.join(&src)?;
                    el.set_attribute("src", &url.to_string())?;
                    Ok(())
                })),
            ],
            ..Settings::default()
        },
        |c: &[u8]| output.extend_from_slice(c),
    );

    rewriter.write(content.as_bytes()).unwrap();
    rewriter.end().unwrap();
    String::from_utf8(output).unwrap()
}

/// Rfc2822 without the optional weekday
static TIME_FORMAT_1: &'static [FormatItem<'static>] = format_description!(
    "[day] [month repr:short] [year] [hour repr:24]:[minute] [offset_hour sign:mandatory][offset_minute]"
);

/// Rfc2822 without seconds
static TIME_FORMAT_2: &'static [FormatItem<'static>] = format_description!(
    "[weekday repr:short], [day] [month repr:short] [year] [hour repr:24]:[minute] [offset_hour sign:mandatory][offset_minute]"
);

/// Rfc2822
static TIME_FORMAT_3: &'static [FormatItem<'static>] = format_description!(
    "[weekday repr:short], [day] [month repr:short] [year] [hour repr:24]:[minute]:[second] [offset_hour sign:mandatory][offset_minute]"
);

/// Parse a time string
fn parse_time(d: &str) -> Option<OffsetDateTime> {
    let tz_re = Regex::new(r"\b[A-Z]{3}$").unwrap();
    let d: String = if let Some(m) = tz_re.find(&d) {
        let tz: Option<&Tz> = match m.as_str() {
            "PDT" | "PST" => Some(time_tz::timezones::db::PST8PDT),
            "EDT" | "EST" => Some(time_tz::timezones::db::EST5EDT),
            "CDT" | "CST" => Some(time_tz::timezones::db::CST6CDT),
            "MDT" | "MST" => Some(time_tz::timezones::db::MST7MDT),
            "GMT" | "UTC" => Some(time_tz::timezones::db::UTC),
            _ => None,
        };
        if let Some(tz) = tz {
            let offset = tz.get_offset_primary().to_utc();
            let sign = if offset.whole_hours() < 0 { "-" } else { "+" };
            let offstr = format!("{}{:02}00", sign, offset.whole_hours().abs());
            tz_re.replace(&d, &offstr).into()
        } else {
            d.into()
        }
    } else {
        d.into()
    };

    let parsed = OffsetDateTime::parse(&d, &TIME_FORMAT_1);
    if let Ok(parsed) = parsed {
        return Some(parsed);
    }

    let parsed = OffsetDateTime::parse(&d, &TIME_FORMAT_2);
    if let Ok(parsed) = parsed {
        return Some(parsed);
    }

    let parsed = OffsetDateTime::parse(&d, &TIME_FORMAT_3);
    if let Ok(parsed) = parsed {
        return Some(parsed);
    }

    None
}

/// Get the published date of an RSS item
fn get_rss_date(item: &rss::Item) -> OffsetDateTime {
    if let Some(pub_date) = &item.pub_date {
        let date = parse_time(pub_date);
        if date.is_none() {
            log::warn!("invalid pub date {}", pub_date);
            get_timestamp(0)
        } else {
            date.unwrap()
        }
    } else if let Some(ext) = &item.dublin_core_ext {
        if ext.dates.is_empty() {
            get_timestamp(0)
        } else {
            OffsetDateTime::parse(&ext.dates[0], &Rfc3339)
                .unwrap_or(get_timestamp(0))
        }
    } else {
        get_timestamp(0)
    }
}

/// Get a unique identifier for an RSS item
fn get_rss_guid(item: &rss::Item) -> String {
    item.clone()
        .guid
        .map_or(item.link.clone().map(|l| l.to_string()), |v| Some(v.value))
        .unwrap_or_else(|| {
            let mut hasher = Sha256::new();
            hasher.update(format!(
                "{}{}",
                item.title.clone().unwrap_or("title".into()),
                item.content.clone().unwrap_or("content".into()),
            ));
            let hash = hasher.finalize();
            format!("sha256:{}", hex::encode(hash))
        })
}

/// Get the content of an RSS item
fn get_rss_content(item: &rss::Item) -> String {
    if let Some(content) = item.content.clone() {
        content
    } else if let Some(description) = item.description.clone() {
        description
    } else {
        "".into()
    }
}
