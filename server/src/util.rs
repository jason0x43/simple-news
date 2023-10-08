use rand::{distributions::Alphanumeric, Rng};
use sha2::{Digest, Sha512};

use crate::error::AppError;

pub(crate) struct HashedPassword {
    pub(crate) hash: String,
    pub(crate) salt: String,
}

/// Hash a password, returning the hash and salt values
pub(crate) fn hash_password(
    password: String,
    salt: Option<String>,
) -> HashedPassword {
    let salt = if let Some(salt) = salt {
        salt
    } else {
        rand::thread_rng()
            .sample_iter(&Alphanumeric)
            .take(8)
            .map(char::from)
            .collect()
    };

    HashedPassword {
        hash: sha512(password + &salt),
        salt,
    }
}

/// Return the SHA512 hash of a string
fn sha512(text: String) -> String {
    let mut hasher = Sha512::new();
    hasher.update(text);
    let hash = hasher.finalize();
    hex::encode(hash)
}

pub(crate) fn check_password(
    password: String,
    hash: String,
    salt: String,
) -> Result<(), AppError> {
    let check = hash_password(password, Some(salt));
    if check.hash != hash {
        Err(AppError::Unauthorized)
    } else {
        Ok(())
    }
}
