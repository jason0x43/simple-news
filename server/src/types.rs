use std::fmt::Display;

use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use time::OffsetDateTime;
use tsync::tsync;
use url::Url;
use uuid::Uuid;

pub trait Id {
    fn uuid(&self) -> Uuid;
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(transparent)]
pub struct UserId(pub Uuid);

impl From<Uuid> for UserId {
    fn from(value: Uuid) -> Self {
        UserId(value)
    }
}

impl Id  for UserId {
    fn uuid(&self) -> Uuid {
        self.0
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
#[tsync]
pub struct User {
    pub id: UserId,
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

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(transparent)]
pub struct PasswordId(pub Uuid);

impl From<Uuid> for PasswordId {
    fn from(value: Uuid) -> Self {
        PasswordId(value)
    }
}

impl Id  for PasswordId {
    fn uuid(&self) -> Uuid {
        self.0
    }
}

#[derive(Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Password {
    pub id: PasswordId,
    pub hash: String,
    pub salt: String,
    pub user_id: UserId,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(transparent)]
pub struct SessionId(pub Uuid);

impl From<Uuid> for SessionId {
    fn from(value: Uuid) -> Self {
        SessionId(value)
    }
}

impl Id  for SessionId {
    fn uuid(&self) -> Uuid {
        self.0
    }
}

impl SessionId {
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }
}

impl Display for SessionId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.to_string())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    pub id: SessionId,
    pub data: serde_json::Value,
    #[serde(with = "time::serde::rfc3339")]
    pub expires: OffsetDateTime,
    pub user_id: UserId,
}

#[derive(Clone, Debug, Serialize, Deserialize, sqlx::Type)]
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

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(transparent)]
pub struct FeedId(pub Uuid);

impl From<Uuid> for FeedId {
    fn from(value: Uuid) -> Self {
        FeedId(value)
    }
}

impl Id  for FeedId {
    fn uuid(&self) -> Uuid {
        self.0
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
#[tsync]
pub struct Feed {
    pub id: FeedId,
    pub url: String,
    pub title: String,
    pub kind: FeedKind,
    #[serde(with = "time::serde::rfc3339")]
    pub last_updated: OffsetDateTime,
    pub disabled: bool,
    pub icon: Option<String>,
    pub html_url: Option<String>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type)]
#[sqlx(transparent)]
pub struct ArticleId(pub Uuid);

impl From<Uuid> for ArticleId {
    fn from(value: Uuid) -> Self {
        ArticleId(value)
    }
}

impl Id  for ArticleId {
    fn uuid(&self) -> Uuid {
        self.0
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
#[tsync]
pub struct Article {
    pub id: ArticleId,
    pub article_id: String,
    pub feed_id: FeedId,
    pub title: String,
    pub content: String,
    #[serde(with = "time::serde::rfc3339")]
    pub published: OffsetDateTime,
    pub link: Option<String>,
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
    pub id: SessionId,
    #[serde(with = "time::serde::rfc3339")]
    pub expires: OffsetDateTime,
}
