use serde::{Serialize, Deserialize};
use uuid::Uuid;

use crate::util::hash_password;

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct User {
    pub(crate) id: Uuid,
    pub(crate) email: String,
    pub(crate) username: String,
    pub(crate) config: Option<serde_json::Value>,
}

impl User {
    pub(crate) fn create(email: String, username: String) -> Self {
        User {
            id: Uuid::new_v4(),
            email,
            username,
            config: None,
        }
    }
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Password {
    pub(crate) id: Uuid,
    pub(crate) hash: String,
    pub(crate) salt: String,
    pub(crate) user_id: Uuid,
}

impl Password {
    pub(crate) fn create(password: String, user_id: Uuid) -> Self {
        let pword = hash_password(password);
        Password {
            id: Uuid::new_v4(),
            hash: pword.hash,
            salt: pword.salt,
            user_id
        }
    }
}
