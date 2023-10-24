use std::{
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
}

pub(crate) fn save_cache(cache: Cache) -> Result<(), AppError> {
    let xdg_dirs = xdg::BaseDirectories::with_prefix("sn").unwrap();
    let cache_path = xdg_dirs
        .place_cache_file("cache.json")
        .expect("cannot create cache directory");
    let mut cache_file = File::create(cache_path)?;
    write!(
        &mut cache_file,
        "{}",
        serde_json::to_string(&cache).unwrap()
    )?;
    Ok(())
}

pub(crate) fn load_cache() -> Result<Cache, AppError> {
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
        }
    };

    Ok(cache)
}

impl Cache {
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
}

pub(crate) fn get_client() -> Result<Client, AppError> {
    let cache = load_cache()?;
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

pub(crate) async fn assert_ok(response: Response) -> Result<Response, AppError> {
    let status = response.status().as_u16();
    if status >= 400 {
        let text = response.text().await?;
        Err(AppError::BadResponse(format!("[{}] {}", status, text)))
    } else {
        Ok(response)
    }
}
