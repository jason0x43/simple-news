use axum::{
    extract::{Path, Query, State},
    routing::{delete, get, patch, post},
    Json, Router,
};
use axum_macros::debug_handler;
use serde::Deserialize;

use crate::{
    error::AppError,
    extractors::AdminSession,
    rss::Feed as SynFeed,
    state::AppState,
    types::{
        AddFeedRequest, AddGroupFeedRequest, Article, ArticleId, ArticleMarkRequest, ArticleSummary, ArticlesMarkRequest, CreateFeedGroupRequest, CreateUserRequest, Credentials, Feed, FeedGroup, FeedGroupId, FeedGroupWithFeeds, FeedId, FeedLog, FeedStat, FeedStats, Session, SessionResponse, UpdateFeedRequest, User, UserId
    },
};

pub(crate) async fn create_user(
    _session: AdminSession,
    state: State<AppState>,
    Json(body): Json<CreateUserRequest>,
) -> Result<Json<User>, AppError> {
    Ok(Json(
        User::create(&state.pool, &body.email, &body.username, &body.password)
            .await?,
    ))
}

pub(crate) async fn login(
    state: State<AppState>,
    Json(credentials): Json<Credentials>,
) -> Result<Json<SessionResponse>, AppError> {
    let user =
        User::get_by_username(&state.pool, &credentials.username).await?;
    let password = user.password(&state.pool).await?;
    password.matches(&credentials.password)?;
    let session = Session::create(&state.pool, &user.id).await?;
    Ok(Json(session.into()))
}

pub(crate) async fn logout(
    session: Session,
    state: State<AppState>,
) -> Result<(), AppError> {
    session.delete(&state.pool).await?;
    Ok(())
}

#[debug_handler]
pub(crate) async fn get_session_user(
    session: Session,
    state: State<AppState>,
) -> Result<Json<User>, AppError> {
    Ok(Json(session.get_user(&state.pool).await?))
}

pub(crate) async fn get_users(
    _session: AdminSession,
    state: State<AppState>,
) -> Result<Json<Vec<User>>, AppError> {
    Ok(Json(User::get_all(&state.pool).await?))
}

#[derive(Deserialize)]
pub struct ArticlesQuery {
    saved: Option<bool>,
}

pub(crate) async fn get_articles(
    session: Session,
    state: State<AppState>,
    Query(query): Query<ArticlesQuery>,
) -> Result<Json<Vec<ArticleSummary>>, AppError> {
    let user = session.get_user(&state.pool).await?;
    let articles = user.articles(&state.pool).await?;
    let articles = if query.saved.unwrap_or(false) {
        articles.into_iter().filter(|a| a.saved).collect()
    } else {
        articles
    };
    Ok(Json(articles))
}

pub(crate) async fn get_article(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<ArticleId>,
) -> Result<Json<Article>, AppError> {
    Ok(Json(Article::get(&state.pool, &id).await?))
}

pub(crate) async fn mark_article(
    session: Session,
    state: State<AppState>,
    Path(id): Path<ArticleId>,
    Json(body): Json<ArticleMarkRequest>,
) -> Result<(), AppError> {
    log::info!("marking {} as {:?}", id, body);
    let article = Article::get(&state.pool, &id).await?;
    article.mark(&state.pool, &session.user_id, &body).await?;
    log::info!("marked {}", id);
    Ok(())
}

pub(crate) async fn mark_articles(
    session: Session,
    state: State<AppState>,
    Json(body): Json<ArticlesMarkRequest>,
) -> Result<(), AppError> {
    Article::mark_all(&state.pool, &session.user_id, &body).await?;
    Ok(())
}

