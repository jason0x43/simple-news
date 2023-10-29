use std::fmt::Display;

use reqwest::Url;
use serde::{Deserialize, Serialize};
use sqlx::{Decode, Encode, FromRow};
use tsync::tsync;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
#[tsync]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub config: Option<serde_json::Value>,
}

impl Display for User {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let str = serde_json::to_string_pretty(self).unwrap();
        f.write_str(&str)
    }
}

#[derive(Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Password {
    pub id: Uuid,
    pub hash: String,
    pub salt: String,
    pub user_id: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    pub id: Uuid,
    pub data: serde_json::Value,
    pub expires: i64,
    pub user_id: Uuid,
}

#[derive(Clone, Debug, Serialize, Deserialize, Encode, Decode)]
#[serde(rename_all = "camelCase")]
#[tsync]
pub enum FeedKind {
    #[sqlx(rename = "rss")]
    Rss,
}

impl Display for FeedKind {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let str = match self {
            FeedKind::Rss => "rss",
        };
        f.write_str(&str)
    }
}

impl From<String> for FeedKind {
    fn from(value: String) -> Self {
        match value.as_str() {
            "rss" => FeedKind::Rss,
            _ => panic!("Unknown feed kind {}", value),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
#[tsync]
pub struct Feed {
    pub id: Uuid,
    pub url: Url,
    pub title: String,
    pub kind: FeedKind,
    pub last_updated: i64,
    pub disabled: bool,
    pub icon: Option<String>,
    pub html_url: Option<Url>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
#[tsync]
pub struct Article {
    pub id: Uuid,
    pub article_id: String,
    pub feed_id: Uuid,
    pub title: String,
    pub content: String,
    pub published: i64,
    pub link: Option<Url>,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
#[tsync]
pub struct CreateUserRequest {
    pub email: String,
    pub username: String,
    pub password: String,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
#[tsync]
pub struct CreateSessionRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
#[tsync]
pub struct AddFeedRequest {
    pub url: Url,
    pub title: String,
    pub kind: FeedKind,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[tsync]
pub struct SessionResponse {
    pub id: Uuid,
    pub expires: i64,
}
