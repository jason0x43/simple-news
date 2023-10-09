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
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub config: Option<serde_json::Value>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Password {
    pub id: Uuid,
    pub hash: String,
    pub salt: String,
    pub user_id: Uuid,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    pub id: Uuid,
    pub data: serde_json::Value,
    pub expires: OffsetDateTime,
    pub user_id: Uuid,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionResponse {
    pub id: Uuid,
    pub expires: OffsetDateTime,
}