pub(crate) async fn get_feed_articles(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<Json<Vec<ArticleSummary>>, AppError> {
    Ok(Json(
        Feed::get(&state.pool, &id)
            .await?
            .articles(&state.pool)
            .await?,
    ))
}

pub(crate) async fn add_feed(
    _session: Session,
    state: State<AppState>,
    Json(body): Json<AddFeedRequest>,
) -> Result<(), AppError> {
    log::debug!("adding feed with {:?}", body);
    let title = SynFeed::load(body.url.as_str()).await?.title;
    Feed::create(&state.pool, body.url, &title, body.kind).await?;
    Ok(())
}

pub(crate) async fn delete_feed(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<(), AppError> {
    Feed::delete(&state.pool, &id).await?;
    Ok(())
}

pub(crate) async fn update_feed(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
    Json(body): Json<UpdateFeedRequest>,
) -> Result<(), AppError> {
    let mut feed = Feed::get(&state.pool, &id).await?;
    feed.update(&state.pool, body).await?;
    Ok(())
}

pub(crate) async fn get_feed(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<Json<Feed>, AppError> {
    log::debug!("getting feed {}", id);
    Ok(Json(Feed::get(&state.pool, &id).await?))
}

pub(crate) async fn get_feeds(
    state: State<AppState>,
) -> Result<Json<Vec<Feed>>, AppError> {
    Ok(Json(Feed::get_all(&state.pool).await?))
}

pub(crate) async fn refresh_feed(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<(), AppError> {
    let feed = Feed::get(&state.pool, &id).await?;
    log::debug!("refreshing feed at {}", feed.url);
    feed.refresh(&state.pool).await?;
    Ok(())
}

pub(crate) async fn refresh_feeds(
    _session: Session,
    state: State<AppState>,
) -> Result<(), AppError> {
    log::debug!("refreshing all feeds");
    Feed::refresh_all(&state.pool).await?;
    Ok(())
}

pub(crate) async fn get_feed_log(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<Json<Vec<FeedLog>>, AppError> {
    Ok(Json(FeedLog::find_for_feed(&state.pool, id).await?))
}

pub(crate) async fn get_all_feed_logs(
    _session: Session,
    state: State<AppState>,
) -> Result<Json<Vec<FeedLog>>, AppError> {
    Ok(Json(FeedLog::get_all(&state.pool).await?))
}

pub(crate) async fn create_feed_group(
    session: Session,
    state: State<AppState>,
    Json(body): Json<CreateFeedGroupRequest>,
) -> Result<Json<FeedGroupWithFeeds>, AppError> {
    let group =
        FeedGroup::create(&state.pool, &body.name, &session.user_id).await?;
    Ok(Json(FeedGroupWithFeeds {
        id: group.id,
        name: group.name,
        user_id: group.user_id,
        feed_ids: vec![],
    }))
}

pub(crate) async fn get_feed_group(
    _session: Session,
    state: State<AppState>,
    Path(id): Path<FeedGroupId>,
) -> Result<Json<FeedGroupWithFeeds>, AppError> {
    Ok(Json(
        FeedGroup::get(&state.pool, &id)
            .await?
            .with_feeds(&state.pool)
            .await?,
    ))
}

pub(crate) async fn get_all_feed_groups(
    session: Session,
    state: State<AppState>,
) -> Result<Json<Vec<FeedGroupWithFeeds>>, AppError> {
    let groups: Vec<FeedGroup> =
        FeedGroup::get_all(&state.pool, &session.user_id).await?;
    log::debug!("got groups: {:?}", groups);
    let mut groups_with_feeds: Vec<FeedGroupWithFeeds> = vec![];
    for group in groups {
        let group_with_feeds = group.with_feeds(&state.pool).await?;
        groups_with_feeds.push(group_with_feeds);
    }
    Ok(Json(groups_with_feeds))
}

pub(crate) async fn add_group_feed(
    session: Session,
    state: State<AppState>,
    Path(id): Path<FeedGroupId>,
    Json(body): Json<AddGroupFeedRequest>,
) -> Result<(), AppError> {
    let group = FeedGroup::get(&state.pool, &id).await?;
    check_authorized(&session, &group.user_id)?;

    if body.move_feed.unwrap_or(false) {
        group.move_feed(&state.pool, body.feed_id).await?;
    } else {
        group.add_feed(&state.pool, body.feed_id).await?;
    }

    Ok(())
}

pub(crate) async fn remove_group_feed(
    session: Session,
    state: State<AppState>,
    Path((id, feed_id)): Path<(FeedGroupId, FeedId)>,
) -> Result<Json<FeedGroupWithFeeds>, AppError> {
    let group = FeedGroup::get(&state.pool, &id).await?;
    check_authorized(&session, &group.user_id)?;

    group.remove_feed(&state.pool, &feed_id).await?;
    Ok(Json(group.with_feeds(&state.pool).await?))
}

pub(crate) async fn get_feed_group_articles(
    session: Session,
    state: State<AppState>,
    Path(id): Path<FeedGroupId>,
) -> Result<Json<Vec<ArticleSummary>>, AppError> {
    let group = FeedGroup::get(&state.pool, &id).await?;
    check_authorized(&session, &group.user_id)?;
    Ok(Json(group.articles(&state.pool).await?))
}

pub(crate) async fn get_feed_stat(
    session: Session,
    state: State<AppState>,
    Path(id): Path<FeedId>,
) -> Result<Json<FeedStat>, AppError> {
    let feed = Feed::get(&state.pool, &id).await?;
    Ok(Json(feed.stats(&state.pool, &session.user_id).await?))
}

#[derive(Deserialize)]
pub(crate) struct GetFeedStatsQuery {
    pub(crate) all: Option<bool>,
}

pub(crate) async fn get_feed_stats(
    session: Session,
    state: State<AppState>,
    Query(query): Query<GetFeedStatsQuery>,
) -> Result<Json<FeedStats>, AppError> {
    let feeds = if query.all.unwrap_or(false) {
        Feed::get_all(&state.pool).await?
    } else {
        Feed::get_subscribed(&state.pool, &session.user_id).await?
    };

    let mut stats = FeedStats::new();
    for feed in feeds.iter() {
        stats.insert(
            feed.id.clone(),
            Some(feed.stats(&state.pool, &session.user_id).await?),
        );
    }

    Ok(Json(stats))
}

/// Check if the session is authorized to work with a given user ID's resources
fn check_authorized(
    session: &Session,
    user_id: &UserId,
) -> Result<(), AppError> {
    if session.user_id != *user_id {
        return Err(AppError::Unauthorized);
    }
    Ok(())
}

pub(crate) fn get_router() -> Router<AppState> {
    Router::new()
        .route("/me", get(get_session_user))
        .route("/users", post(create_user))
        .route("/users", get(get_users))
        .route("/login", post(login))
        .route("/logout", get(logout))
        .route("/articles", get(get_articles))
        .route("/articles", patch(mark_articles))
        .route("/articles/:id", get(get_article))
        .route("/articles/:id", patch(mark_article))
        .route("/feeds/log", get(get_all_feed_logs))
        .route("/feeds/refresh", get(refresh_feeds))
        .route("/feeds/:id/refresh", get(refresh_feed))
        .route("/feeds/:id/articles", get(get_feed_articles))
        .route("/feeds/:id/log", get(get_feed_log))
        .route("/feeds/:id/stats", get(get_feed_stat))
        .route("/feeds/:id", get(get_feed))
        .route("/feeds/:id", delete(delete_feed))
        .route("/feeds/:id", patch(update_feed))
        .route("/feeds", get(get_feeds))
        .route("/feeds", post(add_feed))
        .route("/feedgroups", get(get_all_feed_groups))
        .route("/feedgroups", post(create_feed_group))
        .route("/feedgroups/:id", get(get_feed_group))
        .route("/feedgroups/:id", post(add_group_feed))
        .route("/feedgroups/:id/articles", get(get_feed_group_articles))
        .route("/feedgroups/:id/:feed_id", delete(remove_group_feed))
        .route("/feedstats", get(get_feed_stats))
}
