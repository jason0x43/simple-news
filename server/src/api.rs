use axum::{extract::State, Json};
use axum_extra::extract::{cookie::Cookie, CookieJar};
use log::info;

use crate::{
    error::AppError,
    state::AppState,
    types::{
        AddFeedRequest, CreateSessionRequest, CreateUserRequest, Feed,
        Password, Session, User,
    },
    util::check_password,
};

pub(crate) async fn create_user(
    state: State<AppState>,
    Json(body): Json<CreateUserRequest>,
) -> Result<Json<User>, AppError> {
    let mut tx = state.pool.begin().await?;

    let user = User::create(&mut *tx, body.email, body.username).await?;
    Password::create(&mut *tx, body.password, user.id).await?;

    tx.commit().await?;

    Ok(Json(user))
}

pub(crate) async fn list_users(
    state: State<AppState>,
) -> Result<Json<Vec<User>>, AppError> {
    let users = User::find_all(&state.pool).await?;
    Ok(Json(users))
}

pub(crate) async fn create_session(
    state: State<AppState>,
    jar: CookieJar,
    Json(body): Json<CreateSessionRequest>,
) -> Result<(CookieJar, Json<Session>), AppError> {
    info!("Logging in user {}", body.username);

    let user = User::get_by_username(&state.pool, body.username).await?;
    let password = Password::get_by_user_id(&state.pool, user.id).await?;

    check_password(body.password, password.hash, password.salt)?;

    let session = Session::create(&state.pool, user.id).await?;

    Ok((
        jar.add(Cookie::new("session_id", session.id.to_string())),
        Json(session),
    ))
}

pub(crate) async fn get_articles(
    _session: Session,
) -> Result<String, AppError> {
    info!("Got articles");
    Ok("Some articles".into())
}

pub(crate) async fn add_feed(
    _session: Session,
    state: State<AppState>,
    Json(body): Json<AddFeedRequest>,
) -> Result<(), AppError> {
    Feed::create(&state.pool, body.url, body.title, body.kind).await?;
    Ok(())
}
