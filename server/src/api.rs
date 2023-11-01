use axum::{
    extract::{Path, State},
    Json,
};
use axum_extra::extract::{cookie::Cookie, CookieJar};
use log::info;

use crate::{
    error::AppError,
    state::AppState,
    types::{
        AddFeedRequest, AddGroupFeedRequest, Article, CreateFeedGroupRequest,
        CreateSessionRequest, CreateUserRequest, Feed, FeedGroup, FeedGroupId,
        FeedId, FeedLog, FeedStats, Password, Session, User, FeedStat,
    },
    util::check_password,
};

pub(crate) async fn create_user(
    state: State<AppState>,
    Json(body): Json<CreateUserRequest>,
) -> Result<Json<User>, AppError> {
    let mut tx = state.pool.begin().await?;

    let user = User::create(&mut *tx, body.email, body.username).await?;
    Password::create(&mut *tx, &body.password, &user.id).await?;

    tx.commit().await?;

    Ok(Json(user))
}

pub(crate) async fn get_users(
    _session: Session,
    state: State<AppState>,
) -> Result<Json<Vec<User>>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let users = User::get_all(&mut conn).await?;
    Ok(Json(users))
}

pub(crate) async fn get_session_user(
    session: Session,
    state: State<AppState>,
) -> Result<Json<User>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let user = User::get(&mut conn, session.user_id).await?;
    Ok(Json(user))
}

pub(crate) async fn create_session(
    state: State<AppState>,
    jar: CookieJar,
    Json(body): Json<CreateSessionRequest>,
) -> Result<(CookieJar, Json<Session>), AppError> {
    info!("Logging in user {}", body.username);

    let mut conn = state.pool.acquire().await?;
    let user = User::get_by_username(&mut conn, &body.username).await?;
    let password = Password::get_by_user_id(&mut conn, &user.id).await?;

    check_password(&body.password, &password.hash, &password.salt)?;

    let session = Session::create(&mut conn, user.id).await?;

    Ok((
        jar.add(Cookie::new("session_id", session.id.to_string())),
        Json(session),
    ))
}

pub(crate) async fn get_articles(
    _session: Session,
    state: State<AppState>,
) -> Result<Json<Vec<Article>>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let articles = Article::get_all(&mut *conn).await?;
    Ok(Json(articles))
}

pub(crate) async fn get_feed_articles(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<Json<Vec<Article>>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let articles = Article::find_all_for_feed(&mut *conn, &id).await?;
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
    Path(id): Path<FeedId>,
) -> Result<(), AppError> {
    let mut conn = state.pool.acquire().await?;
    Feed::delete(&mut conn, &id).await?;
    Ok(())
}

pub(crate) async fn get_feed(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<Json<Feed>, AppError> {
    log::debug!("getting feed {}", id);
    let mut conn = state.pool.acquire().await?;
    let feed = Feed::get(&mut conn, &id).await?;
    Ok(Json(feed))
}

pub(crate) async fn get_feeds(
    _session: Session,
    state: State<AppState>,
) -> Result<Json<Vec<Feed>>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let feeds = Feed::get_all(&mut conn).await?;
    Ok(Json(feeds))
}

pub(crate) async fn refresh_feed(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<(), AppError> {
    let mut tx = state.pool.begin().await?;
    let feed = Feed::get(&mut *tx, &id).await?;
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

pub(crate) async fn get_feed_log(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<Json<Vec<FeedLog>>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let logs = FeedLog::find_for_feed(&mut conn, id).await?;
    Ok(Json(logs))
}

pub(crate) async fn get_all_feed_logs(
    _session: Session,
    state: State<AppState>,
) -> Result<Json<Vec<FeedLog>>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let logs = FeedLog::get_all(&mut conn).await?;
    Ok(Json(logs))
}

pub(crate) async fn create_feed_group(
    session: Session,
    state: State<AppState>,
    Json(body): Json<CreateFeedGroupRequest>,
) -> Result<Json<FeedGroup>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let user_id = session.user_id;
    let group = FeedGroup::create(&mut conn, body.name, user_id).await?;
    Ok(Json(group))
}

pub(crate) async fn get_feed_group(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedGroupId>,
) -> Result<Json<Vec<Feed>>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let feeds = Feed::get_for_group(&mut conn, &id).await?;
    Ok(Json(feeds))
}

pub(crate) async fn get_all_feed_groups(
    _session: Session,
    state: State<AppState>,
) -> Result<Json<Vec<FeedGroup>>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let groups = FeedGroup::get_all(&mut conn).await?;
    Ok(Json(groups))
}

pub(crate) async fn add_group_feed(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedGroupId>,
    Json(body): Json<AddGroupFeedRequest>,
) -> Result<Json<FeedGroup>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let group = FeedGroup::get(&mut conn, &id).await?;
    group.add_feed(&mut conn, body.feed_id).await?;
    Ok(Json(group))
}

pub(crate) async fn remove_group_feed(
    _session: Session,
    state: State<AppState>,
    Path((id, feed_id)): Path<(FeedGroupId, FeedId)>,
) -> Result<Json<FeedGroup>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let group = FeedGroup::get(&mut conn, &id).await?;
    group.remove_feed(&mut conn, &feed_id).await?;
    Ok(Json(group))
}

pub(crate) async fn get_feed_stats(
    session: Session,
    state: State<AppState>,
) -> Result<Json<FeedStats>, AppError> {
    let mut conn = state.pool.acquire().await?;
    let subscribed = Feed::get_subscribed(&mut conn, &session.user_id).await?;
    let mut stats = FeedStats::new();
    for feed in subscribed.iter() {
        let num_articles = feed.article_count(&mut conn).await?;
        stats.feeds.insert(
            feed.id.clone(),
            FeedStat {
                total: num_articles,
                read: 0,
            },
        );
    }
    Ok(Json(stats))
}
