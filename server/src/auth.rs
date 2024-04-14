use axum::async_trait;
use axum_login::{
    AuthManagerLayer, AuthManagerLayerBuilder, AuthUser as IsAuthUser,
    AuthnBackend, UserId as AuthUserId,
};
use serde::Deserialize;
use sqlx::SqlitePool;
use std::fmt::Debug;
use tower_sessions::{Expiry, SessionManagerLayer};
use tower_sessions_sqlx_store::SqliteStore;

use crate::{
    error::AppError,
    types::{self, User, UserId},
};

#[derive(Clone)]
pub(crate) struct AuthUser {
    pub(crate) user: User,
    pw_hash: String,
}

impl AuthUser {
    fn from_user_pass(user: types::User, pword: types::Password) -> Self {
        Self {
            user,
            pw_hash: pword.hash,
        }
    }
}

impl Debug for AuthUser {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("User")
            .field("id", &self.user.id)
            .field("username", &self.user.username)
            .field("password", &"[redacted]")
            .finish()
    }
}

impl IsAuthUser for AuthUser {
    type Id = UserId;

    fn id(&self) -> Self::Id {
        self.user.id.clone()
    }

    fn session_auth_hash(&self) -> &[u8] {
        self.pw_hash.as_bytes()
    }
}

#[derive(Debug, Clone)]
pub(crate) struct Backend {
    db: SqlitePool,
}

impl Backend {
    pub(crate) fn new(db: SqlitePool) -> Self {
        Self { db }
    }
}

impl From<axum_login::Error<Backend>> for AppError {
    fn from(err: axum_login::Error<Backend>) -> AppError {
        AppError::Error(format!("auth error: {}", err))
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct Credentials {
    pub username: String,
    pub password: String,
    /// The URL to redirect to after a successful login.
    pub next: Option<String>,
}

#[async_trait]
impl AuthnBackend for Backend {
    type User = AuthUser;
    type Credentials = Credentials;
    type Error = AppError;

    async fn authenticate(
        &self,
        creds: Self::Credentials,
    ) -> Result<Option<Self::User>, Self::Error> {
        let user =
            types::User::get_by_username(&self.db, &creds.username).await?;
        let pword = user.password(&self.db).await?;
        pword.matches(&creds.password)?;
        Ok(Some(Self::User::from_user_pass(user, pword)))
    }

    async fn get_user(
        &self,
        user_id: &AuthUserId<Self>,
    ) -> Result<Option<Self::User>, Self::Error> {
        let user = types::User::get(&self.db, user_id.clone()).await?;
        let pword = user.password(&self.db).await?;
        Ok(Some(Self::User::from_user_pass(user, pword)))
    }
}

pub(crate) type AuthSession = axum_login::AuthSession<Backend>;

pub(crate) fn get_user(auth_session: &AuthSession) -> Result<User, AppError> {
    if let Some(user) = &auth_session.user {
        Ok(user.user.clone())
    } else {
        Err(AppError::Unauthorized)
    }
}

pub(crate) async fn create_auth_layer(
    pool: &SqlitePool,
) -> Result<AuthManagerLayer<Backend, SqliteStore>, AppError> {
    let session_store = SqliteStore::new(pool.clone());
    session_store.migrate().await?;
    let session_service = SessionManagerLayer::new(session_store)
        .with_secure(false)
        .with_expiry(Expiry::OnInactivity(time::Duration::days(5)));

    let backend = Backend::new(pool.clone());
    let auth_layer =
        AuthManagerLayerBuilder::new(backend, session_service).build();

    Ok(auth_layer)
}
