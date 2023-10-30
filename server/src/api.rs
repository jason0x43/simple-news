use axum::{
    extract::{Path, State},
    Json,
};
use axum_extra::extract::{cookie::Cookie, CookieJar};
use axum_macros::debug_handler;
use log::info;
use uuid::Uuid;

use crate::{
    error::AppError,
    state::AppState,
    types::{
        AddFeedRequest, CreateSessionRequest, CreateUserRequest, Feed,
        Password, Session, User, Article,
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

pub(crate) async fn get_users(
    _session: Session,
    state: State<AppState>,
) -> Result<Json<Vec<User>>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let users = User::find_all(&mut conn).await?;
    Ok(Json(users))
}

pub(crate) async fn create_session(
    state: State<AppState>,
    jar: CookieJar,
    Json(body): Json<CreateSessionRequest>,
) -> Result<(CookieJar, Json<Session>), AppError> {
    info!("Logging in user {}", body.username);

    let mut conn = state.pool.acquire().await?;
    let user = User::get_by_username(&mut conn, body.username).await?;
    let password = Password::get_by_user_id(&mut conn, user.id).await?;

    check_password(body.password, password.hash, password.salt)?;

    let session = Session::create(&mut conn, user.id).await?;

    Ok((
        jar.add(Cookie::new("session_id", session.id.to_string())),
        Json(session),
    ))
}

#[debug_handler]
pub(crate) async fn get_articles(
    _session: Session,
    state: State<AppState>,
) -> Result<Json<Vec<Article>>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let articles = Article::find_all(&mut *conn).await?;
    Ok(Json(articles))
}

pub(crate) async fn get_feed_articles(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Vec<Article>>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let articles = Article::find_all_for_feed(&mut *conn, id).await?;
    Ok(Json(articles))
}

pub(crate) async fn add_feed(
    _session: Session,
    state: State<AppState>,
    Json(body): Json<AddFeedRequest>,
) -> Result<(), AppError> {
    log::debug!("adding feed with {:?}", body);
    let mut conn = state.pool.acquire().await?;
    Feed::create(&mut conn, body.url, body.title, body.kind).await?;
    Ok(())
}

pub(crate) async fn delete_feed(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<(), AppError> {
    let mut conn = state.pool.acquire().await?;
    Feed::delete(&mut conn, id).await?;
    Ok(())
}

pub(crate) async fn get_feed(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Feed>, AppError> {
    log::debug!("getting feed {}", id);
    let mut conn = state.pool.acquire().await?;
    let feed = Feed::get(&mut conn, id).await?;
    Ok(Json(feed))
}

pub(crate) async fn get_feeds(
    _session: Session,
    state: State<AppState>,
) -> Result<Json<Vec<Feed>>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let feeds = Feed::find_all(&mut conn).await?;
    Ok(Json(feeds))
}

pub(crate) async fn refresh_feed(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<(), AppError> {
    let mut tx = state.pool.begin().await?;
    let feed = Feed::get(&mut *tx, id).await?;
    log::debug!("refreshing feed at {}", feed.url);
    feed.refresh(&mut *tx).await?;
    tx.commit().await?;
    Ok(())
}

pub(crate) async fn refresh_feeds(
    _session: Session,
    state: State<AppState>,
) -> Result<(), AppError> {
    let mut tx = state.pool.begin().await?;
    log::debug!("refreshing all feeds");
    Feed::refresh_all(&mut *tx).await?;
    tx.commit().await?;
    Ok(())
}
