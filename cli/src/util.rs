use std::{
    collections::HashSet,
    fs::File,
    io::{Read, Write},
};

use comfy_table::{presets::UTF8_FULL, ContentArrangement, Table};
use reqwest::{
    header::{HeaderMap, HeaderValue, AUTHORIZATION},
    Client, Response, Url,
};
use serde::{Deserialize, Serialize};
use server::SessionId;
use time::{
    format_description::{well_known::Rfc2822, FormatItem},
    macros::format_description,
    OffsetDateTime,
};
use time_tz::OffsetDateTimeExt;

use crate::error::AppError;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Cache {
    pub(crate) session_id: Option<SessionId>,
    pub(crate) host: Option<String>,
    pub(crate) ids: Option<HashSet<String>>,
}

impl Cache {
    pub(crate) fn load() -> Result<Self, AppError> {
        let xdg_dirs = xdg::BaseDirectories::with_prefix("sn").unwrap();

        let cache_path = xdg_dirs.find_cache_file("cache.json");
        let cache = if let Some(cache_path) = cache_path {
            let mut cache_file = File::open(cache_path)?;
            let mut cache_str: String = "".into();
            cache_file.read_to_string(&mut cache_str)?;
            serde_json::from_str(&cache_str)?
        } else {
            Cache {
                session_id: None,
                host: None,
                ids: None,
            }
        };

        Ok(cache)
    }

    pub(crate) fn get_session_id(&self) -> Result<SessionId, AppError> {
        if let Some(session_id) = self.session_id.clone() {
            Ok(session_id)
        } else {
            Err(AppError::NotLoggedIn)
        }
    }

    pub(crate) fn get_host(&self) -> Result<String, AppError> {
        if let Some(host) = self.host.clone() {
            Ok(host)
        } else {
            Err(AppError::NoHostSet)
        }
    }

    pub(crate) fn add_ids(&mut self, new_ids: Vec<String>) {
        if let Some(ids) = &mut self.ids {
            ids.extend(new_ids);
        } else {
            self.ids = Some(HashSet::from_iter(new_ids));
        }
    }

    pub(crate) fn get_matching_id(
        &self,
        id_part: &str,
    ) -> Result<String, AppError> {
        if let Some(ids) = &self.ids {
            let matches = ids
                .iter()
                .filter(|id| id.to_string().starts_with(id_part))
                .cloned()
                .collect::<Vec<String>>();
            if matches.len() == 1 {
                Ok(matches[0].clone())
            } else if matches.is_empty() {
                Err(AppError::Error("no matching ID".into()))
            } else {
                Err(AppError::Error("ambiguous ID".into()))
            }
        } else {
            Err(AppError::Error("no matching ID".into()))
        }
    }

    pub(crate) fn save(&self) -> Result<(), AppError> {
        let xdg_dirs = xdg::BaseDirectories::with_prefix("sn").unwrap();
        let cache_path = xdg_dirs
            .place_cache_file("cache.json")
            .expect("cannot create cache directory");
        let mut cache_file = File::create(cache_path)?;
        write!(&mut cache_file, "{}", serde_json::to_string(self).unwrap())?;
        Ok(())
    }
}

fn get_host() -> Result<Url, AppError> {
    let cache = Cache::load()?;
    let host = cache.get_host()?;
    Ok(host.parse::<Url>()?)
}

pub(crate) fn get_api() -> Result<Url, AppError> {
    let base = get_host()?;
    Ok(base.join("/api/")?)
}

pub(crate) fn get_client() -> Result<Client, AppError> {
    let cache = Cache::load()?;
    let session_id = cache.get_session_id()?;

    let mut headers = HeaderMap::new();
    headers.insert(
        AUTHORIZATION,
        HeaderValue::from_str(&format!("Bearer {session_id}")).unwrap(),
    );

    let client = Client::builder().default_headers(headers).build()?;
    Ok(client)
}

pub(crate) async fn assert_ok(
    response: Response,
) -> Result<Response, AppError> {
    let status = response.status().as_u16();
    if status >= 400 {
        let text = response.text().await?;
        Err(AppError::BadResponse(format!("[{}] {}", status, text)))
    } else {
        Ok(response)
    }
}

static LOCAL_TIME_FORMAT: &[FormatItem<'static>] = format_description!(
    "[weekday], [day] [month repr:short] [year] [hour repr:24]:[minute]"
);

pub(crate) fn to_time_str(time: &OffsetDateTime) -> String {
    if let Ok(tz) = time_tz::system::get_timezone() {
        time.to_timezone(tz)
            .format(&LOCAL_TIME_FORMAT)
            .unwrap_or_else(|u| u.to_string())
    } else {
        time.format(&Rfc2822).unwrap_or_else(|u| u.to_string())
    }
}

pub(crate) fn new_table() -> Table {
    let mut table = Table::new();
    table.load_preset(UTF8_FULL);
    table.set_content_arrangement(ContentArrangement::Dynamic);
    table
}

pub(crate) fn substr(value: &str, len: usize) -> String {
    value.chars().take(len).collect()
}
