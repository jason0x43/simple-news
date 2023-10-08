use serde::{Deserialize, Serialize};
use time::OffsetDateTime;
use uuid::Uuid;

#[derive(Deserialize, Serialize)]
pub struct CreateUserRequest {
    pub email: String,
    pub username: String,
    pub password: String,
}

#[derive(Deserialize, Serialize)]
pub struct CreateSessionRequest {
    pub username: String,
    pub password: String,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct User {
    pub(crate) id: Uuid,
    pub(crate) email: String,
    pub(crate) username: String,
    pub(crate) config: Option<serde_json::Value>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Password {
    pub(crate) id: Uuid,
    pub(crate) hash: String,
    pub(crate) salt: String,
    pub(crate) user_id: Uuid,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Session {
    pub(crate) id: Uuid,
    pub(crate) data: serde_json::Value,
    pub(crate) expires: OffsetDateTime,
    pub(crate) user_id: Uuid,
}
