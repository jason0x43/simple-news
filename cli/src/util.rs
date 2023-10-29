use std::{
    collections::HashSet,
    fs::File,
    io::{Read, Write},
    sync::Arc,
};

use reqwest::{cookie::Jar, Client, Response, Url};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::AppError;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Cache {
    pub(crate) session_id: Option<Uuid>,
    pub(crate) host: Option<String>,
    pub(crate) ids: Option<HashSet<Uuid>>,
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

    pub(crate) fn get_session_id(&self) -> Result<Uuid, AppError> {
        if let Some(session_id) = self.session_id {
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

    pub(crate) fn add_ids(&mut self, new_ids: Vec<Uuid>) {
        if let Some(ids) = &mut self.ids {
            ids.extend(new_ids);
        } else {
            self.ids = Some(HashSet::from_iter(new_ids));
        }
    }

    pub(crate) fn get_matching_id(
        &self,
        id_part: &str,
    ) -> Result<Uuid, AppError> {
        if let Ok(uuid) = Uuid::parse_str(id_part) {
            Ok(uuid)
        } else if let Some(ids) = &self.ids {
            let matches = ids
                .iter()
                .filter(|id| id.to_string().starts_with(id_part))
                .map(|id| id.clone())
                .collect::<Vec<Uuid>>();
            if matches.len() == 1 {
                Ok(matches[0])
            } else if matches.len() == 0 {
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

pub(crate) fn get_host() -> Result<Url, AppError> {
    let cache = Cache::load()?;
    let host = cache.get_host()?;
    Ok(host.parse::<Url>()?)
}

pub(crate) fn get_client() -> Result<Client, AppError> {
    let cache = Cache::load()?;
    let session_id = cache.get_session_id()?;
    let host = cache.get_host()?;
    let jar = Jar::default();
    let url = host.parse::<Url>().unwrap();
    let cookie = format!(
        "session_id={}; Domain={}",
        session_id,
        url.domain().unwrap()
    );
    jar.add_cookie_str(&cookie, &url);
    let client = Client::builder().cookie_provider(Arc::new(jar)).build()?;
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
