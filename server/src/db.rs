use std::ops::Add;

use crate::{
    types::{Password, Session, User},
    util::hash_password,
};
use serde_json::json;
use time::{Duration, OffsetDateTime};
use uuid::Uuid;

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

impl Password {
    pub(crate) fn create(password: String, user_id: Uuid) -> Self {
        let pword = hash_password(password, None);
        Password {
            id: Uuid::new_v4(),
            hash: pword.hash,
            salt: pword.salt,
            user_id,
        }
    }
}

impl Session {
    pub(crate) fn create(user_id: Uuid) -> Self {
        let seven_days = Duration::new(604800, 0);

        Session {
            id: Uuid::new_v4(),
            data: json!("{}"),
            user_id,
            expires: OffsetDateTime::now_utc().add(seven_days),
        }
    }
}
