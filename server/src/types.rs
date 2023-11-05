// These are types that are shared between the server, cli, and client

use std::{collections::HashMap, fmt::Display};

use macros::Id;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use time::OffsetDateTime;
use tsync::tsync;
use url::Url;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, Id)]
#[sqlx(transparent)]
pub struct UserId(pub String);

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
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

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, Id)]
#[sqlx(transparent)]
pub struct PasswordId(pub String);

#[derive(Clone, Serialize, Deserialize, FromRow)]
pub struct Password {
    pub id: PasswordId,
    pub hash: String,
    pub salt: String,
    pub user_id: UserId,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, Id)]
#[sqlx(transparent)]
pub struct SessionId(pub String);

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Session {
    pub id: SessionId,
    pub data: serde_json::Value,
    #[serde(with = "time::serde::rfc3339")]
    pub expires: OffsetDateTime,
    pub user_id: UserId,
}

#[derive(Clone, Debug, Serialize, Deserialize, sqlx::Type)]
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

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, Id)]
#[sqlx(transparent)]
pub struct FeedId(pub String);

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[tsync]
pub struct Feed {
    pub id: FeedId,
    pub url: String,
    pub title: String,
    pub kind: FeedKind,
    pub disabled: bool,
    pub icon: Option<String>,
    pub html_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, Id)]
#[sqlx(transparent)]
pub struct ArticleId(pub String);

#[derive(Debug, Clone, Serialize, Deserialize)]
#[tsync]
pub struct ArticleUserData {
    pub read: bool,
    pub saved: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[tsync]
pub struct ArticleSummary {
    pub id: ArticleId,
    pub article_id: String,
    pub feed_id: FeedId,
    pub title: String,
    #[serde(with = "time::serde::rfc3339")]
    pub published: OffsetDateTime,
    pub link: Option<String>,
    pub read: bool,
    pub saved: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, Id)]
#[sqlx(transparent)]
pub struct UserArticleId(pub String);

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[tsync]
pub struct UserArticle {
    pub id: UserArticleId,
    pub user_id: UserId,
    pub article_id: ArticleId,
    pub read: bool,
    pub saved: bool,
}

#[derive(Deserialize, Serialize)]
#[tsync]
pub struct CreateUserRequest {
    pub email: String,
    pub username: String,
    pub password: String,
}

#[derive(Deserialize, Serialize)]
#[tsync]
pub struct CreateSessionRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[tsync]
pub struct AddFeedRequest {
    pub url: Url,
    pub title: Option<String>,
    pub kind: Option<FeedKind>,
}

#[derive(Debug, Deserialize, Serialize)]
#[tsync]
pub struct UpdateFeedRequest {
    pub url: Option<Url>,
    pub title: Option<String>,
}

#[derive(Clone, Serialize, Deserialize)]
#[tsync]
pub struct SessionResponse {
    pub id: SessionId,
    #[serde(with = "time::serde::rfc3339")]
    pub expires: OffsetDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, Id)]
#[sqlx(transparent)]
pub struct FeedLogId(pub String);

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct FeedLog {
    pub id: FeedLogId,
    pub feed_id: FeedId,
    #[serde(with = "time::serde::rfc3339")]
    pub time: OffsetDateTime,
    pub success: bool,
    pub message: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[tsync]
pub struct CreateFeedGroupRequest {
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, Id)]
#[sqlx(transparent)]
pub struct FeedGroupId(pub String);

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[tsync]
pub struct FeedGroup {
    pub id: FeedGroupId,
    pub name: String,
    pub user_id: UserId,
}

#[derive(Debug, Deserialize, Serialize)]
#[tsync]
pub struct AddGroupFeedRequest {
    pub feed_id: FeedId,
    pub move_feed: Option<bool>
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, Id)]
#[sqlx(transparent)]
pub struct FeedGroupFeedId(pub String);

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct FeedGroupFeed {
    pub id: FeedGroupFeedId,
    pub feed_group_id: FeedGroupId,
    pub feed_id: FeedId,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[tsync]
pub struct FeedGroupWithFeeds {
    pub id: FeedGroupId,
    pub name: String,
    pub user_id: UserId,
    pub feed_ids: Vec<FeedId>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[tsync]
pub struct FeedStat {
    pub total: i32,
    pub read: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[tsync]
pub struct FeedStats {
    pub feeds: HashMap<FeedId, Option<FeedStat>>,
    pub saved: i32,
}

impl FeedStats {
    pub fn new() -> Self {
        Self {
            feeds: HashMap::new(),
            saved: 0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[tsync]
pub struct ArticleMarkRequest {
    pub read: Option<bool>,
    pub saved: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[tsync]
pub struct ArticlesMarkRequest {
    pub article_ids: Vec<ArticleId>,
    pub mark: ArticleMarkRequest,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[tsync]
pub struct ArticlesMarkResponse {
    pub article_ids: Vec<ArticleId>,
}
