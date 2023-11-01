use std::ops::Add;
use time::{Duration, OffsetDateTime};

use log::error;
use rand::{distributions::Alphanumeric, Rng};
use sha2::{Digest, Sha512};

use crate::error::AppError;

pub(crate) struct HashedPassword {
    pub(crate) hash: String,
    pub(crate) salt: String,
}

/// Hash a password, returning the hash and salt values
pub(crate) fn hash_password(
    password: &str,
    salt: Option<&str>,
) -> HashedPassword {
    let salt: String = if let Some(salt) = salt {
        salt.into()
    } else {
        rand::thread_rng()
            .sample_iter(&Alphanumeric)
            .take(8)
            .map(char::from)
            .collect()
    };

    HashedPassword {
        hash: sha512(&(password.to_owned() + &salt)),
        salt,
    }
}

/// Return the SHA512 hash of a string
fn sha512(text: &str) -> String {
    let mut hasher = Sha512::new();
    hasher.update(text);
    let hash = hasher.finalize();
    hex::encode(hash)
}

pub(crate) fn check_password(
    password: &str,
    hash: &str,
    salt: &str,
) -> Result<(), AppError> {
    let check = hash_password(password, Some(salt));
    if &check.hash != hash {
        error!("Incorrect password");
        Err(AppError::Unauthorized)
    } else {
        Ok(())
    }
}

/// Return an OffsetDateTime in UTC offset by `offset` seconds
pub(crate) fn get_timestamp(offset: i64) -> OffsetDateTime {
    OffsetDateTime::now_utc().add(Duration::seconds(offset))
}
